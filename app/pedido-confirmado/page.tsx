"use client";

import Link from "next/link";

export default function PedidoConfirmadoPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center text-[#5C2A2A]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBF6F3] text-3xl">
        ✓
      </div>

      <h1 className="mt-6 font-serif text-3xl font-semibold">
        Obrigado pela sua compra!
      </h1>

      <p className="mt-4 max-w-lg text-[#5C2A2A]/80">
        Você retornou do checkout da InfinitePay. Estamos verificando a
        confirmação do pagamento. O pedido só será considerado pago depois
        da confirmação pelo nosso sistema.
      </p>

      <p className="mt-3 text-sm text-[#5C2A2A]/70">
        Se o pagamento já foi realizado, aguarde a atualização do pedido.
        Se tiver dúvidas, entre em contato com a loja pelo WhatsApp.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[#863D3D] px-6 py-3 font-medium text-white transition-colors hover:bg-[#5C2A2A]"
      >
        Voltar para a loja
      </Link>
    </main>
  );
}