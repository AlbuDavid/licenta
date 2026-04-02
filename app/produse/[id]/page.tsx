/* app/produse/[id]/page.tsx — Server Component */
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductDetail } from "./product-detail";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  try {
    const product = await db.product.findUniqueOrThrow({ where: { id } });
    return {
      title: `${product.name} — The White Laser`,
      description:
        product.description ??
        `${product.name} — produs personalizat gravat cu laserul.`,
    };
  } catch {
    return { title: "Produs negăsit — The White Laser" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  let product;
  let relatedProducts;

  try {
    product = await db.product.findUniqueOrThrow({ where: { id } });

    relatedProducts = await db.product.findMany({
      where: { category: product.category, id: { not: id } },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[GET /produse/:id]", error);
    notFound();
  }

  return (
    <ProductDetail
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl ?? "/images/produse/placeholder.jpg",
        category: product.category,
        isCustomizable: product.isCustomizable,
      }}
      relatedProducts={relatedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl ?? "/images/produse/placeholder.jpg",
        category: p.category,
        isCustomizable: p.isCustomizable,
      }))}
    />
  );
}
