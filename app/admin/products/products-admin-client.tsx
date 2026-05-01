"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: string;
  isCustomizable: boolean;
  active: boolean;
  createdAt: Date;
  _count: { orderItems: number };
}

interface ProductsAdminClientProps {
  initialProducts: Product[];
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "General",
  isCustomizable: false,
};

type FormState = typeof emptyForm;

type SortKey = "name" | "category" | "price";
type SortDir = "asc" | "desc";
type ActiveFilter = "all" | "active" | "inactive";

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return <ChevronsUpDown size={13} className="ml-1 inline opacity-40" />;
  return sortDir === "asc" ? (
    <ChevronUp size={13} className="ml-1 inline text-slate-900" />
  ) : (
    <ChevronDown size={13} className="ml-1 inline text-slate-900" />
  );
}

const CHIP_BASE =
  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border whitespace-nowrap";
const CHIP_ACTIVE = "bg-slate-900 text-white border-slate-900";
const CHIP_INACTIVE =
  "bg-white text-slate-600 border-slate-200 hover:border-slate-400";

export function ProductsAdminClient({
  initialProducts,
}: ProductsAdminClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActive, setFilterActive] = useState<ActiveFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Unique categories derived from current product list
  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const hasFilters =
    filterText !== "" || filterCategory !== "all" || filterActive !== "all";

  const displayedProducts = useMemo(() => {
    let result = products;

    if (filterCategory !== "all")
      result = result.filter((p) => p.category === filterCategory);

    if (filterActive === "active") result = result.filter((p) => p.active);
    else if (filterActive === "inactive")
      result = result.filter((p) => !p.active);

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name, "ro");
        else if (sortKey === "category")
          cmp = a.category.localeCompare(b.category, "ro");
        else if (sortKey === "price") cmp = a.price - b.price;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [products, filterText, filterCategory, filterActive, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setFilterText("");
    setFilterCategory("all");
    setFilterActive("all");
  }

  function openCreate() {
    setForm(emptyForm);
    setPreviewUrl("");
    setError("");
    setCreateOpen(true);
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      imageUrl: p.imageUrl ?? "",
      category: p.category,
      isCustomizable: p.isCustomizable,
    });
    setPreviewUrl(p.imageUrl ?? "");
    setError("");
    setEditTarget(p);
  }

  function patchForm(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/products/upload-image", {
        method: "POST",
        body: fd,
      });
      const data: { imageUrl?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare la upload");
      patchForm("imageUrl", data.imageUrl!);
      setPreviewUrl(data.imageUrl!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare la upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(isEdit: boolean) {
    setError("");
    if (!form.name.trim() || !form.price || !form.category) {
      setError("Completează numele, prețul și categoria.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        imageUrl: form.imageUrl || undefined,
        category: form.category,
        isCustomizable: form.isCustomizable,
      };

      if (isEdit && editTarget) {
        const res = await fetch(`/api/admin/products/${editTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data: Product & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Eroare");
        setProducts((prev) =>
          prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))
        );
        setEditTarget(null);
        toast.success("Produs actualizat");
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data: Product & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Eroare");
        setProducts((prev) => [{ ...data, _count: { orderItems: 0 } }, ...prev]);
        setCreateOpen(false);
        toast.success("Produs creat");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x))
        );
        toast.success(p.active ? "Produs dezactivat" : "Produs activat");
      } else {
        toast.error("Eroare la actualizare");
      }
    } catch {
      toast.error("Eroare de rețea");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data: { ok?: boolean; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eroare");
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Produs șters");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Eroare";
      setError(msg);
      toast.error(msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
            Administrare
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Produse</h1>
          <p className="text-sm text-slate-600 mt-1">
            {products.length} produse în catalog
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-slate-900 hover:bg-slate-700"
        >
          <Plus size={16} className="mr-2" /> Produs nou
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`${CHIP_BASE} ${filterCategory === "all" ? CHIP_ACTIVE : CHIP_INACTIVE}`}
          onClick={() => setFilterCategory("all")}
        >
          Toate ({products.length})
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`${CHIP_BASE} ${filterCategory === cat ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat} ({products.filter((p) => p.category === cat).length})
          </button>
        ))}
        <div className="w-px h-6 bg-slate-200 self-center mx-1" />
        {(["all", "active", "inactive"] as ActiveFilter[]).map((v) => (
          <button
            key={v}
            className={`${CHIP_BASE} ${filterActive === v ? CHIP_ACTIVE : CHIP_INACTIVE}`}
            onClick={() => setFilterActive(v)}
          >
            {v === "all" ? "Activ/Inactiv" : v === "active" ? "Activ" : "Inactiv"}
          </button>
        ))}
      </div>

      {/* Search + clear */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <Input
            placeholder="Caută produs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {hasFilters && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-900 h-9 px-2"
            >
              <X size={14} className="mr-1" /> Resetează
            </Button>
            <span className="text-xs text-slate-400">
              {displayedProducts.length} rezultate
            </span>
          </>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ImageIcon className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm">Niciun produs în catalog.</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Search className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm">Niciun produs corespunde filtrelor.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600 w-12"></th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("name")}
                >
                  Produs
                  <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("category")}
                >
                  Categorie
                  <SortIcon
                    col="category"
                    sortKey={sortKey}
                    sortDir={sortDir}
                  />
                </th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900"
                  onClick={() => toggleSort("price")}
                >
                  Preț
                  <SortIcon col="price" sortKey={sortKey} sortDir={sortDir} />
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">
                  Custom.
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">
                  Activ
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">
                  Comenzi
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProducts.map((p) => (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <div className="size-10 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-slate-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 line-clamp-1">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-slate-600">
                      {p.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.isCustomizable ? (
                      <Badge
                        className="bg-indigo-100 text-indigo-700 border-indigo-200"
                        variant="outline"
                      >
                        Da
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={p.active}
                      onCheckedChange={() => toggleActive(p)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">
                    {p._count.orderItems}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setError("");
                          setDeleteTarget(p);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={createOpen || editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditTarget(null);
            setError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Editează produs" : "Produs nou"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image upload */}
            <div className="flex items-center gap-4">
              <div
                className="size-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden cursor-pointer hover:border-slate-400 transition-colors shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                ) : previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="preview"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ImageIcon size={20} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  Imagine produs
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPG, PNG sau WEBP · max 5 MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Se încarcă..." : "Selectează fișier"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                  }}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-name">Nume *</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => patchForm("name", e.target.value)}
                  placeholder="Tablou Ardezie 20x30cm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Preț (RON) *</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => patchForm("price", e.target.value)}
                  placeholder="139.99"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-category">Categorie *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => patchForm("category", v)}
                >
                  <SelectTrigger id="p-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    {!allCategories.includes("General") && (
                      <SelectItem value="General">General</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="p-desc">Descriere</Label>
                <Input
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => patchForm("description", e.target.value)}
                  placeholder="Descriere scurtă a produsului..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="p-custom"
                checked={form.isCustomizable}
                onCheckedChange={(v) => patchForm("isCustomizable", v)}
              />
              <Label htmlFor="p-custom" className="cursor-pointer">
                Permite personalizare
              </Label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditTarget(null);
                setError("");
              }}
            >
              Anulează
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-700"
              onClick={() => handleSave(editTarget !== null)}
              disabled={saving || uploading}
            >
              {saving
                ? "Se salvează..."
                : editTarget
                  ? "Salvează"
                  : "Creează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Șterge produsul?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {deleteTarget?._count?.orderItems &&
            deleteTarget._count.orderItems > 0
              ? "Produsul are comenzi asociate și nu poate fi șters. Dezactivează-l în schimb."
              : `"${deleteTarget?.name}" va fi șters definitiv. Această acțiune nu poate fi anulată.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Anulează
            </Button>
            {(!deleteTarget?._count?.orderItems ||
              deleteTarget._count.orderItems === 0) && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Se șterge..." : "Șterge"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
