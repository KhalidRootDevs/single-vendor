import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Bootstrap endpoint — creates the first admin user if none exists.
// Disabled in production unless ALLOW_SETUP=true is explicitly set.
export async function POST(request: NextRequest) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SETUP !== 'true'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  // Only allowed when no admin user exists yet
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return NextResponse.json(
      { error: 'Admin user already exists. Use the login page.' },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string) || 'admin@example.com';
  const password = (body.password as string) || 'Admin@123';
  const name = (body.name as string) || 'Admin';

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'admin',
    emailVerified: true,
    status: 'active'
  });

  return NextResponse.json(
    {
      message: 'Admin user created successfully',
      user: { id: admin._id, email: admin.email, role: admin.role }
    },
    { status: 201 }
  );
}

export async function GET() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_SETUP !== 'true'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const hasAdmin = !!(await User.findOne({ role: 'admin' }).select('_id'));

  return NextResponse.json({ hasAdmin });
}
