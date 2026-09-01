import { NextResponse } from 'next/server';
import { createAndSendOTP } from '@/lib/auth-server';

const US_PHONE_RE = /^\+1[2-9]\d{9}$/;

export async function POST(req: Request) {
  try {
    const { phone } = await req.json() as { phone?: string };

    if (!phone || !US_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: 'A valid US phone number is required.' }, { status: 400 });
    }

    // OTP bypass: when BYPASS_OTP=true, skip SNS and accept 000000
    if (process.env.BYPASS_OTP === 'true') {
      return NextResponse.json({ sent: true, bypass: true });
    }

    await createAndSendOTP(phone);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('request-otp error', err);
    return NextResponse.json({ error: 'Failed to send code. Please try again.' }, { status: 500 });
  }
}
