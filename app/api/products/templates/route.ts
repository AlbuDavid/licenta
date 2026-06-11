import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  DB_SHAPE_TO_EDITOR,
  DB_MATERIAL_TO_EDITOR,
  type ProductTemplateConfig,
} from "@/lib/template-config";

/**
 * GET /api/products/templates
 *
 * Public list of products usable as engraving templates in the editor:
 * active products with a COMPLETE template config (shape + dimensions +
 * material). Returns editor-friendly lowercase unions, not DB enums.
 */
export async function GET() {
  try {
    const products = await db.product.findMany({
      where: {
        active: true,
        templateShape: { not: null },
        templateWidthMm: { not: null },
        templateHeightMm: { not: null },
        material: { not: null },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        templateShape: true,
        templateWidthMm: true,
        templateHeightMm: true,
        material: true,
        blankPhotoUrl: true,
      },
    });

    const configs: ProductTemplateConfig[] = products.map((p) => ({
      productId: p.id,
      name: p.name,
      // Non-null guaranteed by the where clause above
      shape: DB_SHAPE_TO_EDITOR[p.templateShape!],
      widthMm: p.templateWidthMm!,
      heightMm: p.templateHeightMm!,
      material: DB_MATERIAL_TO_EDITOR[p.material!],
      blankPhotoUrl: p.blankPhotoUrl,
    }));

    return NextResponse.json(configs);
  } catch (error) {
    console.error("[GET /api/products/templates]", error);
    return NextResponse.json(
      { error: "Eroare la listarea șabloanelor." },
      { status: 500 },
    );
  }
}
