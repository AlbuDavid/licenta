/* components/product-card.tsx */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  isCustomizable: boolean;
}

export function ProductCard({
  id,
  name,
  price,
  category,
  imageUrl,
  isCustomizable,
}: ProductCardProps) {
  return (
    <Card className="group w-full flex flex-col overflow-hidden border border-border/60 shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
      {/* Image */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
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
              ✦ Personalizabil în Editor
            </Badge>
          </div>
        )}
      </div>

      {/* Header */}
      <CardHeader className="px-4 pt-3 pb-1">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
          {category}
        </p>
        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">
          {name}
        </CardTitle>
      </CardHeader>

      {/* Price */}
      <CardContent className="px-4 pb-2 grow">
        <p className="text-base font-bold text-foreground">{price}</p>
      </CardContent>

      {/* Actions */}
      <CardFooter className="px-4 pb-4 flex flex-col gap-2">
        <Button size="sm" className="w-full text-xs font-medium">
          Adaugă în Coș
        </Button>
        {isCustomizable && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs font-medium"
            asChild
          >
            <Link href={`/produse/customize?id=${id}`}>Personalizează</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
