
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type ItemPedido = {
  nome_produto: string;
  tamanho: string;
  cor: string;
  preco_unitario: string;
  quantidade: number;
  subtotal: string;
};

type Pedido = {
  id: string | number;
  codigo: string;
  valor_total: string;
  status: string;
  criado_em: string;
  modalidade_entrega: string;
  status_operacional: string;
  frete_valor: string;
  itens: ItemPedido[];
};

function moeda(valor: string | number) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataFormatada(data: string) {
  const dataPedido = new Date(data);

  if (Number.isNaN(dataPedido.getTime())) {
    return "Data indisponível";
  }

  return dataPedido.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function MeusPedidosPage() {
  const { data: sessao, isPending: carregandoSessao } =
    authClient.useSession();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (carregandoSessao) return;

    if (!sessao?.user) {
      setPedidos([]);
      setCarregandoPedidos(false);
      return;
    }

    let cancelado = false;

    async function buscarPedidos() {
      setCarregandoPedidos(true);
      setErro("");

      try {
        const resposta = await fetch("/api/meus-pedidos", {
          cache: "no-store",
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível carregar seus pedidos."
          );
        }

        if (!cancelado) {
          setPedidos(dados.pedidos ?? []);
        }
      } catch (erroBusca) {
        if (!cancelado) {
          setErro(
            erroBusca instanceof Error
              ? erroBusca.message
              : "Ocorreu um erro ao carregar seus pedidos."
          );
        }
      } finally {
        if (!cancelado) setCarregandoPedidos(false);
      }
    }

    buscarPedidos();

    return () => {
      cancelado = true;
    };
  }, [sessao, carregandoSessao]);

  if (carregandoSessao || (sessao?.user && carregandoPedidos)) {
    return (
      <main className="min-h-screen bg-[#FBF6F3] px-6 py-12">
        <div className="mx-auto max-w-4xl text-[#5C2A2A]">
          Carregando seus pedidos...
        </div>
      </main>
    );
  }

  if (!sessao?.user) {
    return (
      <main className="min-h-screen bg-[#FBF6F3] px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-[#5C2A2A]">
            Meus pedidos
          </h1>

          <p className="mt-4 text-[#5C2A2A]">
            Entre na sua conta para consultar suas compras.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-[#863D3D] px-7 py-3 font-medium text-white transition hover:bg-[#5C2A2A]"
          >
            Entrar na minha conta
          </Link>

          <p className="mt-5 text-sm text-[#5C2A2A]">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF6F3] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold text-[#5C2A2A]">
          Meus pedidos
        </h1>

        <p className="mt-2 text-[#5C2A2A]">
          Olá, {sessao.user.name}! Aqui você acompanha suas compras.
        </p>

        {erro && (
          <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
            {erro}
          </p>
        )}

        {!erro && pedidos.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-[#5C2A2A]">
              Você ainda não tem pedidos
            </h2>

            <p className="mt-3 text-[#5C2A2A]">
              Quando fizer uma compra, ela aparecerá aqui.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-[#863D3D] px-7 py-3 font-medium text-white hover:bg-[#5C2A2A]"
            >
              Conhecer produtos
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {pedidos.map((pedido) => (
            <article
              key={pedido.id}
              className="rounded-2xl border border-[#EAD9D3] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#5C2A2A]">
                    Pedido {pedido.codigo}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Realizado em {dataFormatada(pedido.criado_em)}
                  </p>
                </div>

                <span className="rounded-full bg-[#FFF0EF] px-4 py-2 text-sm font-medium text-[#863D3D]">
                  {pedido.status}
                </span>
              </div>

              <div className="mt-5 border-t border-[#F0E5E0] pt-5">
                <h3 className="font-semibold text-[#5C2A2A]">
                  Produtos
                </h3>

                <div className="mt-3 space-y-4">
                  {pedido.itens.map((item, indice) => (
                    <div
                      key={`${pedido.id}-${indice}`}
                      className="flex flex-wrap justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-[#2A2420]">
                          {item.nome_produto}
                        </p>

                        <p className="mt-1 text-gray-600">
                          Tamanho: {item.tamanho} · Cor: {item.cor}
                        </p>

                        <p className="mt-1 text-gray-600">
                          Quantidade: {item.quantidade}
                        </p>
                      </div>

                      <p className="font-medium text-[#5C2A2A]">
                        {moeda(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2 border-t border-[#F0E5E0] pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Frete</span>
                  <span>{moeda(pedido.frete_valor)}</span>
                </div>

                <div className="flex justify-between gap-4 text-base font-semibold text-[#5C2A2A]">
                  <span>Total do pedido</span>
                  <span>{moeda(pedido.valor_total)}</span>
                </div>

                <p className="pt-2 text-gray-600">
                  Entrega: {pedido.modalidade_entrega}
                </p>

                <p className="text-gray-600">
                  Situação da entrega: {pedido.status_operacional}
                </p>
              </div>

              <div className="mt-5 border-t border-[#F0E5E0] pt-5">
                <Link
                  href={`/acompanhar-pedido-conta?id=${encodeURIComponent(String(pedido.id))}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#863D3D] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5C2A2A]"
                >
                  Acompanhar pedido
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
