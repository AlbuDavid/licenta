import { NextResponse } from "next/server";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { db } from "@/lib/db";

interface StripeCheckoutBody {
  orderId: string;
}

export async function POST(req: Request) {
  if (!isStripeEnabled) {
    return NextResponse.json(
      { error: "Plata cu cardul nu este disponibilă momentan." },
      { status: 503 }
    );
  }

  try {
    const { orderId } = (await req.json()) as StripeCheckoutBody;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Comanda nu a fost găsită." },
        { status: 404 }
      );
    }

    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.customerEmail,
      metadata: { orderId: order.id },
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "ron",
          product_data: { name: item.productName },
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      })),
      success_url: `${appUrl}/checkout/confirmare?orderId=${order.id}`,
      cancel_url: `${appUrl}/checkout?cancelled=true`,
    });

    // Save the Stripe session ID on the order
    await db.order.update({
      where: { id: orderId },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[POST /api/stripe/checkout]", error);
    return NextResponse.json(
      { error: "Eroare la inițializarea plății." },
      { status: 500 }
    );
  }
}
