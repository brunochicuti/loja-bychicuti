
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Pedido = {
  codigo: string;
  status: string;
  statusOperacional: string | null;
  criadoEm: string | null;
  atualizadoEm: string | null;
};

const etapas = [
  { status: "PENDENTE", titulo: "Aguardando pagamento" },
  { status: "PAGO", titulo: "Pagamento confirmado" },
  { status: "PREPARANDO", titulo: "Preparando pedido" },
  { status: "PRONTO", titulo: "Pedido pronto" },
  { status: "ENVIADO", titulo: "Pedido enviado" },
  { status: "ENTREGUE", titulo: "Pedido entregue" },
];

function normalizarStatus(status: string | null | undefined) {
  return (status || "").trim().toUpperCase();
}

function formatarData(data: string | null) {
  if (!data) return "Ainda não disponível";

  const dataFormatada = new Date(data);

  if (Number.isNaN(dataFormatada.getTime())) {
    return "Ainda não disponível";
  }

  return dataFormatada.toLocaleString("pt-BR");
}

function ConteudoAcompanharPedido() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function buscarPedido() {
      if (!token) {
        setErro("O link de acompanhamento está incompleto.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await fetch(
          `/api/acompanhar-pedido?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível localizar o pedido."
          );
        }

        if (ativo) {
          setPedido(dados);
          setErro("");
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível consultar o pedido."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    buscarPedido();

    return () => {
      ativo = false;
    };
  }, [token]);

  const statusPagamento = normalizarStatus(pedido?.status);

const statusOperacional = normalizarStatus(
  pedido?.statusOperacional
);

const status =
  statusPagamento !== "PAGO"
    ? statusPagamento
    : statusOperacional === "RECEBIDO"
      ? "PAGO"
      : statusOperacional;

  const etapaAtual = etapas.findIndex(
    (etapa) => etapa.status === status
  );

  const cancelado = status.includes("CANCEL");
  const erroPagamento = status === "ERRO";
  const pago = normalizarStatus(pedido?.status) === "PAGO";

  return (
    <main className="min-h-screen bg-[#FBF6F3] px-4 py-12 text-[#5C2A2A]">
      <div className="mx-auto max-w-2xl">
        <a
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          ← Voltar para a loja
        </a>

        <header className="mb-8 mt-8 text-center">
          <h1 className="text-3xl font-bold">
            Acompanhe seu pedido
          </h1>
          <p className="mt-3 text-[#795858]">
            Veja aqui as informações e o andamento da sua compra.
          </p>
        </header>

        <section className="rounded-2xl border border-[#E9D8D3] bg-white p-6 shadow-sm sm:p-8">
          {carregando ? (
            <p className="py-8 text-center">
              Consultando seu pedido...
            </p>
          ) : erro ? (
            <div className="py-6 text-center">
              <h2 className="text-xl font-semibold">
                Não foi possível consultar
              </h2>
              <p className="mt-3 text-sm">{erro}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-5 rounded-lg bg-[#863D3D] px-5 py-3 text-white"
              >
                Tentar novamente
              </button>
            </div>
          ) : pedido ? (
            <>
              <div className="border-b border-[#F0E4E0] pb-5">
                <p className="text-sm text-[#795858]">
                  Código do pedido
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {pedido.codigo}
                </p>
                <p className="mt-3 text-sm text-[#795858]">
                  Criado em {formatarData(pedido.criadoEm)}
                </p>
              </div>

              <div className="py-6">
                <h2 className="mb-5 text-lg font-semibold">
                  Status do pedido
                </h2>

                {cancelado || erroPagamento ? (
                  <div className="rounded-xl bg-[#FBF6F3] p-4">
                    <p className="font-semibold">
                      {cancelado
                        ? "Pedido cancelado"
                        : "Pagamento com problema"}
                    </p>
                    <p className="mt-1 text-sm">
                      {cancelado
                        ? "Entre em contato com a loja se precisar de ajuda."
                        : "Entre em contato com a loja para verificar o pagamento."}
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-5">
                    {etapas.map((etapa, indice) => {
                      const concluida =
                        etapaAtual >= 0 && indice <= etapaAtual;

                      return (
                        <li
                          key={etapa.status}
                          className="flex items-start gap-3"
                        >
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                              concluida
                                ? "bg-[#863D3D] text-white"
                                : "border border-[#D8C4BE] text-[#795858]"
                            }`}
                          >
                            {concluida ? "✓" : indice + 1}
                          </span>
                          <div>
                            <p
                              className={
                                concluida
                                  ? "font-semibold"
                                  : "text-[#795858]"
                              }
                            >
                              {etapa.titulo}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {!pago && !cancelado && !erroPagamento && (
                  <p className="mt-5 rounded-lg bg-[#FBF6F3] p-3 text-sm">
                    O andamento da preparação e da entrega será exibido
                    conforme a loja atualizar o pedido.
                  </p>
                )}
              </div>

              <div className="border-t border-[#F0E4E0] pt-4 text-sm text-[#795858]">
                <p>
                  Última atualização:{" "}
                  {formatarData(pedido.atualizadoEm)}
                </p>
              </div>
            </>
          ) : null}
        </section>

        <p className="mt-6 text-center text-sm text-[#795858]">
          Dúvidas? Entre em contato com a equipe da ByChicuti.
        </p>
      </div>
    </main>
  );
}

export default function AcompanharPedidoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FBF6F3] px-4 py-12 text-[#5C2A2A]">
          <p className="text-center">
            Carregando acompanhamento do pedido...
          </p>
        </main>
      }
    >
      <ConteudoAcompanharPedido />
    </Suspense>
  );
}