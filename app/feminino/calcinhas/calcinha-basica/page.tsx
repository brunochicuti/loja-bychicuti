"use client";

import WhatsAppLink from "@/components/WhatsAppLink";
import { useCarrinho } from "@/contexto/carrinhoContexto";
import { useState } from "react";

export default function ProdutoPage() {
const [tamanho, setTamanho] = useState("");
const [cor, setCor] = useState("");
const [quantidade, setQuantidade] = useState(1);
const { adicionarAoCarrinho } = useCarrinho();
const [erroCarrinho, setErroCarrinho] = useState("");



const mensagem = `Olá! Tenho interesse na Calcinha Básica Lisa. Tamanho: ${tamanho || "não informado"} | Cor: ${cor || "não informada"}`;

  return (
<main className="min-h-screen bg-[#FBF6F3] pb-20">
    <div className="max-w-6xl mx-auto px-6 pt-24">
        <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
          Calcinha Básica Lisa
        </h1>
        <div className="mt-10 max-w-md">
        <img
            src="/produtos/calcinha-basica.jpeg"
            alt="Calcinha Básica Lisa"
            className="w-full rounded-sm"/>

            <div className="mt-8">
                <p className="text-2xl font-medium text-[#863D3D]">
                    R$ 19,90
                </p>

                <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">
                    Calcinha básica lisa, confortável e ideal para o dia a dia.
                </p>
            </div>

                <div className="mt-8">
                    <h2 className="text-sm font-medium text-[#5C2A2A] mb-3">
                        Tamanho
                    </h2>

                    <div className="flex gap-3">
                        <button
                        onClick={() => setTamanho("P")}
                        className={`w-12 h-12 rounded-sm ${
                            tamanho === "P"
                            ? "bg-[#863D3D] text-white"
                            : "border border-[#863D3D]/30"}`}
                        >
                        P
                        </button>

                        <button
                        onClick={() => setTamanho("M")}
                        className={`w-12 h-12 rounded-sm ${
                            tamanho === "M"
                            ? "bg-[#863D3D] text-white"
                            : "border border-[#863D3D]/30"}`}
                        >
                        M
                        </button>

                        <button
                        onClick={() => setTamanho("G")}
                        className={`w-12 h-12 rounded-sm ${
                            tamanho === "G"
                            ? "bg-[#863D3D] text-white"
                            : "border border-[#863D3D]/30"}`}
                        >
                        G
                        </button>

                        <button
                        onClick={() => setTamanho("GG")}
                        className={`w-12 h-12 rounded-sm ${
                            tamanho === "GG"
                            ? "bg-[#863D3D] text-white"
                            : "border border-[#863D3D]/30"}`}
                        >
                        GG
                        </button>
                    </div>
                </div>

                        <div className="mt-6">
                            <h2 className="text-sm font-medium text-[#5C2A2A] mb-3">
                                Quantidade
                            </h2>

                            <div className="flex items-center gap-3">
                                <button
                                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                                className="w-10 h-10 border border-[#863D3D]/30 rounded-sm"
                                >
                                −
                                </button>

                                <span className="w-10 text-center">
                                {quantidade}
                                </span>

                                <button
                                onClick={() => setQuantidade(quantidade + 1)}
                                className="w-10 h-10 border border-[#863D3D]/30 rounded-sm"
                                >
                                +
                                </button>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-sm font-medium text-[#5C2A2A] mb-3">
                                Cor
                            </h2>

                            <div className="flex gap-3">
                                <button
                                onClick={() => setCor("PRETO")}
                                aria-label="Preto"
                                className={`w-9 h-9 rounded-full bg-black ${
                                    cor === "PRETO"
                                    ? "ring-2 ring-[#863D3D] ring-offset-2"
                                    : "border border-gray-300"
                                }`}
                                />

                                <button
                                onClick={() => setCor("BRANCO")}
                                aria-label="Branco"
                                className={`w-9 h-9 rounded-full bg-white ${
                                    cor === "BRANCO"
                                    ? "ring-2 ring-[#863D3D] ring-offset-2"
                                    : "border border-gray-300"
                                }`}
                                />

                                <button
                                onClick={() => setCor("NUDE")}
                                aria-label="Nude"
                                className={`w-9 h-9 rounded-full bg-[#D8B08C] ${
                                    cor === "NUDE"
                                    ? "ring-2 ring-[#863D3D] ring-offset-2"
                                    : "border border-gray-300"
                                }`}
                                />
                            </div>

                            <div className="mt-3 h-6">
                                <span className="text-base text-[#5C2A2A]">
                                {cor === "PRETO" && "Preto"}
                                {cor === "BRANCO" && "Branco"}
                                {cor === "NUDE" && "Nude"}
                                </span>
                            </div>

                        <div className="mt-4 flex gap-4 flex-wrap">
                            <button
                             className="mt-4 inline-flex items-center justify-center bg-[#863D3D] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-[#5C2A2A] transition-all"
                            onClick={() => {
                                if (!tamanho || !cor) {
                                setErroCarrinho(
                                    "Selecione o tamanho e a cor antes de adicionar ao carrinho."
                                );
                                return;
                                }

                                setErroCarrinho("");

                            adicionarAoCarrinho({
                            id: 1001,
                            nome: "Calcinha Básica Lisa",
                            preco: 19.9,
                            imagem: "/produtos/calcinha-basica.jpeg",
                            tamanho: tamanho,
                            cor: cor,
                            quantidade: quantidade,
                            });
                            }}
                            >
                            Adicionar ao carrinho
                            </button>


                            <WhatsAppLink
                                className="mt-4 inline-flex items-center justify-center border border-[#863D3D] text-[#863D3D] px-8 py-3 rounded-full text-sm font-medium hover:bg-[#863D3D] hover:text-white transition-all"
                            mensagem={mensagem}
                            >
                                Comprar pelo WhatsApp
                            </WhatsAppLink>
                        </div>
                            {erroCarrinho && (
                            <p className="mt-3 text-sm text-red-600">
                            {erroCarrinho}
                            </p>
                        )}
                </div>
        </div>
      </div>
    </main>
  );
}