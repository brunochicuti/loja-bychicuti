"use client";

import WhatsAppLink from "@/components/WhatsAppLink";
import { useCarrinho } from "@/contexto/carrinhoContexto";
import { useEffect, useState } from "react";

export default function ProdutoPage() {
const [tamanho, setTamanho] = useState("");
const [cor, setCor] = useState("");
const [quantidade, setQuantidade] = useState(1);
const { adicionarAoCarrinho } = useCarrinho();
const [erroCarrinho, setErroCarrinho] = useState("");

const [carregando, setCarregando] = useState(true);



const mensagem = `Olá! Tenho interesse na Calcinha Básica Lisa. Tamanho: ${tamanho || "não informado"} | Cor: ${cor || "não informada"}`;

const [produto, setProduto] = useState<{
  id: string;
  nome: string;
  preco: string;
  imagem: string | null;
} | null>(null);

const [variacoes, setVariacoes] = useState<
  {
    id: string;
    tamanho: string;
    cor: string;
    quantidade: number;
  }[]
>([]);

const [cores, setCores] = useState<
  {
    cor: string;
    imagem: string | null;
  }[]
>([]);

useEffect(() => {
  async function carregarProduto() {
    try {
      const resposta = await fetch(
        "/api/catalogo/calcinha-basica-lisa",
        { cache: "no-store" }
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível carregar o produto.");
      }

      const dados = await resposta.json();

      setProduto(dados.produto);
      setVariacoes(dados.variacoes);
      setCores(dados.cores);
    } catch (erro) {
      console.error("Erro ao carregar a Calcinha Básica:", erro);
      setErroCarrinho("Não foi possível carregar o produto. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  carregarProduto();
}, []);

  return (
<main className="min-h-screen bg-[#FBF6F3] pb-20">
    <div className="max-w-6xl mx-auto px-40 pt-24">
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
                {produto
                    ? Number(produto.preco).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    })
                    : "Carregando preço..."}
                </p>

                <p className="mt-4 text-[#5C2A2A]/70 max-w-xl">
                    Calcinha básica lisa, confortável e ideal para o dia a dia.
                </p>
            </div>

                <div className="mt-8">
                    <h2 className="text-sm font-medium text-[#5C2A2A] mb-3">
                        Tamanho
                    </h2>

                    <div className="flex gap-3 flex-wrap">
                    {[...new Set(variacoes.map((item) => item.tamanho))].map(
                        (itemTamanho) => {
                        const disponivel = variacoes.some(
                            (item) =>
                            item.tamanho === itemTamanho &&
                            item.quantidade > 0 &&
                            (!cor || item.cor === cor)
                        );

                        return (
                            <button
                            key={itemTamanho}
                            type="button"
                            disabled={!disponivel}
                            onClick={() => setTamanho(itemTamanho)}
                            className={`w-12 h-12 rounded-sm ${
                                tamanho === itemTamanho
                                ? "bg-[#863D3D] text-white"
                                : "border border-[#863D3D]/30"
                            } ${!disponivel ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                            {itemTamanho}
                            </button>
                        );
                        }
                    )}
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

                            <div className="flex gap-3 flex-wrap">
                            {cores.map((item) => (
                                <button
                                key={item.cor}
                                type="button"
                                onClick={() => setCor(item.cor)}
                                title={item.cor}
                                aria-label={item.cor}
                                className={`px-3 py-2 rounded-sm border ${
                                    cor === item.cor
                                    ? "bg-[#863D3D] text-white border-[#863D3D]"
                                    : "border-[#863D3D]/30 text-[#5C2A2A]"
                                }`}
                                >
                                {item.cor}
                                </button>
                            ))}
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

                                const variacaoSelecionada = variacoes.find(
                                (item) =>
                                    item.tamanho === tamanho &&
                                    item.cor === cor
                                );

                                if (!produto || !variacaoSelecionada) {
                                setErroCarrinho("Selecione uma combinação válida de cor e tamanho.");
                                return;
                                }

                                if (quantidade < 1 || quantidade > variacaoSelecionada.quantidade) {
                                setErroCarrinho("A quantidade selecionada não está disponível em estoque.");
                                return;
                                }

                            adicionarAoCarrinho({
                            id: Number(produto.id),
                            variacaoId: Number(variacaoSelecionada.id),
                            nome: produto.nome,
                            preco: Number(produto.preco),
                            imagem: produto.imagem,
                            tamanho,
                            cor,
                            quantidade,
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