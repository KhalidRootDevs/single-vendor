import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Cart } from '@/models/Cart';
import { User } from '@/models/User';
import { sendAbandonedCartEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function GET(_request: NextRequest) {
  await connectDB();

  const cutoff = new Date(Date.now() - TWO_HOURS_MS);
  const reminderCutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  const abandonedCarts = await Cart.find({
    'items.0': { $exists: true },
    updatedAt: { $lt: cutoff },
    $or: [
      { reminderSentAt: { $exists: false } },
      { reminderSentAt: { $lt: reminderCutoff } }
    ]
  })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({
    count: abandonedCarts.length,
    carts: abandonedCarts
  });
}

export async function POST(_request: NextRequest) {
  await connectDB();

  const cutoff = new Date(Date.now() - TWO_HOURS_MS);
  const reminderCutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  const abandonedCarts = await Cart.find({
    'items.0': { $exists: true },
    updatedAt: { $lt: cutoff },
    $or: [
      { reminderSentAt: { $exists: false } },
      { reminderSentAt: { $lt: reminderCutoff } }
    ]
  })
    .limit(100)
    .lean();

  let sent = 0;
  const errors: string[] = [];

  for (const cart of abandonedCarts) {
    try {
      const user = await User.findById(cart.userId).select('name email').lean();
      if (!user) continue;

      await sendAbandonedCartEmail(
        user.email,
        user.name,
        cart.items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image
        }))
      );

      await Cart.findByIdAndUpdate(cart._id, { reminderSentAt: new Date() });
      sent++;
    } catch (err) {
      errors.push(String(cart._id));
      console.error('Abandoned cart email error for cart', cart._id, err);
    }
  }

  return NextResponse.json({
    message: `Sent ${sent} recovery emails`,
    sent,
    errors
  });
}
