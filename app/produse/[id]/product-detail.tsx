"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Loader2,
  ImageIcon,
  ShoppingCart,
  ChevronRight,
  Truck,
  Shield,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProductCard } from "@/components/product-card";
import { useCartStore, type CustomDesign } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
  isCustomizable: boolean;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  isCustomizable: boolean;
}

interface ProductDetailProps {
  product: ProductData;
  relatedProducts: RelatedProduct[];
}

/* ------------------------------------------------------------------ */
/*  Category-specific specs                                            */
/* ------------------------------------------------------------------ */

const CATEGORY_SPECS: Record<
  string,
  { material: string; greutate: string; finisaj: string; intretinere: string }
> = {
  Ardezie: {
    material: "Ardezie naturală",
    greutate: "Variabilă în funcție de dimensiune",
    finisaj: "Suprafață naturală lisată",
    intretinere: "Se curăță ușor cu o cârpă umedă",
  },
  Lemn: {
    material: "Lemn natural de calitate superioară",
    greutate: "Variabilă în funcție de dimensiune",
    finisaj: "Lăcuit mat, protecție UV",
    intretinere: "A se evita expunerea prelungită la umiditate",
  },
  Metal: {
    material: "Oțel inoxidabil / Aluminiu anodizat",
    greutate: "Variabilă în funcție de dimensiune",
    finisaj: "Satinat / Lustruit",
    intretinere: "Rezistent la rugină, se curăță cu o cârpă moale",
  },
};

const DEFAULT_DESCRIPTION =
  "Produs artizanal de calitate superioară, gravat cu precizie folosind tehnologia laser. Fiecare piesă este unică și realizată cu atenție la detalii.";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addCustomItem = useCartStore((s) => s.addCustomItem);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDesign, setPendingDesign] = useState<CustomDesign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const description = product.description ?? DEFAULT_DESCRIPTION;
  const specs = CATEGORY_SPECS[product.category] ?? CATEGORY_SPECS["Ardezie"];

  /* ---- Cart ---- */

  function handleAddToCart() {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
    });
  }

  /* ---- Design upload (same flow as ProductCard) ---- */

  function handleUploadClick() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", product.id);

      const res = await fetch("/api/designs/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        designId?: string;
        fileUrl?: string;
        fileName?: string;
        error?: string;
      };

      if (!res.ok || !data.designId) {
        throw new Error(data.error ?? "Eroare la încărcare.");
      }

      setPendingDesign({
        designId: data.designId,
        fileUrl: data.fileUrl!,
        fileName: data.fileName!,
      });
      setDialogOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare necunoscută.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleConfirmAddToCart() {
    if (!pendingDesign) return;
    addCustomItem({
      id: `${product.id}_${pendingDesign.designId}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      customDesign: pendingDesign,
    });
    setPendingDesign(null);
    setDialogOpen(false);
  }

  function handleUploadAnother() {
    setDialogOpen(false);
    setPendingDesign(null);
    setTimeout(() => fileInputRef.current?.click(), 150);
  }

  const isImage =
    pendingDesign &&
    /\.(jpe?g|png|webp|svg)$/i.test(pendingDesign.fileName);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/produse" className="hover:text-foreground transition-colors">
              Produse
            </Link>
          </li>
          <li>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link
              href={`/produse?category=${encodeURIComponent(product.category)}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category}
            </Link>
          </li>
          <li>
            <ChevronRight className="size-3.5" />
          </li>
          <li className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left — Product image */}
        <div className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.isCustomizable && (
            <div className="absolute top-3 left-3">
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm text-xs font-medium border-border/80 text-muted-foreground"
              >
                ✦ Personalizabil
              </Badge>
            </div>
          )}
        </div>

        {/* Right — Product info */}
        <div className="flex flex-col">
          {/* Category */}
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {product.category}
          </p>

          {/* Name */}
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mt-1">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-xl lg:text-2xl font-bold text-foreground mt-3">
            {formatPrice(product.price)}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>
            {product.isCustomizable && (
              <Badge variant="outline" className="text-xs">
                ✦ Personalizabil
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mt-5">
            {description}
          </p>

          <Separator className="my-6" />

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full text-sm font-medium gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-4" />
              Adaugă în Coș
            </Button>

            {product.isCustomizable && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-sm font-medium gap-2"
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading ? "Se încarcă…" : "Încarcă Design"}
                </Button>
              </>
            )}

            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/60">
            <div className="flex flex-col items-center text-center gap-1.5">
              <Truck className="size-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground leading-tight">
                Livrare gratuită
              </span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Shield className="size-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground leading-tight">
                Garanție calitate
              </span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground leading-tight">
                Livrare 3-5 zile
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <Tabs defaultValue="descriere" className="mt-12">
        <TabsList>
          <TabsTrigger value="descriere">Descriere</TabsTrigger>
          <TabsTrigger value="specificatii">Specificații</TabsTrigger>
          <TabsTrigger value="livrare">Livrare</TabsTrigger>
        </TabsList>

        <TabsContent value="descriere" className="mt-4">
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p className="leading-relaxed">{description}</p>
            <p className="leading-relaxed mt-3">
              Fiecare produs este realizat manual în atelierul nostru, folosind
              echipamente laser de ultimă generație. Gravura este permanentă și
              rezistentă la uzură, asigurând un aspect deosebit pentru ani de zile.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="specificatii" className="mt-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">Material</dt>
              <dd className="text-muted-foreground mt-0.5">{specs.material}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Greutate</dt>
              <dd className="text-muted-foreground mt-0.5">{specs.greutate}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Finisaj</dt>
              <dd className="text-muted-foreground mt-0.5">{specs.finisaj}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Întreținere</dt>
              <dd className="text-muted-foreground mt-0.5">{specs.intretinere}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Personalizare</dt>
              <dd className="text-muted-foreground mt-0.5">
                {product.isCustomizable
                  ? "Disponibilă — încarcă propriul design"
                  : "Acest produs nu este personalizabil"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Tehnologie</dt>
              <dd className="text-muted-foreground mt-0.5">
                Gravare laser CO₂ de înaltă precizie
              </dd>
            </div>
          </dl>
        </TabsContent>

        <TabsContent value="livrare" className="mt-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Clock className="size-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Timp de procesare</p>
                <p className="mt-0.5">
                  Comenzile sunt procesate în 1-3 zile lucrătoare. Produsele
                  personalizate pot necesita 2-5 zile suplimentare.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="size-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Livrare</p>
                <p className="mt-0.5">
                  Livrare gratuită prin curier pentru toate comenzile. Timp estimat
                  de livrare: 3-5 zile lucrătoare.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="size-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Returnare</p>
                <p className="mt-0.5">
                  Produsele pot fi returnate în termen de 14 zile de la primire.
                  Produsele personalizate nu pot fi returnate decât în cazul
                  defectelor de fabricație.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <>
          <Separator className="my-12" />
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-6">
              Produse similare
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={formatPrice(p.price)}
                  priceRaw={p.price}
                  category={p.category}
                  imageUrl={p.imageUrl}
                  isCustomizable={p.isCustomizable}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Post-upload confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Design încărcat</DialogTitle>
            <DialogDescription className="text-sm">
              Fișierul{" "}
              <span className="font-medium text-foreground">
                {pendingDesign?.fileName}
              </span>{" "}
              a fost atașat produsului. Ce doriți să faceți?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center rounded-lg border border-border/60 bg-muted h-40 overflow-hidden">
            {isImage ? (
              <img
                src={pendingDesign!.fileUrl}
                alt="Preview design"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-8" />
                <span className="text-xs">{pendingDesign?.fileName}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full text-sm" onClick={handleConfirmAddToCart}>
              Adaugă în Coș
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={handleUploadAnother}
            >
              Încarcă alt fișier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
