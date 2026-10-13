"use client";
import Image from "next/image";
import { useState } from "react";
import WhatsAppLink from "./WhatsAppLink";
import { useCarrinho } from "@/contexto/carrinhoContexto";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [openFeminino, setOpenFeminino] = useState(false);
  const [openMasculino, setOpenMasculino] = useState(false);
  const { carrinho } = useCarrinho();
  const mensagemCarrinho = `
Olá! Gostaria de comprar os seguintes produtos:

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

Total: R$ ${carrinho
  .reduce((total, item) => total + item.preco * item.quantidade, 0)
  .toFixed(2)
  .replace(".", ",")}

Gostaria de finalizar minha compra.`;
  const [openCarrinho, setOpenCarrinho] = useState(false);
  

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF6F3]/90 backdrop-blur-sm border-b border-[#863D3D]/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Image src="/logo.png" alt="By Chicuti" width={96} height={96} />
          <span className="font-serif text-xl font-semibold text-[#5C2A2A]">
            By Chicuti
          </span>
        </a>

        <nav className="hidden md:block">
          <ul className="flex gap-8 text-sm">
            <li><a href="/" className="hover:text-[#863D3D]">Início</a></li>


            <li className="relative group">
                <a href="/feminino" className="hover:text-[#863D3D]">
                  Feminino <span className="text-xs">▾</span>
                </a>

                <div className="absolute left-0 top-full hidden group-hover:block bg-[#FBF6F3] shadow-lg border border-[#863D3D]/10 rounded-md p-3 w-48 z-50">
                  <a href="/feminino/calcinhas" className="block py-2 hover:text-[#863D3D]">
                    Calcinhas
                  </a>
                  <a href="/feminino/sutias" className="block py-2 hover:text-[#863D3D]">
                    Sutiãs
                  </a>
                  <a href="/feminino/conjuntos" className="block py-2 hover:text-[#863D3D]">
                    Conjuntos
                  </a>
                  <a href="/feminino/lingerie" className="block py-2 hover:text-[#863D3D]">
                    Lingeries
                  </a>
                  <a href="/feminino/pijamas" className="block py-2 hover:text-[#863D3D]">
                    Pijamas
                  </a>
                </div>
              </li>

              <li className="relative group">
                <a href="/masculino" className="hover:text-[#863D3D]">
                  Masculino <span className="text-xs">▾</span>
                </a>

                <div className="absolute left-0 top-full hidden group-hover:block bg-[#FBF6F3] shadow-lg border border-[#863D3D]/10 rounded-md p-3 w-48 z-50">
                  <a href="/masculino/cuecas" className="block py-2 hover:text-[#863D3D]">
                    Cuecas
                  </a>
                  <a href="/masculino/pijamas" className="block py-2 hover:text-[#863D3D]">
                    Pijamas
                  </a>
                  <a href="/masculino/kits" className="block py-2 hover:text-[#863D3D]">
                    Kits
                  </a>
                </div>
              </li>

              

              <li><a href="/#visitar" className="hover:text-[#863D3D]">Visite nossa loja</a></li>
          </ul>
        </nav>

        
         <WhatsAppLink className="hidden md:inline-block bg-[#863D3D] text-[#FBF6F3] px-5 py-2.5 text-sm font-medium hover:bg-[#5C2A2A] transition-colors">
            Falar no WhatsApp
          </WhatsAppLink>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => setOpenCarrinho(true)}
              className="bg-[#863D3D] text-white px-5 py-3 rounded-full text-sm font-medium"
            >
              🛒 Carrinho ({carrinho.length})
            </button>
          </div>

          {openCarrinho && (
  <div className="absolute right-6 top-20 w-80 max-w-[calc(100vw-2rem)] bg-[#FBF6F3] border border-[#863D3D]/10 rounded-lg shadow-xl p-5 z-50">
    <div className="flex items-center justify-between">
      <h2 className="font-serif text-xl text-[#5C2A2A]">
        Meu carrinho
      </h2>

      <button
        onClick={() => setOpenCarrinho(false)}
        className="text-[#5C2A2A] text-xl hover:text-[#863D3D]"
        aria-label="Fechar carrinho"
      >
        ✕
      </button>
    </div>

    {carrinho.length === 0 ? (
      <p className="mt-6 text-sm text-[#5C2A2A]/70">
        Seu carrinho está vazio.
      </p>
    ) : (
      <div className="mt-5 space-y-4">
        {carrinho.map((item, index) => (
          <div
            key={index}
            className="border-b border-[#863D3D]/10 pb-4"
          >
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

              <WhatsAppLink
                className="mt-4 inline-flex items-center justify-center border border-[#863D3D] text-[#863D3D] px-8 py-3 rounded-full text-sm font-medium hover:bg-[#863D3D] hover:text-white transition-all"
                mensagem={mensagemCarrinho}
              >
                Comprar tudo pelo WhatsApp
              </WhatsAppLink>
          </div>
        ))}
      </div>
    )}
  </div>
)}


        <button
          className="md:hidden text-[#5C2A2A]"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          ☰
        </button>
      </div>

      {open && (
  <nav className="md:hidden bg-[#FBF6F3] border-t border-[#863D3D]/10 px-6 py-4">
    <ul className="flex flex-col gap-4 text-sm">

      <li>
        <a href="/" onClick={() => setOpen(false)}>
          Início
        </a>
      </li>

      {/* FEMININO */}
      <li>
        <div className="flex items-center justify-between">
          <a href="/feminino">
            Feminino
          </a>

          <button
            onClick={() => setOpenFeminino(!openFeminino)}
            className="px-2 text-lg"
          >
            {openFeminino ? "−" : "+"}
          </button>
        </div>

        {openFeminino && (
          <div className="ml-4 mt-3 flex flex-col gap-3 text-sm">
            <a href="/feminino/calcinhas">Calcinhas</a>
            <a href="/feminino/sutias">Sutiãs</a>
            <a href="/feminino/conjuntos">Conjuntos</a>
            <a href="/feminino/lingerie">Lingeries</a>
            <a href="/feminino/pijamas">Pijamas</a>
          </div>
        )}
      </li>

      {/* MASCULINO */}
      <li>
        <div className="flex items-center justify-between">
          <a href="/masculino">
            Masculino
          </a>

          <button
            onClick={() => setOpenMasculino(!openMasculino)}
            className="px-2 text-lg"
          >
            {openMasculino ? "−" : "+"}
          </button>
        </div>

        {openMasculino && (
          <div className="ml-4 mt-3 flex flex-col gap-3 text-sm">
            <a href="/masculino/cuecas">Cuecas</a>
            <a href="/masculino/pijamas">Pijamas</a>
            <a href="/masculino/kits">Kits</a>
          </div>
        )}
      </li>

      <li>
        <a
          href="/#visitar"
          onClick={() => setOpen(false)}
        >
          Visite nossa loja
        </a>
      </li>

    </ul>
  </nav>
)}
    </header>
  );
}