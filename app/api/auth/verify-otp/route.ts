import { NextResponse } from 'next/server';
import { verifyOTP, findOrCreateUser, getUser, signToken } from '@/lib/auth-server';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json() as { phone?: string; otp?: string };

    if (!phone || !otp || otp.length !== 6) {
      return NextResponse.json({ error: 'Phone and 6-digit code required.' }, { status: 400 });
    }

    const valid = await verifyOTP(phone, otp);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect or expired code.' }, { status: 401 });
    }

    const userId = await findOrCreateUser(phone);
    const user = await getUser(userId);
    const token = signToken(userId, phone);

    const res = NextResponse.json({ token, user });
    res.cookies.set('trinitect_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: THIRTY_DAYS,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('verify-otp error', err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
