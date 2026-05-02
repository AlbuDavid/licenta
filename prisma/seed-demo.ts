import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

const daysAgo = (n: number): Date =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const DEMO_EMAILS = [
  "maria.ionescu@example.ro",
  "alex.popa@example.ro",
  "elena.dumitrescu@example.ro",
  "mihai.constantin@example.ro",
  "ana.gheorghiu@example.ro",
];

async function main() {
  console.log("Seeding 5 demo users + orders...");

  // ── 1. Upsert demo users ─────────────────────────────────────────────────
  const [maria, alex, elena, mihai, ana] = await Promise.all([
    prisma.user.upsert({
      where: { email: "maria.ionescu@example.ro" },
      update: { name: "Maria Ionescu" },
      create: {
        email: "maria.ionescu@example.ro",
        name: "Maria Ionescu",
        emailVerified: new Date(),
        role: "USER",
        phone: "0721100001",
        shippingAddress: "Str. Florilor nr. 3, ap. 5",
        shippingCity: "București",
        shippingCounty: "Ilfov",
        shippingPostal: "010001",
      },
    }),
    prisma.user.upsert({
      where: { email: "alex.popa@example.ro" },
      update: { name: "Alexandru Popa" },
      create: {
        email: "alex.popa@example.ro",
        name: "Alexandru Popa",
        emailVerified: new Date(),
        role: "USER",
        phone: "0721100002",
        shippingAddress: "Str. Victoriei nr. 15",
        shippingCity: "Cluj-Napoca",
        shippingCounty: "Cluj",
        shippingPostal: "400100",
      },
    }),
    prisma.user.upsert({
      where: { email: "elena.dumitrescu@example.ro" },
      update: { name: "Elena Dumitrescu" },
      create: {
        email: "elena.dumitrescu@example.ro",
        name: "Elena Dumitrescu",
        emailVerified: new Date(),
        role: "USER",
        phone: "0721100003",
        shippingAddress: "Bd. Unirii nr. 7",
        shippingCity: "Timișoara",
        shippingCounty: "Timiș",
        shippingPostal: "300001",
      },
    }),
    prisma.user.upsert({
      where: { email: "mihai.constantin@example.ro" },
      update: { name: "Mihai Constantin" },
      create: {
        email: "mihai.constantin@example.ro",
        name: "Mihai Constantin",
        emailVerified: new Date(),
        role: "USER",
        phone: "0721100004",
        shippingAddress: "Str. Independenței nr. 22",
        shippingCity: "Iași",
        shippingCounty: "Iași",
        shippingPostal: "700001",
      },
    }),
    prisma.user.upsert({
      where: { email: "ana.gheorghiu@example.ro" },
      update: { name: "Ana Gheorghiu" },
      create: {
        email: "ana.gheorghiu@example.ro",
        name: "Ana Gheorghiu",
        emailVerified: new Date(),
        role: "USER",
        phone: "0721100005",
        shippingAddress: "Str. Libertății nr. 5",
        shippingCity: "Brașov",
        shippingCounty: "Brașov",
        shippingPostal: "500001",
      },
    }),
  ]);

  console.log("Users ready.");

  // ── 2. Skip if demo orders already exist (idempotency) ───────────────────
  const existingCount = await prisma.order.count({
    where: { customerEmail: { in: DEMO_EMAILS } },
  });

  if (existingCount > 0) {
    console.log(
      `${existingCount} demo orders already exist — skipping. Run with --force to reset.`
    );
    return;
  }

  // ── 3. Fetch real product IDs ─────────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true },
  });

  if (products.length === 0) {
    console.error("No active products found. Run `npm run db:seed` first.");
    process.exit(1);
  }

  const find = (keyword: string) =>
    products.find((p) =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    ) ?? products[0];

  const tablou     = find("Tablou Ardezie Poza");
  const familie    = find("Familie");
  const inima      = find("Inimă");
  const breloc     = find("Breloc");
  const rotund     = find("Rotund");
  const patrat     = find("Pătrat");
  const coperta    = find("Copertă");
  const pix        = find("Pix");

  // ── 4. Define 10 orders spanning the last 30 days ────────────────────────
  // Mix of statuses, products, quantities, and payment methods to make
  // the dashboard revenue chart, top-products list, and recent-orders full.

  type Item = { productId: string; productName: string; price: number; quantity: number };

  const orders: {
    userId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingCounty: string;
    shippingPostal: string;
    paymentMethod: "CARD" | "CASH_ON_DELIVERY";
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    daysAgoN: number;
    items: Item[];
  }[] = [
    // — Maria, 28 d ago, DELIVERED
    {
      userId: maria.id,
      customerName: "Maria Ionescu",
      customerEmail: "maria.ionescu@example.ro",
      customerPhone: "0721100001",
      shippingAddress: "Str. Florilor nr. 3, ap. 5",
      shippingCity: "București",
      shippingCounty: "Ilfov",
      shippingPostal: "010001",
      paymentMethod: "CARD",
      status: "DELIVERED",
      daysAgoN: 28,
      items: [
        { productId: tablou.id, productName: tablou.name, price: tablou.price, quantity: 1 },
        { productId: breloc.id, productName: breloc.name, price: breloc.price, quantity: 2 },
      ],
    },
    // — Alexandru, 25 d ago, DELIVERED
    {
      userId: alex.id,
      customerName: "Alexandru Popa",
      customerEmail: "alex.popa@example.ro",
      customerPhone: "0721100002",
      shippingAddress: "Str. Victoriei nr. 15",
      shippingCity: "Cluj-Napoca",
      shippingCounty: "Cluj",
      shippingPostal: "400100",
      paymentMethod: "CASH_ON_DELIVERY",
      status: "DELIVERED",
      daysAgoN: 25,
      items: [
        { productId: familie.id, productName: familie.name, price: familie.price, quantity: 1 },
        { productId: patrat.id, productName: patrat.name, price: patrat.price, quantity: 2 },
      ],
    },
    // — Elena, 22 d ago, DELIVERED
    {
      userId: elena.id,
      customerName: "Elena Dumitrescu",
      customerEmail: "elena.dumitrescu@example.ro",
      customerPhone: "0721100003",
      shippingAddress: "Bd. Unirii nr. 7",
      shippingCity: "Timișoara",
      shippingCounty: "Timiș",
      shippingPostal: "300001",
      paymentMethod: "CARD",
      status: "DELIVERED",
      daysAgoN: 22,
      items: [
        { productId: inima.id, productName: inima.name, price: inima.price, quantity: 3 },
      ],
    },
    // — Maria, 20 d ago, DELIVERED
    {
      userId: maria.id,
      customerName: "Maria Ionescu",
      customerEmail: "maria.ionescu@example.ro",
      customerPhone: "0721100001",
      shippingAddress: "Str. Florilor nr. 3, ap. 5",
      shippingCity: "București",
      shippingCounty: "Ilfov",
      shippingPostal: "010001",
      paymentMethod: "CARD",
      status: "DELIVERED",
      daysAgoN: 20,
      items: [
        { productId: coperta.id, productName: coperta.name, price: coperta.price, quantity: 1 },
        { productId: pix.id, productName: pix.name, price: pix.price, quantity: 2 },
      ],
    },
    // — Alexandru, 17 d ago, SHIPPED
    {
      userId: alex.id,
      customerName: "Alexandru Popa",
      customerEmail: "alex.popa@example.ro",
      customerPhone: "0721100002",
      shippingAddress: "Str. Victoriei nr. 15",
      shippingCity: "Cluj-Napoca",
      shippingCounty: "Cluj",
      shippingPostal: "400100",
      paymentMethod: "CASH_ON_DELIVERY",
      status: "SHIPPED",
      daysAgoN: 17,
      items: [
        { productId: rotund.id, productName: rotund.name, price: rotund.price, quantity: 2 },
        { productId: pix.id, productName: pix.name, price: pix.price, quantity: 1 },
      ],
    },
    // — Mihai, 14 d ago, SHIPPED
    {
      userId: mihai.id,
      customerName: "Mihai Constantin",
      customerEmail: "mihai.constantin@example.ro",
      customerPhone: "0721100004",
      shippingAddress: "Str. Independenței nr. 22",
      shippingCity: "Iași",
      shippingCounty: "Iași",
      shippingPostal: "700001",
      paymentMethod: "CARD",
      status: "SHIPPED",
      daysAgoN: 14,
      items: [
        { productId: tablou.id, productName: tablou.name, price: tablou.price, quantity: 1 },
        { productId: inima.id, productName: inima.name, price: inima.price, quantity: 1 },
      ],
    },
    // — Elena, 10 d ago, PROCESSING
    {
      userId: elena.id,
      customerName: "Elena Dumitrescu",
      customerEmail: "elena.dumitrescu@example.ro",
      customerPhone: "0721100003",
      shippingAddress: "Bd. Unirii nr. 7",
      shippingCity: "Timișoara",
      shippingCounty: "Timiș",
      shippingPostal: "300001",
      paymentMethod: "CASH_ON_DELIVERY",
      status: "PROCESSING",
      daysAgoN: 10,
      items: [
        { productId: breloc.id, productName: breloc.name, price: breloc.price, quantity: 3 },
        { productId: pix.id, productName: pix.name, price: pix.price, quantity: 2 },
      ],
    },
    // — Ana, 7 d ago, PROCESSING
    {
      userId: ana.id,
      customerName: "Ana Gheorghiu",
      customerEmail: "ana.gheorghiu@example.ro",
      customerPhone: "0721100005",
      shippingAddress: "Str. Libertății nr. 5",
      shippingCity: "Brașov",
      shippingCounty: "Brașov",
      shippingPostal: "500001",
      paymentMethod: "CARD",
      status: "PROCESSING",
      daysAgoN: 7,
      items: [
        { productId: familie.id, productName: familie.name, price: familie.price, quantity: 1 },
        { productId: patrat.id, productName: patrat.name, price: patrat.price, quantity: 1 },
      ],
    },
    // — Mihai, 4 d ago, PENDING
    {
      userId: mihai.id,
      customerName: "Mihai Constantin",
      customerEmail: "mihai.constantin@example.ro",
      customerPhone: "0721100004",
      shippingAddress: "Str. Independenței nr. 22",
      shippingCity: "Iași",
      shippingCounty: "Iași",
      shippingPostal: "700001",
      paymentMethod: "CASH_ON_DELIVERY",
      status: "PENDING",
      daysAgoN: 4,
      items: [
        { productId: inima.id, productName: inima.name, price: inima.price, quantity: 2 },
        { productId: rotund.id, productName: rotund.name, price: rotund.price, quantity: 1 },
      ],
    },
    // — Ana, 2 d ago, PENDING
    {
      userId: ana.id,
      customerName: "Ana Gheorghiu",
      customerEmail: "ana.gheorghiu@example.ro",
      customerPhone: "0721100005",
      shippingAddress: "Str. Libertății nr. 5",
      shippingCity: "Brașov",
      shippingCounty: "Brașov",
      shippingPostal: "500001",
      paymentMethod: "CARD",
      status: "PENDING",
      daysAgoN: 2,
      items: [
        { productId: tablou.id, productName: tablou.name, price: tablou.price, quantity: 1 },
        { productId: coperta.id, productName: coperta.name, price: coperta.price, quantity: 1 },
      ],
    },
  ];

  // ── 5. Insert orders sequentially ────────────────────────────────────────
  for (const spec of orders) {
    const total =
      Math.round(
        spec.items.reduce((s, i) => s + i.price * i.quantity, 0) * 100
      ) / 100;

    const ts = daysAgo(spec.daysAgoN);

    await prisma.order.create({
      data: {
        userId: spec.userId,
        customerName: spec.customerName,
        customerEmail: spec.customerEmail,
        customerPhone: spec.customerPhone,
        shippingAddress: spec.shippingAddress,
        shippingCity: spec.shippingCity,
        shippingCounty: spec.shippingCounty,
        shippingPostal: spec.shippingPostal,
        paymentMethod: spec.paymentMethod,
        status: spec.status,
        total,
        createdAt: ts,
        updatedAt: ts,
        items: {
          create: spec.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  console.log(`Created ${orders.length} demo orders across the last 30 days.`);
  console.log("Done. Refresh the admin panel to see the changes.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
