
"use client";

import Image from "next/image";
import { useState } from "react";
import WhatsAppLink from "./WhatsAppLink";
import { useCarrinho } from "@/contexto/carrinhoContexto";

const categoriasFemininas = [
  { nome: "Calcinhas", href: "/feminino/calcinhas" },
  { nome: "Sutiãs", href: "/feminino/sutias" },
  { nome: "Conjuntos", href: "/feminino/conjuntos" },
  { nome: "Lingeries", href: "/feminino/lingerie" },
  { nome: "Tops Fitness", href: "/feminino/tops" },
  { nome: "Shorts", href: "/feminino/shorts" },
  { nome: "Pijamas", href: "/feminino/pijamas" },
  { nome: "Body", href: "/feminino/body" },
  { nome: "Blusas", href: "/feminino/blusas" },
  { nome: "Calças", href: "/feminino/calcas" },
  { nome: "Maiôs", href: "/feminino/maios" },
];

const categoriasMasculinas = [
  { nome: "Cuecas", href: "/masculino/cuecas" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [openFeminino, setOpenFeminino] = useState(false);
  const [openMasculino, setOpenMasculino] = useState(false);
  const [openCarrinho, setOpenCarrinho] = useState(false);

  const { carrinho, carregado, removerDoCarrinho } = useCarrinho();

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF6F3]/90 backdrop-blur-sm border-b border-[#863D3D]/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
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
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <WhatsAppLink className="hidden lg:inline-block bg-[#863D3D] text-[#FBF6F3] px-5 py-2.5 text-sm font-medium hover:bg-[#5C2A2A] transition-colors">
            Falar no WhatsApp
          </WhatsAppLink>

          <button
            type="button"
            onClick={() => setOpenCarrinho(!openCarrinho)}
            className="relative bg-[#863D3D] text-white px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap"
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
                            R$ {(item.preco * item.quantidade)
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
          className="md:hidden text-[#5C2A2A] text-2xl"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

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
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setOpenCarrinho(true);
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
