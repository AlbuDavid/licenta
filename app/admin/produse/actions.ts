"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createProduct(formData: FormData, imageUrl: string) {
  const name = formData.get("name");
  const description = formData.get("description");
  const price = formData.get("price");
  const category = formData.get("category");
  const isCustomizable = formData.get("isCustomizable") === "true";

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new Error("Product name is required.");
  }
  if (!price || isNaN(Number(price))) {
    throw new Error("A valid price is required.");
  }

  try {
    await db.product.create({
      data: {
        name: name.trim(),
        description:
          description && typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        price: parseFloat(price as string),
        category:
          category && typeof category === "string" && category.trim()
            ? category.trim()
            : "General",
        imageUrl: imageUrl || null,
        isCustomizable,
      },
    });

    revalidatePath("/admin/produse");
  } catch (error) {
    console.error("[createProduct]", error);
    throw new Error("Failed to create product. Please try again.");
  }
}
