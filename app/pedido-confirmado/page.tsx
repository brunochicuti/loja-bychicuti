
"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConteudoPedidoConfirmado() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const tokenValido =
    typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

  const acompanhamentoUrl = tokenValido
    ? `/acompanhar-pedido?token=${encodeURIComponent(token)}`
    : null;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center text-[#5C2A2A]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBF6F3] text-3xl">
        ✓
      </div>

      <h1 className="mt-6 font-serif text-3xl font-semibold">
        Obrigado pela sua compra!
      </h1>

      <p className="mt-4 max-w-lg text-[#5C2A2A]/80">
        Estamos verificando a confirmação do pagamento.
        O pedido só será considerado pago depois da confirmação
        pelo nosso sistema.
      </p>

      <p className="mt-3 text-sm text-[#5C2A2A]/70">
        Você pode acompanhar a situação do seu pedido pelo botão abaixo.
        Se o pagamento ainda estiver pendente, aguarde a atualização.
      </p>

      {acompanhamentoUrl ? (
        <Link
          href={acompanhamentoUrl}
          className="mt-8 inline-flex rounded-full bg-[#863D3D] px-6 py-3 font-medium text-white transition-colors hover:bg-[#5C2A2A]"
        >
          Acompanhar meu pedido
        </Link>
      ) : (
        <p className="mt-6 rounded-lg bg-[#FBF6F3] p-4 text-sm">
          Não foi possível identificar o link deste pedido.
          Entre em contato com a loja para obter ajuda.
        </p>
      )}

      <Link
        href="/"
        className="mt-4 inline-flex rounded-full border border-[#863D3D]/30 px-6 py-3 font-medium transition-colors hover:bg-[#FBF6F3]"
      >
        Voltar para a loja
      </Link>
    </main>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense
      fallback={
        <main className="px-4 py-16 text-center">
          Carregando...
        </main>
      }
    >
      <ConteudoPedidoConfirmado />
    </Suspense>
  );
}
