import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Profilul meu | The White Laser",
};

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/profil");
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

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        isCredentialsUser: !!user.password,
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        shippingCity: user.shippingCity,
        shippingCounty: user.shippingCounty,
        shippingPostal: user.shippingPostal,
      }}
      recentOrders={user.orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
