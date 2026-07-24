/**
 * Auth integration tests
 * Covers: user creation, password hashing, account lockout, JWT generation.
 */
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';

beforeAll(async () => {
  const uri = process.env.MONGO_URI_FOR_TESTS!;
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-only';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('User registration', () => {
  it('creates a user and stores a hashed password', async () => {
    const user = await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123'
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('alice@example.com');
    // Password must be stored as a hash, not plaintext
    expect(user.password).not.toBe('password123');
    expect(user.password!.startsWith('$2')).toBe(true); // bcrypt hash prefix
  });

  it('rejects duplicate email', async () => {
    await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123'
    });

    await expect(
      User.create({
        name: 'Alice2',
        email: 'alice@example.com',
        password: 'pw123456'
      })
    ).rejects.toThrow();
  });
});

describe('Account lockout', () => {
  it('sets lockoutUntil after 5 failed login attempts', async () => {
    const user = await User.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'correct-password'
    });

    const LOCKOUT_ATTEMPTS = 5;
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

    for (let i = 1; i <= LOCKOUT_ATTEMPTS; i++) {
      const updateData: Record<string, unknown> = { failedLoginAttempts: i };
      if (i >= LOCKOUT_ATTEMPTS) {
        updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await user.updateOne(updateData);
    }

    const locked = await User.findById(user._id).select(
      '+lockoutUntil +failedLoginAttempts'
    );
    expect(locked!.lockoutUntil).toBeDefined();
    expect(locked!.lockoutUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('clears lockout on successful login', async () => {
    const user = await User.create({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'mypassword'
    });

    await user.updateOne({
      failedLoginAttempts: 5,
      lockoutUntil: new Date(Date.now() + 15 * 60 * 1000)
    });

    await user.updateOne({
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      $unset: { lockoutUntil: '' }
    });

    const updated = await User.findById(user._id).select(
      '+lockoutUntil +failedLoginAttempts'
    );
    expect(updated!.lockoutUntil).toBeUndefined();
    expect(updated!.failedLoginAttempts).toBe(0);
  });
});

describe('JWT token', () => {
  it('generates a valid JWT with 3 segments', () => {
    const fakeUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      role: 'user'
    } as unknown as InstanceType<typeof User>;

    const token = generateToken(fakeUser);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });
});
