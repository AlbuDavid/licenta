import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        password: true,
        phone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingCounty: true,
        shippingPostal: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            status: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
            items: { select: { quantity: true } },
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        isCredentialsUser: !!user.password,
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        shippingCity: user.shippingCity,
        shippingCounty: user.shippingCounty,
        shippingPostal: user.shippingPostal,
      },
      recentOrders: user.orders,
    });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}

interface PatchBody {
  name?: string;
  phone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCounty?: string;
  shippingPostal?: string;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const body: PatchBody = await req.json();

    if (body.name !== undefined && body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Numele trebuie să aibă cel puțin 2 caractere." },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() || null } : {}),
        ...(body.shippingAddress !== undefined ? { shippingAddress: body.shippingAddress.trim() || null } : {}),
        ...(body.shippingCity !== undefined ? { shippingCity: body.shippingCity.trim() || null } : {}),
        ...(body.shippingCounty !== undefined ? { shippingCounty: body.shippingCounty.trim() || null } : {}),
        ...(body.shippingPostal !== undefined ? { shippingPostal: body.shippingPostal.trim() || null } : {}),
      },
      select: {
        name: true,
        phone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingCounty: true,
        shippingPostal: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/profile]", error);
    return NextResponse.json({ error: "Eroare la actualizare" }, { status: 500 });
  }
}
