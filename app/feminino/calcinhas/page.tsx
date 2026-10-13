"use client";

import Link from "next/link";
import { useState } from "react";

const produtos = [
  {
    nome: "Calcinha Básica Lisa",
    preco: "R$ 19,90",
    imagem: "/produtos/calcinha-basica.jpeg",
    slug: "calcinha-basica",
    categoria: "Calcinha Básica"
  },
  {
    nome: "Calcinha Básica renda",
    preco: "R$ 22,90",
    imagem: "/produtos/calcinha-fio-dental.jpg",
    slug: "calcinha-basica-renda",
    categoria: "Calcinha Básica"
  },
  {
    nome: "Calcinha Cintura Alta",
    preco: "R$ 24,90",
    imagem: "/produtos/calcinha-cintura-alta.jpg",
    slug: "calcinha-cintura-alta",
    categoria: "Calcinha Cintura"
  },
];

export default function CalcinhasPage() {

    const [filtro, setFiltro] = useState("Todos");

const produtosFiltrados =
  filtro === "Todos"
    ? produtos
    : produtos.filter((produto) => produto.categoria === filtro);

  return (
    <main className="min-h-screen bg-[#FBF6F3] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">

        {/* CABEÇALHO */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
            Calcinhas
          </h1>

          <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">
            Encontre o modelo ideal para você. Confira nossos modelos,
            cores, tamanhos e disponibilidade.
          </p>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-3 mb-10">
        <button
            onClick={() => setFiltro("Todos")}
            className={
                filtro === "Todos"
                ? "px-5 py-2 rounded-full bg-[#863D3D] text-white text-sm"
                : "px-5 py-2 rounded-full border border-[#863D3D]/20 text-sm"
            }>
            Todos
        </button>

        <button
            onClick={() => setFiltro("Calcinha Básica")}
            className={`px-5 py-2 rounded-full text-sm ${filtro === "Calcinha Básica"
                ? "bg-[#863D3D] text-white"
                : "border border-[#863D3D]/20"
            }`}>
            Calcinha Básica
        </button>
          
          <button className="px-5 py-2 rounded-full border border-[#863D3D]/20 text-sm hover:bg-[#FFC8C8]/30">
            Fio dental
          </button>

          <button className="px-5 py-2 rounded-full border border-[#863D3D]/20 text-sm hover:bg-[#FFC8C8]/30">
            Tanga
          </button>

        <button
            onClick={() => setFiltro("Calcinha Cintura Alta")}
            className="px-5 py-2 rounded-full border border-[#863D3D]/20 text-sm hover:bg-[#FFC8C8]/30 transition">
            Calcinha Cintura
        </button>
        </div>

        {/* PRODUTOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">

          {produtosFiltrados.map((produto) => (
            <Link
              key={produto.slug}
              href={`/feminino/calcinhas/${produto.slug}`}
              className="group"
            >
              <div className="relative aspect-[3/4] bg-[#FFE3E3] overflow-hidden mb-4 rounded-sm">
                <img
                  src={produto.imagem}
                  alt={produto.nome}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <h2 className="text-base font-medium text-[#2A2420]">
                {produto.nome}
              </h2>

              <p className="mt-1 text-[#863D3D] font-medium">
                {produto.preco}
              </p>

                <div className="mt-4 inline-flex items-center justify-center bg-[#863D3D] text-[#FBF6F3] px-6 py-3 text-sm font-medium rounded-sm transition-colors group-hover:bg-[#5C2A2A]">
                Ver produto →
                </div>
            </Link>
          ))}

        </div>

      </div>
    </main>
  );
}
