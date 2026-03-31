/* app/produse/page.tsx — Server Component */
import { Suspense } from "react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
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


const PER_PAGE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PER_PAGE = 12;

interface SearchParams {
  category?: string | string[];
  sort?: string;
  customizable?: string;
  page?: string;
  perPage?: string;
}

interface ProductsResult {
  products: ProductCardProps[];
  total: number;
  page: number;
  perPage: number;
}

async function getProducts(searchParams: SearchParams): Promise<ProductsResult> {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const requestedPerPage = parseInt(
    searchParams.perPage ?? String(DEFAULT_PER_PAGE),
    10,
  );
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(requestedPerPage)
    ? requestedPerPage
    : DEFAULT_PER_PAGE;

  const activeCategories = searchParams.category
    ? Array.isArray(searchParams.category)
      ? searchParams.category
      : [searchParams.category]
    : [];

  const onlyCustomizable = searchParams.customizable === "1";
  const sort = searchParams.sort ?? "default";

  const where = {
    ...(activeCategories.length > 0 && { category: { in: activeCategories } }),
    ...(onlyCustomizable && { isCustomizable: true }),
  };

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : sort === "name-asc"
          ? { name: "asc" as const }
          : { createdAt: "desc" as const };

  try {
    const [rawProducts, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      db.product.count({ where }),
    ]);

    const products = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: formatPrice(p.price),
      priceRaw: p.price,
      category: p.category,
      imageUrl: p.imageUrl ?? "/images/produse/placeholder.jpg",
      isCustomizable: p.isCustomizable,
    }));

    return { products, total, page, perPage };
  } catch (error) {
    console.error("[GET /produse]", error);
    return { products: [], total: 0, page, perPage };
  }
}

/** Build a URL for a given page while preserving all other search params. */
function buildPageHref(searchParams: SearchParams, targetPage: number): string {
  const params = new URLSearchParams();

  if (searchParams.sort && searchParams.sort !== "default")
    params.set("sort", searchParams.sort);
  if (searchParams.customizable)
    params.set("customizable", searchParams.customizable);
  if (searchParams.perPage)
    params.set("perPage", searchParams.perPage);

  const cats = searchParams.category
    ? Array.isArray(searchParams.category)
      ? searchParams.category
      : [searchParams.category]
    : [];
  cats.forEach((c) => params.append("category", c));

  if (targetPage > 1) params.set("page", String(targetPage));

  const qs = params.toString();
  return `/produse${qs ? `?${qs}` : ""}`;
}

/** Returns the list of page numbers/ellipses to render. */
function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  if (current > 3) items.push("ellipsis");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    items.push(i);
  }
  if (current < total - 2) items.push("ellipsis");
  items.push(total);
  return items;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ProductsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { products, total, page, perPage } = await getProducts(resolvedParams);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Page heading */}
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Colecție
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Produsele Noastre</h1>
      </div>

      {/* Layout: narrow sidebar + product area + right spacer */}
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_120px] gap-8 items-start">
        {/* Filters sidebar — fixed narrow width, pinned to left */}
        <div className="hidden lg:block sticky top-24">
          <Suspense fallback={null}>
            <ProductFilters />
          </Suspense>
        </div>

        {/* Product area */}
        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
              <p className="text-sm">
                Niciun produs nu corespunde filtrelor selectate.
              </p>
            </div>
          ) : (
            <>
              {/* Responsive grid: 1 → 2 → 3 → 4 columns as screen grows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 mb-10">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>

              {/* Pagination (only shown when there are multiple pages) */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-2 mt-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={page > 1 ? buildPageHref(resolvedParams, page - 1) : "#"}
                          aria-disabled={page <= 1}
                          className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>

                      {pageNumbers.map((n, idx) =>
                        n === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={n}>
                            <PaginationLink
                              href={buildPageHref(resolvedParams, n)}
                              isActive={n === page}
                            >
                              {n}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href={page < totalPages ? buildPageHref(resolvedParams, page + 1) : "#"}
                          aria-disabled={page >= totalPages}
                          className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  <p className="text-xs text-muted-foreground">
                    {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} din{" "}
                    {total} produse
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right spacer — balances the sidebar so products stay centred */}
        <div className="hidden lg:block" />
      </div>
    </div>
  );
}
