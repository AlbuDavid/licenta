import { db } from "@/lib/db";
import { OrdersAdminClient } from "./orders-admin-client";

async function getOrders() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            customDesign: { select: { fileUrl: true, fileName: true } },
          },
        },
      },
    });
    return orders;
  } catch (error) {
    console.error("[GET /admin/orders]", error);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <OrdersAdminClient initialOrders={orders} />;
}
