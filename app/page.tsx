import { Carousel } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (

      <section className="container mx-auto px-0py-12 md:py-24 lg:py-32">
        <Carousel>
          
          <img
            src="heroImg.jpg"
            alt="Hero Image" />
        </Carousel>

      
      </section>

  );
}