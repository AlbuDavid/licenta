/* app/produse/page.tsx */
import { ProductCard } from "@/components/product-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// 1. Date fictive (Mock Data) - acestea țin locul bazei de date momentan
const PRODUCTS = [
  {
    id: 1,
    name: "Tablou Ardezie Poza+Mesaj 20x30cm",
    price: "139.99 RON",
    image: "/images/produse/tablouLevi.jpg",
  },
  {
    id: 2,
    name: "Suport patrat Cana Ardezie 10x10cm",
    price: "59.99 RON",
    image: "/images/produse/patrat1.jpg",
  },
  {
    id: 3,
    name: "Suport Rotund Cana Ardezie 10x10cm",
    price: "47.99 RON",
    image: "/images/produse/cerc1.jpg",
  },
  {
    id: 4,
    name: "Suport Inima Cana Ardezie 11x11cm",
    price: "49.99 RON",
    image: "/images/produse/inima.jpg",
  },
  {
    id: 5,
    name: "Breloc Lemn",
    price: "14.99 RON",
    image: "/images/produse/breloc1.jpg",
  },
  {
    id: 6,
    name: "Pix metalic",
    price: "4.99 RON",
    image: "/images/produse/pix1.png",
  },
  {
    id: 7,
    name: "Gravare lemn",
    price: "59.99 RON",
    image: "/images/produse/copertaTucano1.jpg",
  },
  {
    id: 1,
    name: "Tablou Ardezie Poza 20x30cm",
    price: "159.99 RON",
    image: "/images/produse/tablouFamilie.jpg",
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Produsele Noastre</h1>

      {/* 2. Grid-ul de produse */}
      {/* Pe mobil (default) avem 1 coloană. De la 'md' în sus avem 2, iar la 'lg' 3 coloane */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        {PRODUCTS.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.image}
          />
        ))}
      </div>

      {/* 3. Componenta de Paginare (Statică momentan) */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className="cursor-pointer hover:bg-gray-100"
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              href="#"
              className="cursor-pointer hover:bg-gray-100"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
