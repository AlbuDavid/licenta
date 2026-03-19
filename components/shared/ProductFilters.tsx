"use client";

/* components/shared/ProductFilters.tsx */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Ardezie", "Lemn", "Metal"] as const;

type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: "default", label: "Recomandate" },
  { value: "price-asc", label: "Preț: crescător" },
  { value: "price-desc", label: "Preț: descrescător" },
  { value: "name-asc", label: "Nume: A → Z" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

const PER_PAGE_OPTIONS = [
  { value: "12", label: "12 produse" },
  { value: "24", label: "24 produse" },
  { value: "48", label: "48 produse" },
] as const;

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Build a new query string while preserving unrelated params
  const createQueryString = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "default") {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }

      return params.toString();
    },
    [searchParams],
  );

  // --- Sorting ---
  const currentSort = (searchParams.get("sort") ?? "default") as SortOption;

  function handleSortChange(value: string) {
    // reset to page 1 when sort changes
    router.push(`${pathname}?${createQueryString({ sort: value, page: null })}`);
  }

  // --- Category checkboxes ---
  const activeCategories = searchParams.getAll("category") as Category[];

  function handleCategoryToggle(category: Category, checked: boolean) {
    const next = checked
      ? [...activeCategories, category]
      : activeCategories.filter((c) => c !== category);

    router.push(
      `${pathname}?${createQueryString({
        category: next.length ? next : null,
        page: null,
      })}`,
    );
  }

  // --- Per page ---
  const currentPerPage = searchParams.get("perPage") ?? "12";

  function handlePerPageChange(value: string) {
    router.push(`${pathname}?${createQueryString({ perPage: value, page: null })}`);
  }

  return (
    <aside className="flex flex-col gap-6">
      {/* Sorting */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Sortare
        </p>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Sortează după…" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Category filter */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Categorie
        </p>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => {
            const id = `cat-${cat.toLowerCase()}`;
            const isChecked = activeCategories.includes(cat);
            return (
              <div key={cat} className="flex items-center gap-2.5">
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleCategoryToggle(cat, checked === true)
                  }
                />
                <Label
                  htmlFor={id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cat}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Customizable only */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Opțiuni
        </p>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="only-customizable"
            checked={searchParams.get("customizable") === "1"}
            onCheckedChange={(checked) =>
              router.push(
                `${pathname}?${createQueryString({
                  customizable: checked === true ? "1" : null,
                  page: null,
                })}`,
              )
            }
          />
          <Label
            htmlFor="only-customizable"
            className="text-sm font-normal cursor-pointer"
          >
            Doar personalizabile
          </Label>
        </div>
      </div>

      <Separator />

      {/* Products per page */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-3">
          Produse / pagină
        </p>
        <Select value={currentPerPage} onValueChange={handlePerPageChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
