import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  return res.json();
}

function htmlRedirect(url: string, token?: string): NextResponse {
  const cookieHeader = token
    ? `token=${token}; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }; HttpOnly; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    : '';

  const html = `<!DOCTYPE html><html><head>
    <meta http-equiv="refresh" content="0;url=${url}">
    <script>window.location.replace(${JSON.stringify(url)});</script>
  </head><body></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      ...(cookieHeader ? { 'Set-Cookie': cookieHeader } : {})
    }
  });
}

export async function GET(request: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000';
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return htmlRedirect(`${appUrl}?auth_error=google_cancelled`);
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email_verified) {
      return htmlRedirect(`${appUrl}?auth_error=email_not_verified`);
    }

    await connectDB();

    // 1. Find by googleId
    let user = await User.findOne({ googleId: googleUser.sub });

    if (!user) {
      // 2. Find by email — link the existing account
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        if (user.status === 'suspended') {
          return htmlRedirect(`${appUrl}?auth_error=account_suspended`);
        }

        // Link Google to existing email/password account
        try {
          user.googleId = googleUser.sub;
          if (!user.avatar && googleUser.picture) {
            user.avatar = googleUser.picture;
          }
          user.emailVerified = true;
          user.lastLogin = new Date();
          await user.save();
        } catch (linkErr) {
          // Log but don't block login — user exists, token is still valid
          console.error('[Google OAuth] Account link save failed:', linkErr);
          user.lastLogin = new Date();
        }
      } else {
        // 3. Create brand-new user from Google profile
        user = await User.create({
          name: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.sub,
          avatar: googleUser.picture,
          emailVerified: true,
          status: 'active',
          role: 'user',
          lastLogin: new Date()
        });
      }
    } else {
      if (user.status === 'suspended') {
        return htmlRedirect(`${appUrl}?auth_error=account_suspended`);
      }
      user.lastLogin = new Date();
      await user.save();
    }

    const token = generateToken(user);
    return htmlRedirect(`${appUrl}?auth_success=google`, token);
  } catch (err) {
    console.error('[Google OAuth] Callback error:', err);
    return htmlRedirect(`${appUrl}?auth_error=server_error`);
  }
}
