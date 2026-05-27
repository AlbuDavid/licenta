import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

interface StripeSessionPayload {
  orderId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: StripeSessionPayload = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId lipsă" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Comanda nu există" }, { status: 404 });
    }

    if (order.paymentMethod !== "CARD") {
      return NextResponse.json({ error: "Această comandă nu necesită plată online" }, { status: 400 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Comanda este deja plătită" }, { status: 400 });
    }

    const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "ron",
      customer_email: order.customerEmail,
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "ron",
          unit_amount: Math.round(item.price * 100), // RON → bani
          product_data: {
            name: item.productName,
          },
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
      },
      success_url: `${appUrl}/checkout/success?orderId=${order.id}`,
      cancel_url: `${appUrl}/checkout/cancel?orderId=${order.id}`,
    });

    // Persist stripeSessionId on the order
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/checkout/stripe-session]", error);
    return NextResponse.json({ error: "Eroare la crearea sesiunii de plată" }, { status: 500 });
  }
}
