import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/mail";
import type Stripe from "stripe";

// Required: disable Next.js body parsing so we get the raw bytes for signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error("[stripe-webhook] checkout.session.completed — no orderId in metadata");
          break;
        }

        const order = await db.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
          include: { items: true },
        });

        sendOrderConfirmation(order).catch((err) =>
          console.error("[stripe-webhook] confirmation email error:", err)
        );
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        await db.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const sessionId = typeof charge.payment_intent === "string"
          ? undefined
          : undefined;

        // Look up by stripeSessionId via payment_intent if available
        // Simpler: admin triggers refund from our UI which updates status directly
        // This handles the case where refund is done from Stripe Dashboard
        if (charge.payment_intent) {
          const paymentIntentId = typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent.id;

          // Find the checkout session for this payment intent
          const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntentId,
            limit: 1,
          });

          const stripeSessionId = sessions.data[0]?.id;
          if (stripeSessionId) {
            await db.order.update({
              where: { stripeSessionId },
              data: { paymentStatus: "REFUNDED" },
            });
          }
        }

        void sessionId; // unused — suppress lint
        break;
      }

      default:
        // Unhandled event types — return 200 so Stripe doesn't retry
        break;
    }
  } catch (error) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, error);
    return NextResponse.json({ error: "Internal webhook error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
