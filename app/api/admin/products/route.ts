import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { TemplateShape, Material } from "@/lib/generated/prisma/client";

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
  templateShape?: TemplateShape | null;
  templateWidthMm?: number | null;
  templateHeightMm?: number | null;
  material?: Material | null;
  blankPhotoUrl?: string | null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return adminOnly();

  try {
    const body: CreateProductBody = await req.json();
    const {
      name, description, price, imageUrl, category, isCustomizable = false,
      templateShape = null, templateWidthMm = null, templateHeightMm = null,
      material = null, blankPhotoUrl = null,
    } = body;

    if (!name?.trim() || !price || !category?.trim()) {
      return NextResponse.json({ error: "Câmpuri obligatorii lipsă." }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name: name.trim(), description, price, imageUrl, category: category.trim(),
        isCustomizable, active: true,
        templateShape, templateWidthMm, templateHeightMm, material, blankPhotoUrl,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "Eroare la crearea produsului." }, { status: 500 });
  }
}
