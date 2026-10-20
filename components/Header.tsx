"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import WhatsAppLink from "./WhatsAppLink";
import { useCarrinho } from "@/contexto/carrinhoContexto";

type ProdutoBusca = {
  id: number | string;
  codigo: string | null;
  nome: string;
  descricao?: string | null;
  preco: string | number;
  imagem: string | null;
  categoria: string;
  slug: string;
};

const categoriasFemininas = [
  { nome: "Calcinhas", href: "/feminino/calcinhas" },
];

const categoriasMasculinas = [
  { nome: "Cuecas", href: "/masculino/cuecas" },
];

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

function formatarPreco(preco: string | number) {
  const valor = Number(preco);

  if (!Number.isFinite(valor)) {
    return "Preço indisponível";
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterLinkProduto(produto: ProdutoBusca) {
  const categoria = normalizarTexto(produto.categoria);
  const nome = normalizarTexto(produto.nome);

  if (categoria.includes("cueca")) {
    return `/masculino/${produto.slug}`;
  }

  // Página feminina que já existe no site.
  if (
    nome === "calcinha basica lisa" ||
    nome === "calcinha basica"
  ) {
    return "/feminino/calcinhas/calcinha-basica";
  }

  // Para as demais categorias femininas, abre a listagem.
  if (categoria.includes("calcinha")) {
    return "/feminino/calcinhas";
  }

  return "/feminino";
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [openFeminino, setOpenFeminino] = useState(false);
  const [openMasculino, setOpenMasculino] = useState(false);
  const [openCarrinho, setOpenCarrinho] = useState(false);

  const [openBusca, setOpenBusca] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [produtos, setProdutos] = useState<ProdutoBusca[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [erroBusca, setErroBusca] = useState("");

  const { carrinho, carregado, removerDoCarrinho } = useCarrinho();

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );

  useEffect(() => {
    if (!openBusca) return;

    let ativo = true;

    async function carregarProdutos() {
      try {
        setCarregandoBusca(true);
        setErroBusca("");

        const resposta = await fetch("/api/produtos", {
          cache: "no-store",
        });

        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os produtos.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados.produtos)) {
          throw new Error("A lista de produtos está indisponível.");
        }

        if (ativo) {
          setProdutos(
            dados.produtos.map((produto: Omit<ProdutoBusca, "slug">) => ({
              ...produto,
              slug: criarSlug(produto.nome),
            }))
          );
        }
      } catch {
        if (ativo) {
          setErroBusca(
            "Não foi possível carregar os produtos. Tente novamente."
          );
        }
      } finally {
        if (ativo) {
          setCarregandoBusca(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, [openBusca]);

  const termoNormalizado = normalizarTexto(termoBusca);

  const produtosEncontrados = termoNormalizado
    ? produtos
        .filter((produto) => {
          const nome = normalizarTexto(produto.nome);
          const codigo = normalizarTexto(produto.codigo || "");

          return (
            nome.includes(termoNormalizado) ||
            codigo.includes(termoNormalizado)
          );
        })
        .slice(0, 8)
    : [];

  const mensagemCarrinho = `Olá! Gostaria de fazer um pedido na ByChicuti!

${carrinho
  .map(
    (item, index) =>
      `${index + 1}. ${item.nome}
Tamanho: ${item.tamanho}
Cor: ${item.cor}
Quantidade: ${item.quantidade}
Valor: R$ ${(item.preco * item.quantidade)
        .toFixed(2)
        .replace(".", ",")}`
  )
  .join("\n\n")}

Total: R$ ${valorTotal.toFixed(2).replace(".", ",")}

Gostaria de finalizar minha compra.`;

  function fecharBusca() {
    setOpenBusca(false);
    setTermoBusca("");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF6F3]/95 backdrop-blur-sm border-b border-[#863D3D]/10">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 md:gap-4">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="By Chicuti"
            width={96}
            height={96}
            loading="eager"
          />
          <span className="font-serif text-xl font-semibold text-[#5C2A2A]">
            By Chicuti
          </span>
        </a>

        <nav className="hidden md:block">
          <ul className="flex gap-6 text-sm">
            <li>
              <a href="/" className="hover:text-[#863D3D]">
                Início
              </a>
            </li>

            <li className="relative group">
              <a
                href="/feminino"
                className="hover:text-[#863D3D]"
                aria-haspopup="true"
              >
                Feminino <span className="text-xs">▾</span>
              </a>

              <div className="absolute left-0 top-full hidden group-hover:block group-focus-within:block bg-[#FBF6F3] shadow-lg border border-[#863D3D]/10 rounded-md p-3 w-52 max-h-[70vh] overflow-y-auto z-50">
                {categoriasFemininas.map((categoria) => (
                  <a
                    key={categoria.href}
                    href={categoria.href}
                    className="block py-2 hover:text-[#863D3D]"
                  >
                    {categoria.nome}
                  </a>
                ))}
              </div>
            </li>

            <li className="relative group">
              <a
                href="/masculino"
                className="hover:text-[#863D3D]"
                aria-haspopup="true"
              >
                Masculino <span className="text-xs">▾</span>
              </a>

              <div className="absolute left-0 top-full hidden group-hover:block group-focus-within:block bg-[#FBF6F3] shadow-lg border border-[#863D3D]/10 rounded-md p-3 w-48 z-50">
                {categoriasMasculinas.map((categoria) => (
                  <a
                    key={categoria.href}
                    href={categoria.href}
                    className="block py-2 hover:text-[#863D3D]"
                  >
                    {categoria.nome}
                  </a>
                ))}
              </div>
            </li>

            <li>
              <a href="/#visitar" className="hover:text-[#863D3D]">
                Visite nossa loja
              </a>
            </li>
            
          <li>
            <a href="/meus-pedidos" className="hover:text-[#863D3D]">
              Meus pedidos
            </a>
          </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setOpenBusca((valor) => !valor);
              setOpenCarrinho(false);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-[#863D3D]/20 text-[#5C2A2A] hover:bg-[#FFC8C8]/30 transition-colors"
            aria-label={openBusca ? "Fechar busca" : "Buscar produtos"}
            aria-expanded={openBusca}
          >
            {openBusca ? (
              <span className="text-xl">✕</span>
            ) : (
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            )}
          </button>

          <WhatsAppLink className="hidden md:inline-block bg-[#863D3D] text-[#FBF6F3] px-5 py-2.5 text-sm font-medium hover:bg-[#5C2A2A] transition-colors">
            Falar no WhatsApp
          </WhatsAppLink>

          <button
            type="button"
            onClick={() => {
              setOpenCarrinho(!openCarrinho);
              setOpenBusca(false);
            }}
            className="hidden md:inline-flex relative bg-[#863D3D] text-white px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap"
            aria-expanded={openCarrinho}
            aria-label={`Abrir carrinho com ${totalItens} unidades`}
          >
            🛒 Carrinho ({carregado ? totalItens : "..."})
          </button>
        </div>

        {openCarrinho && (
          <div className="absolute right-4 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[#FBF6F3] border border-[#863D3D]/10 rounded-lg shadow-xl p-5 z-50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-[#5C2A2A]">
                Meu carrinho
              </h2>

              <button
                type="button"
                onClick={() => setOpenCarrinho(false)}
                className="text-[#5C2A2A] text-xl hover:text-[#863D3D]"
                aria-label="Fechar carrinho"
              >
                ✕
              </button>
            </div>

            {!carregado ? (
              <p className="mt-6 text-sm">Carregando carrinho...</p>
            ) : carrinho.length === 0 ? (
              <p className="mt-6 text-sm text-[#5C2A2A]/70">
                Seu carrinho está vazio.
              </p>
            ) : (
              <>
                <div className="mt-5 max-h-80 overflow-y-auto space-y-4">
                  {carrinho.map((item) => (
                    <div
                      key={`${item.id}-${item.cor}-${item.tamanho}`}
                      className="border-b border-[#863D3D]/10 pb-4"
                    >
                      <div className="flex gap-3">
                        {item.imagem && (
                          <Image
                            src={item.imagem}
                            alt={item.nome}
                            width={64}
                            height={80}
                            className="rounded-md object-contain bg-white"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#5C2A2A]">
                            {item.nome}
                          </p>
                          <p className="text-sm text-[#5C2A2A]/70">
                            Tamanho: {item.tamanho}
                          </p>
                          <p className="text-sm text-[#5C2A2A]/70">
                            Cor: {item.cor}
                          </p>
                          <p className="text-sm text-[#5C2A2A]/70">
                            Quantidade: {item.quantidade}
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#863D3D]">
                            R${" "}
                            {(item.preco * item.quantidade)
                              .toFixed(2)
                              .replace(".", ",")}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removerDoCarrinho(
                                item.id,
                                item.cor,
                                item.tamanho
                              )
                            }
                            className="mt-2 text-sm text-[#863D3D] underline"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-[#863D3D]/15 pt-4">
                  <p className="font-semibold text-[#5C2A2A]">
                    Total: R$ {valorTotal.toFixed(2).replace(".", ",")}
                  </p>

                  <WhatsAppLink
                    className="mt-4 flex items-center justify-center bg-[#863D3D] text-white px-5 py-3 rounded-full text-sm font-medium hover:bg-[#5C2A2A] transition-colors"
                    mensagem={mensagemCarrinho}
                  >
                    Comprar tudo pelo WhatsApp
                  </WhatsAppLink>
                </div>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          className="flex md:hidden shrink-0 items-center justify-center w-11 h-11 text-[#5C2A2A] text-2xl"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {openBusca && (
        <div className="border-t border-[#863D3D]/10 bg-[#FBF6F3] shadow-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <label
              htmlFor="busca-produtos"
              className="block text-sm font-medium text-[#5C2A2A] mb-2"
            >
              O que você está procurando?
            </label>

            <div className="flex items-center gap-3 border border-[#863D3D]/25 rounded-full bg-white px-4 focus-within:ring-2 focus-within:ring-[#863D3D]/30">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-[#863D3D]"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>

              <input
                id="busca-produtos"
                type="search"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Digite o nome ou código do produto..."
                className="w-full min-w-0 py-3 outline-none bg-transparent text-[#5C2A2A] text-base"
                autoComplete="off"
                autoFocus
              />

              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca("")}
                  className="shrink-0 text-sm text-[#863D3D] underline"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="mt-4 max-h-[55vh] overflow-y-auto">
              {carregandoBusca ? (
                <p className="py-4 text-sm text-[#5C2A2A]/70">
                  Carregando produtos...
                </p>
              ) : erroBusca ? (
                <p role="alert" className="py-4 text-sm text-red-700">
                  {erroBusca}
                </p>
              ) : !termoNormalizado ? (
                <p className="py-3 text-sm text-[#5C2A2A]/65">
                  Pesquise pelo nome ou código para encontrar um produto.
                </p>
              ) : produtosEncontrados.length === 0 ? (
                <p className="py-4 text-sm text-[#5C2A2A]/70">
                  Nenhum produto encontrado para “{termoBusca}”.
                </p>
              ) : (
                <div className="divide-y divide-[#863D3D]/10">
                  {produtosEncontrados.map((produto) => (
                    <a
                      key={produto.id}
                      href={obterLinkProduto(produto)}
                      onClick={fecharBusca}
                      className="flex items-center gap-4 py-3 px-2 rounded-md hover:bg-[#FFC8C8]/20 transition-colors"
                    >
                      <div className="w-16 h-16 shrink-0 rounded-md bg-white overflow-hidden flex items-center justify-center">
                        {produto.imagem ? (
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-[#5C2A2A]/60">
                            Sem foto
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#5C2A2A]">
                          {produto.nome}
                        </p>

                        {produto.codigo && (
                          <p className="mt-1 text-xs text-[#5C2A2A]/65">
                            Código: {produto.codigo}
                          </p>
                        )}

                        <p className="mt-1 text-sm font-semibold text-[#863D3D]">
                          {formatarPreco(produto.preco)}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="text-[#863D3D] text-lg shrink-0"
                      >
                        →
                      </span>
                    </a>
                  ))}

                  {produtosEncontrados.length === 8 && (
                    <p className="py-3 text-center text-xs text-[#5C2A2A]/60">
                      Mostrando até 8 resultados. Refine sua pesquisa para
                      encontrar outros produtos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {open && (
        <nav className="md:hidden bg-[#FBF6F3] border-t border-[#863D3D]/10 px-6 py-4 max-h-[75vh] overflow-y-auto">
          <ul className="flex flex-col gap-4 text-sm">
            <li>
              <a href="/" onClick={() => setOpen(false)}>
                Início
              </a>
            </li>

            <li>
              <div className="flex items-center justify-between">
                <a href="/feminino" onClick={() => setOpen(false)}>
                  Feminino
                </a>

                <button
                  type="button"
                  onClick={() => setOpenFeminino(!openFeminino)}
                  className="px-2 text-lg"
                  aria-label="Mostrar categorias femininas"
                  aria-expanded={openFeminino}
                >
                  {openFeminino ? "−" : "+"}
                </button>
              </div>

              {openFeminino && (
                <div className="ml-4 mt-3 flex flex-col gap-3 border-l border-[#863D3D]/15 pl-4">
                  {categoriasFemininas.map((categoria) => (
                    <a
                      key={categoria.href}
                      href={categoria.href}
                      onClick={() => setOpen(false)}
                      className="hover:text-[#863D3D]"
                    >
                      {categoria.nome}
                    </a>
                  ))}
                </div>
              )}
            </li>

            <li>
              <div className="flex items-center justify-between">
                <a href="/masculino" onClick={() => setOpen(false)}>
                  Masculino
                </a>

                <button
                  type="button"
                  onClick={() => setOpenMasculino(!openMasculino)}
                  className="px-2 text-lg"
                  aria-label="Mostrar categorias masculinas"
                  aria-expanded={openMasculino}
                >
                  {openMasculino ? "−" : "+"}
                </button>
              </div>

              {openMasculino && (
                <div className="ml-4 mt-3 flex flex-col gap-3 border-l border-[#863D3D]/15 pl-4">
                  {categoriasMasculinas.map((categoria) => (
                    <a
                      key={categoria.href}
                      href={categoria.href}
                      onClick={() => setOpen(false)}
                      className="hover:text-[#863D3D]"
                    >
                      {categoria.nome}
                    </a>
                  ))}
                </div>
              )}
            </li>

            <li>
              <a href="/#visitar" onClick={() => setOpen(false)}>
                Visite nossa loja
              </a>
            </li>

            <li>
              <a
                href="/meus-pedidos"
                onClick={() => setOpen(false)}
                className="hover:text-[#863D3D]"
              >
                Meus pedidos
              </a>
            </li>

            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setOpenCarrinho(true);
                  setOpenBusca(false);
                }}
                className="bg-[#863D3D] text-white px-5 py-3 rounded-full"
              >
                🛒 Ver carrinho ({carregado ? totalItens : "..."})
              </button>
            </li>

            <li>
              <WhatsAppLink className="inline-block bg-[#863D3D] text-white px-5 py-3 rounded-full">
                Falar no WhatsApp
              </WhatsAppLink>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}