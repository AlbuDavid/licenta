/* components/product-card.tsx */
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
}

export function ProductCard({ id, name, price, imageUrl }: ProductCardProps) {
  return (
    // FĂRĂ max-w, lăsăm grid-ul să decidă lățimea
    <Card className="w-full h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square w-full bg-gray-100">
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>

      <CardHeader className="p-3">
        <CardTitle className="text-sm font-bold line-clamp-2 h-10">
          {name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 pt-0 grow">
        <p className="text-lg font-bold text-primary">{price}</p>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button size="sm" className="w-full text-xs">
          Adaugă
        </Button>
      </CardFooter>
    </Card>
  );
}
