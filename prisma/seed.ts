import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear dependent records first, then products
  await prisma.presetDesign.deleteMany();
  await prisma.order.deleteMany(); // cascades → orderItem → orderCustomDesign
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

  await prisma.presetDesign.createMany({
    data: [
      {
        name: "Bordură Clasică",
        category: "Borduri",
        sortOrder: 1,
        active: true,
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 60" fill="none" stroke="#1e293b" stroke-width="2"><rect x="5" y="5" width="390" height="50" rx="4"/><line x1="20" y1="5" x2="20" y2="55"/><line x1="380" y1="5" x2="380" y2="55"/><circle cx="40" cy="30" r="6"/><circle cx="70" cy="30" r="6"/><circle cx="100" cy="30" r="6"/><circle cx="130" cy="30" r="6"/><circle cx="160" cy="30" r="6"/><circle cx="190" cy="30" r="6"/><circle cx="220" cy="30" r="6"/><circle cx="250" cy="30" r="6"/><circle cx="280" cy="30" r="6"/><circle cx="310" cy="30" r="6"/><circle cx="340" cy="30" r="6"/><circle cx="370" cy="30" r="6"/></svg>`,
      },
      {
        name: "Colț Ornamental",
        category: "Colțuri",
        sortOrder: 1,
        active: true,
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="#1e293b" stroke-width="2"><path d="M10 110 Q10 10 110 10"/><path d="M20 110 Q20 25 105 20"/><circle cx="15" cy="15" r="4"/><path d="M10 90 Q10 50 50 30" stroke-dasharray="4 3"/><path d="M25 110 C25 80 40 60 70 45"/></svg>`,
      },
      {
        name: "Ramură Florală",
        category: "Florale",
        sortOrder: 1,
        active: true,
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="#1e293b" stroke-width="1.5"><path d="M100 180 C100 140 80 120 60 100 C40 80 50 50 80 40 C60 60 70 80 100 90 C130 80 140 60 120 40 C150 50 160 80 140 100 C120 120 100 140 100 180Z"/><circle cx="100" cy="35" r="10"/><path d="M90 30 Q100 15 110 30"/><path d="M70 70 Q50 65 45 80"/><path d="M130 70 Q150 65 155 80"/><path d="M85 130 Q70 135 65 150"/><path d="M115 130 Q130 135 135 150"/></svg>`,
      },
      {
        name: "Cadru Geometric",
        category: "Geometrice",
        sortOrder: 1,
        active: true,
        svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="#1e293b" stroke-width="2"><rect x="10" y="10" width="180" height="180"/><rect x="25" y="25" width="150" height="150"/><line x1="10" y1="10" x2="25" y2="25"/><line x1="190" y1="10" x2="175" y2="25"/><line x1="10" y1="190" x2="25" y2="175"/><line x1="190" y1="190" x2="175" y2="175"/><rect x="85" y="85" width="30" height="30" transform="rotate(45 100 100)"/></svg>`,
      },
    ],
  });

  console.log("Done. 8 products + 4 presets seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
