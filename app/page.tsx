import { Carousel } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <section className="flex h-screen w-full flex-col items-center justify-center">
      <h1 className="mb-15 text-6xl font-bold text-black">The White Laser</h1>
      <Carousel>
        <img src="laser1.jpg" alt="Hero Image" />
      </Carousel>
    </section>
  );
}
