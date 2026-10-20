"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Pedido = {
  codigo: string;
  status: string;
  statusOperacional: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
  modalidadeEntrega: string | null;
};

const etapas = [
  { status: "PENDENTE", titulo: "Aguardando pagamento" },
  { status: "PAGO", titulo: "Pagamento confirmado" },
  { status: "PREPARANDO", titulo: "Preparando seu pedido" },
  { status: "PRONTO", titulo: "Pedido pronto" },
  { status: "ENVIADO", titulo: "Pedido enviado" },
  { status: "ENTREGUE", titulo: "Pedido entregue" },
];

function normalizarStatus(status?: string | null) {
  return (status ?? "").trim().toUpperCase();
}

function formatarData(data?: string | null) {
  if (!data) return "Não disponível";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "Não disponível";
  }

  return dataConvertida.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ConteudoAcompanhamento() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const modalidade = (pedido?.modalidadeEntrega ?? "")
  .trim()
  .toUpperCase();
  const ehRetirada = modalidade.includes("RETIRADA");

  useEffect(() => {
    let cancelado = false;

    async function buscarPedido() {
      setCarregando(true);
      setErro("");
      setPedido(null);

      if (!id || !/^\d+$/.test(id)) {
        setErro("O identificador do pedido é inválido.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await fetch(
          `/api/meus-pedidos/${encodeURIComponent(id)}/acompanhar`,
          { cache: "no-store" }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível consultar o pedido."
          );
        }

        if (!cancelado) {
          setPedido(dados);
        }
      } catch (error) {
        if (!cancelado) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível consultar o pedido."
          );
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    buscarPedido();

    return () => {
      cancelado = true;
    };
  }, [id]);

  const statusPagamento = normalizarStatus(pedido?.status);
  const statusOperacional = normalizarStatus(pedido?.statusOperacional);

  const status =
    statusPagamento !== "PAGO"
      ? statusPagamento
      : !statusOperacional || statusOperacional === "RECEBIDO"
        ? "PAGO"
        : statusOperacional;

  const etapaAtual = etapas.findIndex(
    (etapa) => etapa.status === status
  );

  const pedidoCancelado = status.includes("CANCEL");
  const erroPagamento = status === "ERRO";

  return (
    <main className="min-h-screen bg-[#FBF6F3] px-4 py-10 text-[#5C2A2A] sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/meus-pedidos"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#863D3D] transition hover:text-[#5C2A2A]"
        >
          <span aria-hidden="true">←</span>
          Voltar para meus pedidos
        </Link>

        <section className="mt-6 rounded-3xl border border-[#F0E5E0] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-[#863D3D]">
            ByChicuti
          </p>

          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Acompanhar pedido
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#795B56]">
            Confira o andamento do seu pedido e as atualizações de entrega.
          </p>

          {carregando ? (
            <div
              className="py-12 text-center text-sm text-[#795B56]"
              role="status"
            >
              Carregando informações do pedido...
            </div>
          ) : erro ? (
            <div
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
              role="alert"
            >
              <h2 className="font-semibold text-red-800">
                Não foi possível carregar o pedido
              </h2>
              <p className="mt-2 text-sm leading-6 text-red-700">{erro}</p>
              <Link
                href="/meus-pedidos"
                className="mt-4 inline-flex rounded-full bg-[#863D3D] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#5C2A2A]"
              >
                Voltar para meus pedidos
              </Link>
            </div>
          ) : pedido ? (
            <>
              <div className="mt-7 rounded-2xl bg-[#FBF6F3] p-5">
                <p className="text-sm text-[#795B56]">Número do pedido</p>
                <p className="mt-1 text-xl font-semibold">
                  {pedido.codigo}
                </p>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[#795B56]">Criado em</p>
                    <p className="mt-1 font-medium">
                      {formatarData(pedido.criadoEm)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#795B56]">Última atualização</p>
                    <p className="mt-1 font-medium">
                      {formatarData(pedido.atualizadoEm)}
                    </p>
                  </div>
                </div>
              </div>

              {pedidoCancelado || erroPagamento ? (
                <div
                  className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
                  role="status"
                >
                  <h2 className="font-semibold text-red-800">
                    {pedidoCancelado
                      ? "Pedido cancelado"
                      : "Houve um problema com o pagamento"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {pedidoCancelado
                      ? "Este pedido está marcado como cancelado. Se precisar de ajuda, entre em contato com a loja."
                      : "O pagamento está marcado com erro. Entre em contato com a loja para verificar a situação."}
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold">
                    Etapas do pedido
                  </h2>

                  <ol className="mt-5 space-y-5">
                    {etapas.map((etapa, indice) => {
                      const concluida =
                        etapaAtual >= 0 && indice <= etapaAtual;
                      const atual = indice === etapaAtual;

                      return (
                        <li
                          key={etapa.status}
                          className="flex items-start gap-4"
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              concluida
                                ? "bg-[#863D3D] text-white"
                                : "border border-[#E7D6D0] bg-white text-[#795B56]"
                            }`}
                          >
                            {concluida ? "✓" : indice + 1}
                          </span>

                          <div className="pt-1">
                            <p
                              className={`font-medium ${
                                atual
                                  ? "text-[#863D3D]"
                                  : "text-[#5C2A2A]"
                              }`}
                            >
                                {etapa.status === "ENVIADO" && ehRetirada
                                ? "Pedido pronto para a retirada"
                                : etapa.titulo}
                                {atual ? " · Etapa atual" : ""}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <p className="mt-7 text-xs leading-5 text-[#795B56]">
                As informações exibidas refletem o status registrado pela
                loja. Atualize a página para consultar as últimas alterações.
              </p>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default function AcompanharPedidoContaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FBF6F3] px-4 py-16 text-center text-[#5C2A2A]">
          Carregando página...
        </main>
      }
    >
      <ConteudoAcompanhamento />
    </Suspense>
  );
}