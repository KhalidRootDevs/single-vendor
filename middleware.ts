import { type NextRequest, NextResponse } from 'next/server';

const ADMIN_PREFIXES = ['/api/admin'];
const USER_PREFIXES = ['/api/user', '/api/addresses'];

// Edge-compatible JWT verification using Web Crypto API.
// jsonwebtoken uses Node.js crypto — not available in Edge Runtime.
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

async function verifyJWT(
  token: string,
  secret: string
): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const payload = JSON.parse(base64UrlDecode(payloadB64));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = Uint8Array.from(base64UrlDecode(signatureB64), (c) =>
      c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    return isValid ? payload : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isUserRoute = USER_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminRoute && !isUserRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Middleware] JWT_SECRET not set');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  const payload = await verifyJWT(token, secret);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  if (isAdminRoute && payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/user/:path*', '/api/addresses/:path*']
};
