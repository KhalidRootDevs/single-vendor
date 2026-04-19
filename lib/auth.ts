import jwt from 'jsonwebtoken';
import type { IUser } from '@/models/User';
import type { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: (user._id as Types.ObjectId | string).toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
