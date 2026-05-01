import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function adminOnly() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orderItems: true } } },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json({ error: "Eroare la listarea produselor." }, { status: 500 });
  }
}

interface CreateProductBody {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  isCustomizable?: boolean;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  try {
    const body: CreateProductBody = await req.json();
    const { name, description, price, imageUrl, category, isCustomizable = false } = body;

    if (!name?.trim() || !price || !category?.trim()) {
      return NextResponse.json({ error: "Câmpuri obligatorii lipsă." }, { status: 400 });
    }

    const product = await db.product.create({
      data: { name: name.trim(), description, price, imageUrl, category: category.trim(), isCustomizable, active: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "Eroare la crearea produsului." }, { status: 500 });
  }
}
