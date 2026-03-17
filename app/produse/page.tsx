/* app/produse/page.tsx — Server Component */
import { Suspense } from "react";
import { db } from "@/lib/db";
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
// Helpers
// ---------------------------------------------------------------------------

/** Format a float price (e.g. 139.99) to a display string ("139,99 RON"). */
function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} RON`;
}

interface SearchParams {
  category?: string | string[];
  sort?: string;
  customizable?: string;
}

async function getProducts(searchParams: SearchParams): Promise<ProductCardProps[]> {
  const activeCategories = searchParams.category
    ? Array.isArray(searchParams.category)
      ? searchParams.category
      : [searchParams.category]
    : [];

  const onlyCustomizable = searchParams.customizable === "1";
  const sort = searchParams.sort ?? "default";

  try {
    const products = await db.product.findMany({
      where: {
        ...(activeCategories.length > 0 && {
          category: { in: activeCategories },
        }),
        ...(onlyCustomizable && { isCustomizable: true }),
      },
      orderBy:
        sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
            ? { price: "desc" }
            : sort === "name-asc"
              ? { name: "asc" }
              : { createdAt: "desc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: formatPrice(p.price),
      priceRaw: p.price,
      category: p.category,
      imageUrl: p.imageUrl ?? "/images/produse/placeholder.jpg",
      isCustomizable: p.isCustomizable,
    }));
  } catch (error) {
    console.error("[GET /produse]", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const products = await getProducts(resolvedParams);

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
        {/* Filters sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
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

          {/* Pagination — static until pagination logic is added */}
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
