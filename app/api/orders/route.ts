import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/lib/mail";

interface OrderItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  customDesign?: {
    fileUrl: string;
    fileName: string;
  };
}

interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCounty: string;
  shippingPostal: string;
  paymentMethod: "CASH_ON_DELIVERY" | "CARD";
  items: OrderItemPayload[];
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingCounty,
      shippingPostal,
      paymentMethod,
      items,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !shippingAddress ||
      !shippingCity ||
      !shippingCounty ||
      !shippingPostal ||
      !items?.length
    ) {
      return NextResponse.json({ error: "Date incomplete" }, { status: 400 });
    }

    // Fetch canonical prices from DB — never trust client-sent prices
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, price: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        return NextResponse.json(
          { error: `Produsul ${item.productId} nu există sau nu este disponibil.` },
          { status: 400 }
        );
      }
    }

    const total = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);

    const session = await getServerSession(authOptions);

    const order = await db.order.create({
      data: {
        userId: session?.user?.id ?? null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingCounty,
        shippingPostal,
        paymentMethod,
        total,
        // CARD orders start as PENDING — webhook sets PAID
        // COD orders are implicitly PENDING until admin marks paid
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              productName: product.name,
              price: product.price,
              quantity: item.quantity,
              ...(item.customDesign
                ? {
                    customDesign: {
                      create: {
                        fileUrl: item.customDesign.fileUrl,
                        fileName: item.customDesign.fileName,
                      },
                    },
                  }
                : {}),
            };
          }),
        },
      },
      include: {
        items: { include: { customDesign: true } },
      },
    });

    // For COD, payment happens at delivery — send confirmation immediately
    if (paymentMethod === "CASH_ON_DELIVERY") {
      sendOrderConfirmation(order).catch((err) =>
        console.error("[POST /api/orders] email error:", err)
      );
    }

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Eroare la plasarea comenzii" }, { status: 500 });
  }
}
