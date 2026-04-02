import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear dependent records first, then products
  await prisma.orderItem.deleteMany();
  await prisma.uploadedDesign.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "Tablou Ardezie Poza + Mesaj 20x30cm",
        description:
          "Tablou personalizat din ardezie naturală, gravat cu laser de înaltă precizie. Ideal pentru cadouri unice — adaugă o fotografie și un mesaj special. Dimensiune: 20×30 cm.",
        price: 139.99,
        category: "Ardezie",
        imageUrl: "/images/produse/tablouLevi.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Pătrat Cană Ardezie 10x10cm",
        description:
          "Suport de cană pătrat din ardezie naturală, gravat cu laserul. Perfect pentru a proteja masa și a adăuga un strop de eleganță. Dimensiune: 10×10 cm.",
        price: 59.99,
        category: "Ardezie",
        imageUrl: "/images/produse/patrat1.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Rotund Cană Ardezie 10x10cm",
        description:
          "Suport de cană rotund din ardezie naturală, cu design gravat laser. Formă rotundă elegantă, potrivită pentru orice decor. Dimensiune: 10×10 cm.",
        price: 47.99,
        category: "Ardezie",
        imageUrl: "/images/produse/cerc1.jpg",
        isCustomizable: true,
      },
      {
        name: "Suport Inimă Cană Ardezie 11x11cm",
        description:
          "Suport de cană în formă de inimă din ardezie naturală. Un cadou romantic și practic, gravat cu atenție la detalii. Dimensiune: 11×11 cm.",
        price: 49.99,
        category: "Ardezie",
        imageUrl: "/images/produse/inima.jpg",
        isCustomizable: false,
      },
      {
        name: "Breloc Lemn Gravat",
        description:
          "Breloc din lemn natural, gravat cu laser. Compact și elegant, perfect ca accesoriu personal sau cadou deosebit.",
        price: 14.99,
        category: "Lemn",
        imageUrl: "/images/produse/breloc1.jpg",
        isCustomizable: true,
      },
      {
        name: "Pix Metalic Gravat",
        description:
          "Pix metalic de calitate superioară cu gravură laser personalizată. Ideal pentru uz profesional sau ca un cadou rafinat.",
        price: 4.99,
        category: "Metal",
        imageUrl: "/images/produse/pix1.png",
        isCustomizable: false,
      },
      {
        name: "Copertă Laptop Lemn Gravată",
        description:
          "Copertă de laptop din lemn natural, gravată cu laserul pentru un look unic și sofisticat. Protejează și personalizează dispozitivul tău.",
        price: 59.99,
        category: "Lemn",
        imageUrl: "/images/produse/copertaTucano1.jpg",
        isCustomizable: true,
      },
      {
        name: "Tablou Ardezie Familie 20x30cm",
        description:
          "Tablou de familie din ardezie naturală, gravat cu laser. Surprinde momentele speciale într-un cadru durabil și elegant. Dimensiune: 20×30 cm.",
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
