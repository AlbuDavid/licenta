"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { OrderStatus } from "@/lib/generated/prisma/client";

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  if (!orderId) throw new Error("Order ID is required.");

  try {
    await db.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/comenzi");
  } catch (error) {
    console.error("[updateOrderStatus]", error);
    throw new Error("Failed to update order status.");
  }
}
