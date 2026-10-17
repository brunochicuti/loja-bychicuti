"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  preco: string;
  imagem: string | null;
  categoria: string;
  slug: string;
};

const categorias = ["Todos", "Básico", "Fio", "Rendado", "Infantil"];

function criarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarPreco(preco: string) {
  return Number(preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function pertenceAoInfantil(nome: string) {
  return nome.includes("infantil");
}

function pertenceAoFio(nome: string) {
  return (
    nome.includes("fio dental") ||
    nome.includes("fio tirinha") ||
    nome.startsWith("fio ") ||
    nome.includes("fio-dental")
  );
}

function pertenceAoRendado(nome: string) {
  return (
    nome.includes("renda") ||
    nome.includes("rendad") ||
    nome.includes("rendinha") ||
    nome.includes("rendada") ||
    nome.includes("rendado")
  );
}

function pertenceAoBasico(nome: string) {
  return (
    nome.includes("basica") ||
    nome.includes("basico") ||
    nome.includes("simples")
  );
}

export default function CalcinhasPage() {
  const [filtro, setFiltro] = useState("Todos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os produtos.");
        }

        const dados = await resposta.json();

        const lista: Omit<Produto, "slug">[] = Array.isArray(dados.produtos)
          ? dados.produtos
          : [];

        const produtosDoBanco: Produto[] = lista
          .filter((produto) =>
            normalizarTexto(produto.categoria || "").includes("calcinha")
          )
          .map((produto) => ({
            ...produto,
            slug: criarSlug(produto.nome),
          }));

        setProdutos(produtosDoBanco);
      } catch {
        setErro("Não foi possível carregar os produtos. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }

    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const nome = normalizarTexto(produto.nome);

    // Infantil é uma categoria exclusiva.
    if (filtro === "Todos") {
      return true;
    }

    // O filtro Infantil mostra somente as infantis.
    if (filtro === "Infantil") {
      return pertenceAoInfantil(nome);
    }

    // Os outros filtros não incluem produtos infantis.
    if (pertenceAoInfantil(nome)) {
      return false;
}

    switch (filtro) {
      case "Todos":
        return true;

      case "Básico":
          return (
          !pertenceAoFio(nome) &&
          !pertenceAoRendado(nome) &&
          pertenceAoBasico(nome)
          );

      case "Fio":
        return pertenceAoFio(nome);

      case "Rendado":
          return (
          !pertenceAoFio(nome) &&
           pertenceAoRendado(nome)
          );

      default:
        return true;
    }
  });

  return (
    <main className="min-h-screen bg-[#FBF6F3] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-widest text-[#863D3D] mb-3">
            By Chicuti
          </p>

          <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
            Calcinhas
          </h1>

          <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">
            Encontre o modelo ideal para você. Confira nossos modelos,
            cores, tamanhos e disponibilidade.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => setFiltro(categoria)}
              aria-pressed={filtro === categoria}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${
                filtro === categoria
                  ? "bg-[#863D3D] text-white"
                  : "border border-[#863D3D]/20 hover:bg-[#FFC8C8]/30"
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>

        {carregando ? (
          <p className="text-[#5C2A2A]/70">Carregando produtos...</p>
        ) : erro ? (
          <p role="alert" className="text-red-700">
            {erro}
          </p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-[#5C2A2A]/70">
            Nenhum produto encontrado neste filtro.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {produtosFiltrados.map((produto) => (
              <Link
                key={produto.id}
                href={`/feminino/${produto.slug}`}
                className="group"
              >
                <div className="relative aspect-[3/4] bg-[#FFE3E3] overflow-hidden mb-4 rounded-sm">
                  {produto.imagem ? (
                    <img
                      src={produto.imagem}
                      alt={produto.nome}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#5C2A2A]/70">
                      Imagem indisponível
                    </div>
                  )}
                </div>

                <h2 className="text-base font-medium text-[#2A2420]">
                  {produto.nome}
                </h2>

                <p className="mt-1 text-[#863D3D] font-medium">
                  {formatarPreco(produto.preco)}
                </p>

                <div className="mt-4 inline-flex items-center justify-center bg-[#863D3D] text-[#FBF6F3] px-6 py-3 text-sm font-medium rounded-sm transition-colors group-hover:bg-[#5C2A2A]">
                  Ver produto →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}