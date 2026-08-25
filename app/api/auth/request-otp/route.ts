import { NextResponse } from 'next/server';
import { createAndSendOTP } from '@/lib/auth-server';

const US_PHONE_RE = /^\+1[2-9]\d{9}$/;

export async function POST(req: Request) {
  try {
    const { phone } = await req.json() as { phone?: string };

    if (!phone || !US_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'A valid US phone number is required.' }, { status: 400 });
    }

    await createAndSendOTP(phone);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('request-otp error', err);
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 });
  }
}
