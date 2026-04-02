import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

interface OrderItemPayload {
  productId: string;
  productName: string;
  price: number;
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

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
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
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Eroare la plasarea comenzii" }, { status: 500 });
  }
}
