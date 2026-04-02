"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCartStore, type CustomDesign } from "@/store/cartStore";

export interface ProductCardProps {
  id: string;
  name: string;
  price: string;       // formatted display string, e.g. "139,99 RON"
  priceRaw: number;    // raw float for cart calculations
  category: string;
  imageUrl: string;
  isCustomizable: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  priceRaw,
  category,
  imageUrl,
  isCustomizable,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addCustomItem = useCartStore((s) => s.addCustomItem);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDesign, setPendingDesign] = useState<CustomDesign | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleAddToCart() {
    addItem({ id, productId: id, name, price: priceRaw, imageUrl, category });
  }

  function handleUploadClick() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be picked again later
    e.target.value = "";

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", id);

      const res = await fetch("/api/designs/upload", { method: "POST", body: formData });
      const data = await res.json() as { designId?: string; fileUrl?: string; fileName?: string; error?: string };

      if (!res.ok || !data.designId) {
        throw new Error(data.error ?? "Eroare la încărcare.");
      }

      setPendingDesign({ designId: data.designId, fileUrl: data.fileUrl!, fileName: data.fileName! });
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
      id: `${id}_${pendingDesign.designId}`,
      productId: id,
      name,
      price: priceRaw,
      imageUrl,
      category,
      customDesign: pendingDesign,
    });
    setPendingDesign(null);
    setDialogOpen(false);
  }

  function handleUploadAnother() {
    setDialogOpen(false);
    setPendingDesign(null);
    // Small delay so dialog closes before file picker opens
    setTimeout(() => fileInputRef.current?.click(), 150);
  }

  const isImage =
    pendingDesign &&
    /\.(jpe?g|png|webp|svg)$/i.test(pendingDesign.fileName);

  return (
    <>
      <Card className="group w-full flex flex-col overflow-hidden border border-border/60 shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
        {/* Image */}
        <Link href={`/produse/${id}`} className="relative aspect-square w-full bg-muted overflow-hidden block">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isCustomizable && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className="bg-background/90 backdrop-blur-sm text-[10px] font-medium border-border/80 text-muted-foreground"
              >
                ✦ Personalizabil
              </Badge>
            </div>
          )}
        </Link>

        {/* Header */}
        <CardHeader className="px-4 pt-3 pb-1">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            {category}
          </p>
          <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">
            <Link href={`/produse/${id}`} className="hover:underline">
              {name}
            </Link>
          </CardTitle>
        </CardHeader>

        {/* Price */}
        <CardContent className="px-4 pb-2 grow">
          <p className="text-base font-bold text-foreground">{price}</p>
          {uploadError && (
            <p className="text-[11px] text-red-500 mt-1">{uploadError}</p>
          )}
        </CardContent>

        {/* Actions — always two slots so height is identical on all cards */}
        <CardFooter className="px-4 pb-4 flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full text-xs font-medium"
            onClick={handleAddToCart}
          >
            Adaugă în Coș
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            size="sm"
            variant="outline"
            className={`w-full text-xs font-medium gap-1.5 ${isCustomizable ? "" : "invisible pointer-events-none"}`}
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Upload className="size-3" />
            )}
            {uploading ? "Se încarcă…" : "Încarcă Design"}
          </Button>
        </CardFooter>
      </Card>

      {/* Post-upload confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Design încărcat</DialogTitle>
            <DialogDescription className="text-sm">
              Fișierul <span className="font-medium text-foreground">{pendingDesign?.fileName}</span> a
              fost atașat produsului. Ce doriți să faceți?
            </DialogDescription>
          </DialogHeader>

          {/* Preview */}
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
    </>
  );
}
