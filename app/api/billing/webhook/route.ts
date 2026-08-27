import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { updateUserFields } from '@/lib/auth-server';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await updateUserFields(userId, {
          subscriptionPlan: sub.status === 'active' ? 'pro' : 'free',
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        await updateUserFields(userId, {
          subscriptionPlan: 'free',
          subscriptionStatus: 'canceled',
        });
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice & { subscription?: string | { id: string } };
        const subId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const userId = sub.metadata?.userId;
          if (userId) {
            await updateUserFields(userId, { subscriptionPlan: 'free', subscriptionStatus: 'past_due' });
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
