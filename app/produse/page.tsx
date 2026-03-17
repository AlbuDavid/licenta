/* app/produse/page.tsx — Server Component */
import { Suspense } from "react";
import { ProductCard, type ProductCardProps } from "@/components/product-card";
import { ProductFilters } from "@/components/shared/ProductFilters";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ---------------------------------------------------------------------------
// Mock data — replace body of `getProducts()` with a Prisma query when ready
// ---------------------------------------------------------------------------
const ALL_PRODUCTS: ProductCardProps[] = [
  {
    id: 1,
    name: "Tablou Ardezie Poza + Mesaj 20x30cm",
    price: "139,99 RON",
    category: "Ardezie",
    imageUrl: "/images/produse/tablouLevi.jpg",
    isCustomizable: true,
  },
  {
    id: 2,
    name: "Suport Pătrat Cană Ardezie 10x10cm",
    price: "59,99 RON",
    category: "Ardezie",
    imageUrl: "/images/produse/patrat1.jpg",
    isCustomizable: true,
  },
  {
    id: 3,
    name: "Suport Rotund Cană Ardezie 10x10cm",
    price: "47,99 RON",
    category: "Ardezie",
    imageUrl: "/images/produse/cerc1.jpg",
    isCustomizable: true,
  },
  {
    id: 4,
    name: "Suport Inimă Cană Ardezie 11x11cm",
    price: "49,99 RON",
    category: "Ardezie",
    imageUrl: "/images/produse/inima.jpg",
    isCustomizable: false,
  },
  {
    id: 5,
    name: "Breloc Lemn Gravat",
    price: "14,99 RON",
    category: "Lemn",
    imageUrl: "/images/produse/breloc1.jpg",
    isCustomizable: true,
  },
  {
    id: 6,
    name: "Pix Metalic Gravat",
    price: "4,99 RON",
    category: "Metal",
    imageUrl: "/images/produse/pix1.png",
    isCustomizable: false,
  },
  {
    id: 7,
    name: "Copertă Laptop Lemn Gravată",
    price: "59,99 RON",
    category: "Lemn",
    imageUrl: "/images/produse/copertaTucano1.jpg",
    isCustomizable: true,
  },
  {
    id: 8,
    name: "Tablou Ardezie Familie 20x30cm",
    price: "159,99 RON",
    category: "Ardezie",
    imageUrl: "/images/produse/tablouFamilie.jpg",
    isCustomizable: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a price string like "139,99 RON" into a number for sorting. */
function parsePrice(price: string): number {
  return parseFloat(price.replace(",", ".").replace(/[^\d.]/g, ""));
}

interface SearchParams {
  category?: string | string[];
  sort?: string;
  customizable?: string;
}

function getFilteredProducts(searchParams: SearchParams): ProductCardProps[] {
  const activeCategories = searchParams.category
    ? Array.isArray(searchParams.category)
      ? searchParams.category
      : [searchParams.category]
    : [];

  const onlyCustomizable = searchParams.customizable === "1";
  const sort = searchParams.sort ?? "default";

  let products = [...ALL_PRODUCTS];

  // Filter by category
  if (activeCategories.length > 0) {
    products = products.filter((p) => activeCategories.includes(p.category));
  }

  // Filter customizable only
  if (onlyCustomizable) {
    products = products.filter((p) => p.isCustomizable);
  }

  // Sort
  switch (sort) {
    case "price-asc":
      products.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      break;
    case "price-desc":
      products.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      break;
    case "name-asc":
      products.sort((a, b) => a.name.localeCompare(b.name, "ro"));
      break;
    default:
      break;
  }

  return products;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const products = getFilteredProducts(resolvedParams);

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Page heading */}
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Colecție
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Produsele Noastre
        </h1>
      </div>

      {/* Layout: sidebar (filters) + product grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Filters sidebar — hidden on mobile (Sheet can be wired later) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          {/*
            Suspense is required here because ProductFilters uses useSearchParams(),
            which needs a client-side boundary to avoid the Next.js CSR bailout warning.
          */}
          <Suspense fallback={null}>
            <ProductFilters />
          </Suspense>
        </div>

        {/* Product grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <p className="text-sm">
                Niciun produs nu corespunde filtrelor selectate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-14">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}

          {/* Pagination — static until DB is connected */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
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
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
