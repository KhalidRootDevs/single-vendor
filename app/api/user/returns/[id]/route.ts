import { type NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Return } from '@/models/Return';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();

  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);

  const returnRequest = await Return.findOne({
    _id: params.id,
    userId: decoded.userId
  }).lean();

  if (!returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 });
  }

  return NextResponse.json({ return: returnRequest });
}
