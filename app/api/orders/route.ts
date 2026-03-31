import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/mail";

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

interface CreateOrderBody {
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as CreateOrderBody;

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

    // Validate required fields
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
      return NextResponse.json(
        { error: "Toate câmpurile sunt obligatorii." },
        { status: 400 }
      );
    }

    // Calculate total from items
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create the order with items
    const order = await db.order.create({
      data: {
        ...(session?.user?.id
          ? { user: { connect: { id: session.user.id } } }
          : {}),
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
            product: { connect: { id: item.productId } },
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
      include: {
        items: { include: { customDesign: true } },
      },
    });

    // Send confirmation email (fire-and-forget)
    sendOrderConfirmationEmail(customerEmail, order).catch((err) =>
      console.error("[Order confirmation email]", err)
    );

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    const message =
      error instanceof Error ? error.message : "Eroare necunoscută";
    return NextResponse.json(
      {
        error: "Eroare la crearea comenzii.",
        ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
      },
      { status: 500 }
    );
  }
}
