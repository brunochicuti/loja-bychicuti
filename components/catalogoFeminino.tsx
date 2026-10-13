"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Produto = {
  id: number | string;
  nome: string;
  preco: number | string;
  imagem: string | null;
  categoria: string;
};

type CatalogoFemininoProps = {
  categoria: string;
  titulo: string;
  descricao: string;
  filtros?: string[];
};

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function criarSlug(nome: string) {
  return normalizarTexto(nome)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatarPreco(preco: number | string) {
  const valor = Number(preco);

  if (!Number.isFinite(valor)) {
    return "Consulte o preço";
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function correspondeAoFiltro(
  categoria: string,
  nomeProduto: string,
  filtro: string
) {
  const nome = normalizarTexto(nomeProduto);
  const cat = normalizarTexto(categoria);
  const opcao = normalizarTexto(filtro);

  if (opcao === "todos") return true;

  if (cat === "sutias" || cat === "sutia") {
    switch (opcao) {
      case "basicos":
        return nome.includes("basico");

      case "com bojo":
        return nome.includes("com bojo") || nome.includes("bojo com aro");

      case "sem bojo":
        return nome.includes("sem bojo");

      case "com renda":
        return nome.includes("renda");

      case "tomara que caia":
        return nome.includes("tomara que cai");

      case "amamentacao":
        return nome.includes("amamentacao");

      case "senhora":
        return nome.includes("senhora");

      case "juvenil":
        return nome.includes("menina moca") || nome.includes("juvenil");

      case "nadador":
        return nome.includes("nadador");

      case "costa nua":
        return nome.includes("costa nua");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "tops" || cat === "top") {
    switch (opcao) {
      case "infantil":
        return nome.includes("infantil");

      case "com bojo":
        return nome.includes("com bojo");

      case "sem bojo":
        return nome.includes("sem bojo");

      case "nadador":
        return nome.includes("nadador");

      case "costa em v":
        return nome.includes("costa em v");

      case "alca cruzada":
        return nome.includes("alca cruzada");

      case "recorte nas costas":
        return nome.includes("recorte nas costas");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "shorts" || cat === "short") {
    switch (opcao) {
      case "anagua":
        return nome.includes("anagua");

      case "dool":
        return nome.includes("dool");

      case "com renda":
        return nome.includes("renda");

      case "infantil":
        return nome.includes("infantil");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "shorts fitness") {
    switch (opcao) {
      case "meia coxa":
        return nome.includes("meia coxa");

      case "ciclista":
        return nome.includes("ciclista");

      case "com bolso lateral":
        return nome.includes("bolso lateral");

      case "duplo":
        return nome.includes("duplo");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "pijamas" || cat === "pijama") {
    switch (opcao) {
      case "pijamas americanos":
        return nome.includes("pijama americano");

      case "camisolas":
        return nome.includes("camisola");

      case "com bojo":
        return nome.includes("com bojo");

      case "sem bojo":
        return nome.includes("sem bojo");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "calcas" || cat === "calca") {
    switch (opcao) {
      case "legging":
        return nome.includes("legging");

      case "com bolso":
        return nome.includes("com bolso");

      case "bailarina":
        return nome.includes("bailarina");

      default:
        return nome.includes(opcao);
    }
  }

  if (cat === "body" || cat === "bodies") {
    if (opcao === "gola alta") return nome.includes("gola alta");
    return nome.includes(opcao);
  }

  return nome.includes(opcao);
}

export default function CatalogoFeminino({
  categoria,
  titulo,
  descricao,
  filtros = [],
}: CatalogoFemininoProps) {
  const [filtro, setFiltro] = useState("Todos");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
          throw new Error("Falha ao carregar produtos.");
        }

        const dados = await resposta.json();
        const todos: Produto[] = Array.isArray(dados.produtos)
          ? dados.produtos
          : [];

        const categoriaNormalizada = normalizarTexto(categoria);

        const encontrados = todos.filter(
          (produto) =>
            normalizarTexto(produto.categoria || "") ===
            categoriaNormalizada
        );

        if (ativo) setProdutos(encontrados);
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar os produtos. Tente novamente.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, [categoria]);

  useEffect(() => {
    if (filtro !== "Todos" && !filtros.includes(filtro)) {
      setFiltro("Todos");
    }
  }, [filtro, filtros]);

  const produtosFiltrados = produtos.filter((produto) =>
    correspondeAoFiltro(categoria, produto.nome, filtro)
  );

  return (
    <main className="min-h-screen bg-[#FBF6F3] pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
            {titulo}
          </h1>

          <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">{descricao}</p>
        </div>

        {filtros.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            {["Todos", ...filtros].map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setFiltro(opcao)}
                aria-pressed={filtro === opcao}
                className={`px-5 py-2 rounded-full text-sm transition-colors ${
                  filtro === opcao
                    ? "bg-[#863D3D] text-white"
                    : "border border-[#863D3D]/20 hover:bg-[#FFC8C8]/30"
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <p className="text-[#5C2A2A]/70">Carregando produtos...</p>
        ) : erro ? (
          <p role="alert" className="text-red-700">{erro}</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-[#5C2A2A]/70">
            Nenhum produto encontrado neste filtro.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
            {produtosFiltrados.map((produto) => (
              <Link
                key={produto.id}
                href={`/feminino/${criarSlug(produto.nome)}`}
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