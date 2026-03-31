import { NextResponse } from "next/server";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import type Stripe from "stripe";

export async function POST(req: Request) {
  if (!isStripeEnabled) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env["STRIPE_WEBHOOK_SECRET"] ?? ""
    );
  } catch (error) {
    console.error("[Stripe webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      try {
        const order = await db.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING" },
          include: { items: { include: { customDesign: true } } },
        });

        // Send confirmation email now that payment is confirmed
        sendOrderConfirmationEmail(order.customerEmail, order).catch((err) =>
          console.error("[Stripe webhook] Email error:", err)
        );
      } catch (error) {
        console.error("[Stripe webhook] Order update failed:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
