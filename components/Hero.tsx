import Carousel from "./Carousel";
import WhatsAppLink from "./WhatsAppLink";
export default function Hero() {
  return (
    <section className="pt-40 pb-20 px-6 max-w-6xl mx-auto grid md:grid-cols-[1.2fr_0.8fr] gap-12 items-end">
      <div>
        <p className="text-[#863D3D] text-sm font-medium mb-4">
          Loja de moda íntima em Douradina
        </p>
        <h1 className="font-serif text-2xl md:text-6xl leading-[1.05] text-[#5C2A2A] mb-6">
            Conforto e caimento perfeito, para ele e para ela.
        </h1>
        <p className="text-lg max-w-md mb-8">
          Peças íntimas femininas e masculinas, escolhidas com cuidado para o
          seu dia a dia.
        </p>
        
          <WhatsAppLink className="inline-block bg-[#863D3D] text-[#FBF6F3] px-8 py-4 font-medium hover:bg-[#5C2A2A] transition-colors">
            Falar pelo WhatsApp
          </WhatsAppLink>
      </div>

      <Carousel />
    </section>
  );
}