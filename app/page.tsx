import Link from "next/link";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  Pen,
  Upload,
  Package,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function Home() {
  let featuredProducts: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    category: string;
    isCustomizable: boolean;
  }[] = [];

  try {
    featuredProducts = await db.product.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        category: true,
        isCustomizable: true,
      },
    });
  } catch (error) {
    console.error("[HOME] Failed to fetch featured products:", error);
  }

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img
            src="/laser1.jpg"
            alt="Laser engraving machine"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-28 sm:py-36 lg:py-44 text-center">
          <Badge
            variant="secondary"
            className="mb-5 bg-white/10 text-white/80 border-white/10 backdrop-blur-sm text-xs tracking-wide"
          >
            Gravare laser de precizie
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Produse unice, gravate
            <br />
            <span className="text-slate-300">cu poveste</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Transformăm ardezia, lemnul și metalul în obiecte personalizate.
            Alege un produs, încarcă propriul design sau creează unul în editorul nostru.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="text-sm font-medium gap-2 px-6">
              <Link href="/produse">
                Explorează Produsele
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-sm font-medium gap-2 px-6 border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/editor">
                <Pen className="size-4" />
                Creează un Design
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <section className="border-b border-border/60 bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-border/60">
            <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
              <Truck className="size-4 shrink-0" />
              <span>Livrare gratuită la toate comenzile</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
              <Sparkles className="size-4 shrink-0" />
              <span>Realizat manual, cu atenție la detalii</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Garanție de calitate pentru fiecare piesă</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Simplu și rapid
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5">
            Cum funcționează
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: Package,
              title: "Alege produsul",
              desc: "Răsfoiește catalogul nostru de produse din ardezie, lemn sau metal.",
            },
            {
              step: "02",
              icon: Upload,
              title: "Încarcă sau creează design-ul",
              desc: "Încarcă o imagine sau folosește editorul nostru vector pentru a crea un design unic.",
            },
            {
              step: "03",
              icon: Truck,
              title: "Primește creația ta",
              desc: "Gravăm cu laserul și îți livrăm produsul finalizat în 3-5 zile lucrătoare.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-muted">
                <item.icon className="size-6 text-foreground" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground tracking-widest">
                PASUL {item.step}
              </span>
              <h3 className="text-base font-semibold mt-1.5">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-5xl" />

      {/* ─── Featured products ─── */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                Colecție
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5">
                Produse populare
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-sm gap-1.5">
              <Link href="/produse">
                Vezi toate
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((p) => (
              <Link key={p.id} href={`/produse/${p.id}`} className="group">
                <Card className="overflow-hidden border-border/60 shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 rounded-xl">
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <img
                      src={p.imageUrl ?? "/images/produse/placeholder.jpg"}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {p.isCustomizable && (
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="outline"
                          className="bg-background/90 backdrop-blur-sm text-[10px] font-medium border-border/80 text-muted-foreground"
                        >
                          ✦ Personalizabil
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="px-4 py-3">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                      {p.category}
                    </p>
                    <p className="text-sm font-semibold leading-snug line-clamp-2 mt-0.5">
                      {p.name}
                    </p>
                    <p className="text-base font-bold mt-1.5">
                      {formatPrice(p.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Separator className="mx-auto max-w-5xl" />

      {/* ─── Materials ─── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Materiale premium
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5">
            Alege materialul preferat
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              name: "Ardezie",
              image: "/images/produse/tablouLevi.jpg",
              desc: "Piatră naturală cu textură elegantă, perfectă pentru tablouri și suporturi de cană.",
            },
            {
              name: "Lemn",
              image: "/images/produse/breloc1.jpg",
              desc: "Lemn natural de calitate superioară, ideal pentru brelocuri și accesorii unice.",
            },
            {
              name: "Metal",
              image: "/images/produse/pix1.png",
              desc: "Oțel inoxidabil și aluminiu anodizat pentru obiecte rafinate și durabile.",
            },
          ].map((material) => (
            <Link
              key={material.name}
              href={`/produse?category=${material.name}`}
              className="group"
            >
              <Card className="overflow-hidden border-border/60 shadow-none hover:shadow-md transition-all duration-200 rounded-xl">
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                  <img
                    src={material.image}
                    alt={material.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white">
                      {material.name}
                    </h3>
                  </div>
                </div>
                <CardContent className="px-4 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {material.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pregătit să creezi ceva unic?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base text-slate-400 leading-relaxed">
            Deschide editorul nostru vector și proiectează designul perfect,
            sau răsfoiește colecția noastră de produse gata de personalizat.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="text-sm font-medium gap-2 px-6 bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link href="/editor">
                <Pen className="size-4" />
                Deschide Editorul
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-sm font-medium gap-2 px-6 border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/produse">
                Explorează Produsele
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
