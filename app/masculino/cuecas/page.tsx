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
  const valor = Number(preco);

  if (!Number.isFinite(valor)) {
    return "Preço indisponível";
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CuecasPage() {
  const [filtro, setFiltro] = useState("Todos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const categorias = [
    "Todos",
    "Box infantil",
    "Box adulta",
    "Zorba infantil",
    "Zorba adulta",
  ];

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch("/api/produtos", {
          cache: "no-store",
        });

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os produtos.");
        }

        const dados = await resposta.json();

        const lista: Omit<Produto, "slug">[] = Array.isArray(
          dados.produtos
        )
          ? dados.produtos
          : [];

        const produtosDoBanco: Produto[] = lista
          .filter((produto) =>
            normalizarTexto(produto.categoria || "").includes("cueca")
          )
          .map((produto) => ({
            ...produto,
            slug: criarSlug(produto.nome),
          }));

        if (ativo) {
          setProdutos(produtosDoBanco);
        }
      } catch {
        if (ativo) {
          setErro(
            "Não foi possível carregar os produtos. Tente novamente."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    const nome = normalizarTexto(produto.nome);

    switch (filtro) {
      case "Box infantil":
        return (
          nome.includes("box") &&
          nome.includes("infantil")
        );

      case "Box adulta":
        return (
          nome.includes("box") &&
          !nome.includes("infantil")
        );

      case "Zorba infantil":
        return (
          nome.includes("zorba") &&
          nome.includes("infantil")
        );

      case "Zorba adulta":
        return (
          nome.includes("zorba") &&
          !nome.includes("infantil")
        );

      default:
        return true;
    }
  });

  return (
    <main className="min-h-screen bg-[#FBF6F3] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-widest text-[#863D3D] mb-3">
            By Chicuti
          </p>

          <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
            Cuecas
          </h1>

          <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">
            Confira nossos modelos de cuecas, com opções infantis
            e adultas para o conforto do dia a dia.
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
          <p className="text-[#5C2A2A]/70">
            Carregando produtos...
          </p>
        ) : erro ? (
          <p role="alert" className="text-red-700">
            {erro}
          </p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-[#5C2A2A]/70">
            Nenhuma cueca encontrada neste filtro.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {produtosFiltrados.map((produto) => (
              <Link
                key={produto.id}
                href={`/masculino/${produto.slug}`}
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