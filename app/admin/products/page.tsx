import { db } from "@/lib/db";
import { ProductsAdminClient } from "./products-admin-client";

async function getProducts() {
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orderItems: true } } },
    });
    return products;
  } catch (error) {
    console.error("[GET /admin/products]", error);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <ProductsAdminClient initialProducts={products} />;
}
