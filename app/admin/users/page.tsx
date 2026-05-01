import { db } from "@/lib/db";
import { UsersAdminClient } from "./users-admin-client";

async function getUsers() {
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { total: true, status: true },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as "USER" | "ADMIN",
      image: u.image,
      createdAt: u.createdAt,
      orderCount: u._count.orders,
      totalSpent: u.orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.total, 0),
    }));
  } catch (error) {
    console.error("[GET /admin/users]", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return <UsersAdminClient initialUsers={users} />;
}
