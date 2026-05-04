import { type NextRequest, NextResponse } from 'next/server';

interface PromoCode {
  code: string;
  discountPercent: number;
  minSubtotal?: number;
}

function loadPromoCodes(): PromoCode[] {
  const raw = process.env.PROMO_CODES;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is PromoCode =>
        typeof p.code === 'string' && typeof p.discountPercent === 'number'
    );
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code =
      typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0;

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    const promoCodes = loadPromoCodes();

    if (promoCodes.length === 0) {
      return NextResponse.json(
        { error: 'No active promo codes at this time' },
        { status: 404 }
      );
    }

    const match = promoCodes.find((p) => p.code.toUpperCase() === code);

    if (!match) {
      return NextResponse.json(
        { error: 'Invalid promo code' },
        { status: 404 }
      );
    }

    if (match.minSubtotal && subtotal < match.minSubtotal) {
      return NextResponse.json(
        {
          error: `Minimum order of $${match.minSubtotal.toFixed(
            2
          )} required for this code`
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: match.code,
      discountPercent: match.discountPercent
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
