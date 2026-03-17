import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing products
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Tablou Ardezie Poza + Mesaj 20x30cm",
        price: 139.99,
        category: "Ardezie",
        imageUrl: "/images/produse/tablouLevi.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Pătrat Cană Ardezie 10x10cm",
        price: 59.99,
        category: "Ardezie",
        imageUrl: "/images/produse/patrat1.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Rotund Cană Ardezie 10x10cm",
        price: 47.99,
        category: "Ardezie",
        imageUrl: "/images/produse/cerc1.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Inimă Cană Ardezie 11x11cm",
        price: 49.99,
        category: "Ardezie",
        imageUrl: "/images/produse/inima.jpg",
        isCustomizable: false,
      },
      {
        name: "Breloc Lemn Gravat",
        price: 14.99,
        category: "Lemn",
        imageUrl: "/images/produse/breloc1.jpg",
        isCustomizable: true,
      },
      {
        name: "Pix Metalic Gravat",
        price: 4.99,
        category: "Metal",
        imageUrl: "/images/produse/pix1.png",
        isCustomizable: false,
      },
      {
        name: "Copertă Laptop Lemn Gravată",
        price: 59.99,
        category: "Lemn",
        imageUrl: "/images/produse/copertaTucano1.jpg",
        isCustomizable: true,
      },
      {
        name: "Tablou Ardezie Familie 20x30cm",
        price: 159.99,
        category: "Ardezie",
        imageUrl: "/images/produse/tablouFamilie.jpg",
        isCustomizable: true,
      },
    ],
  });

  console.log("Done. 8 products seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
