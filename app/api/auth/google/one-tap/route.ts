import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: string;
  name: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: string;
}

async function verifyGoogleIdToken(
  credential: string
): Promise<GoogleIdTokenPayload> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      credential
    )}`
  );

  if (!res.ok) {
    throw new Error('Invalid Google ID token');
  }

  const payload: GoogleIdTokenPayload = await res.json();

  // Verify audience matches our client ID
  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Token audience mismatch');
  }

  // Verify issuer is Google
  if (
    !['accounts.google.com', 'https://accounts.google.com'].includes(
      payload.iss
    )
  ) {
    throw new Error('Invalid token issuer');
  }

  // Verify token not expired
  if (Date.now() >= Number(payload.exp) * 1000) {
    throw new Error('Token expired');
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'Missing credential' },
        { status: 400 }
      );
    }

    const googleUser = await verifyGoogleIdToken(credential);

    if (googleUser.email_verified !== 'true') {
      return NextResponse.json(
        { error: 'Google account email is not verified' },
        { status: 400 }
      );
    }

    await connectDB();

    // Same find-or-create logic as /api/auth/google/callback
    let user = await User.findOne({ googleId: googleUser.sub });

    if (!user) {
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        if (user.status === 'suspended') {
          return NextResponse.json(
            { error: 'account_suspended' },
            { status: 403 }
          );
        }

        // updateOne avoids full-document re-validation (won't choke on existing
        // subdocs that have required fields missing due to legacy/dev data)
        const linkFields: Record<string, unknown> = {
          googleId: googleUser.sub,
          emailVerified: true,
          lastLogin: new Date()
        };
        if (!user.avatar && googleUser.picture) {
          linkFields.avatar = googleUser.picture;
        }
        await User.updateOne({ _id: user._id }, { $set: linkFields });
      } else {
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.sub,
          avatar: googleUser.picture,
          emailVerified: true,
          status: 'active',
          role: 'user',
          addresses: [],
          lastLogin: new Date()
        });
      }
    } else {
      if (user.status === 'suspended') {
        return NextResponse.json(
          { error: 'account_suspended' },
          { status: 403 }
        );
      }
      await User.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    }

    const token = generateToken(user);

    const response = NextResponse.json({
      message: 'One Tap sign-in successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        emailVerified: user.emailVerified
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (err) {
    console.error('[One Tap] Error:', err);
    const message = err instanceof Error ? err.message : 'Sign-in failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
