"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const photos = [
  "/images/imagem1.jpeg",
  "/images/imagem2.jpeg",
  "/images/imagem3.jpeg",
  "/images/imagem4.jpeg",
];

export default function Carousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  function prev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }

  function next() {
    setIndex((i) => (i + 1) % photos.length);
  }

  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-[#FFC8C8]">
      {photos.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image src={src} alt="" fill className="object-cover" />
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Foto anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#5C2A2A]/70 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#5C2A2A]"
      >
        ‹
      </button>
      <button
        onClick={next}
        aria-label="Próxima foto"
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#5C2A2A]/70 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#5C2A2A]"
      >
        ›
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ir para foto ${i + 1}`}
            className={`w-2 h-2 rounded-full ${
              i === index ? "bg-[#5C2A2A]" : "bg-[#5C2A2A]/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}