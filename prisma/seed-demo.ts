import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const daysAgo = (n: number): Date =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const DEMO_EMAILS = Array.from({ length: 10 }, (_, i) => `user${i + 1}@example.ro`);

// user1–2 → 1 order each | user3–4 → 2 orders each | user5–10 → 3 orders each
const ORDER_COUNTS: Record<string, number> = {
  "user1@example.ro": 1,
  "user2@example.ro": 1,
  "user3@example.ro": 2,
  "user4@example.ro": 2,
  "user5@example.ro": 3,
  "user6@example.ro": 3,
  "user7@example.ro": 3,
  "user8@example.ro": 3,
  "user9@example.ro": 3,
  "user10@example.ro": 3,
};

const CITIES = [
  { city: "București",  county: "Ilfov",    postal: "010001" },
  { city: "Cluj-Napoca", county: "Cluj",    postal: "400100" },
  { city: "Timișoara",  county: "Timiș",    postal: "300001" },
  { city: "Iași",       county: "Iași",     postal: "700001" },
  { city: "Brașov",     county: "Brașov",   postal: "500001" },
  { city: "Constanța",  county: "Constanța",postal: "900001" },
  { city: "Craiova",    county: "Dolj",     postal: "200001" },
  { city: "Galați",     county: "Galați",   postal: "800001" },
  { city: "Oradea",     county: "Bihor",    postal: "410001" },
  { city: "Sibiu",      county: "Sibiu",    postal: "550001" },
];

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const METHODS  = ["CARD", "CASH_ON_DELIVERY"] as const;

const DEMO_PASSWORD = "Demo1234!";

async function main() {
  console.log("Seeding 10 demo users + orders...");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ── 1. Upsert users ──────────────────────────────────────────────────────────
  const users = await Promise.all(
    DEMO_EMAILS.map((email, i) => {
      const n = i + 1;
      const loc = CITIES[i];
      return prisma.user.upsert({
        where: { email },
        update: { name: `User${n}`, password: hashedPassword },
        create: {
          email,
          name: `User${n}`,
          password: hashedPassword,
          emailVerified: new Date(),
          role: "USER",
          phone: `072110${String(n).padStart(4, "0")}`,
          shippingAddress: `Str. Exemplu nr. ${n}`,
          shippingCity: loc.city,
          shippingCounty: loc.county,
          shippingPostal: loc.postal,
        },
      });
    })
  );

  console.log("Users ready.");

  // ── 2. Skip if demo orders already exist ────────────────────────────────────
  const existingCount = await prisma.order.count({
    where: { customerEmail: { in: DEMO_EMAILS } },
  });

  if (existingCount > 0) {
    console.log(
      `${existingCount} demo orders already exist — skipping. Delete them manually to reset.`
    );
    return;
  }

  // ── 3. Fetch real product IDs ────────────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true },
  });

  if (products.length === 0) {
    console.error("No active products found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const pick = (offset: number) => products[offset % products.length];

  // ── 4. Create orders ─────────────────────────────────────────────────────────
  // Spread dates across last 30 days; rotate statuses and methods deterministically.
  let orderIndex = 0;

  for (const user of users) {
    const count = ORDER_COUNTS[user.email];
    const loc = CITIES[users.indexOf(user)];

    for (let j = 0; j < count; j++) {
      const statusIdx = orderIndex % STATUSES.length;
      const methodIdx = orderIndex % METHODS.length;
      const daysAgoN  = Math.round(30 - (orderIndex / 24) * 30); // spread evenly over 30d

      const p1 = pick(orderIndex);
      const p2 = pick(orderIndex + 3);

      const items = [
        { productId: p1.id, productName: p1.name, price: p1.price, quantity: 1 },
        { productId: p2.id, productName: p2.name, price: p2.price, quantity: j + 1 },
      ];

      const total =
        Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

      const ts = daysAgo(Math.max(1, daysAgoN));

      await prisma.order.create({
        data: {
          userId:          user.id,
          customerName:    user.name ?? user.email,
          customerEmail:   user.email,
          customerPhone:   user.phone ?? "0700000000",
          shippingAddress: loc.city + " str. Exemplu",
          shippingCity:    loc.city,
          shippingCounty:  loc.county,
          shippingPostal:  loc.postal,
          paymentMethod:   METHODS[methodIdx],
          status:          STATUSES[statusIdx],
          total,
          createdAt: ts,
          updatedAt: ts,
          items: { create: items },
        },
      });

      orderIndex++;
    }
  }

  // Total: 2×1 + 2×2 + 6×3 = 24 orders
  console.log(`Created ${orderIndex} demo orders.`);
  console.log("Done. Refresh the admin panel to see the changes.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
