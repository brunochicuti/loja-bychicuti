
"use client";

import { useState } from "react";
import Link from "next/link";
import { useCarrinho } from "@/contexto/carrinhoContexto";

export default function CheckoutPage() {
  const { carrinho, carregado, valorTotal } = useCarrinho();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  async function finalizarCompra(
    evento: React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();
    setErro("");

    if (carrinho.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    if (
      carrinho.some(
        (item) =>
          !item.variacaoId ||
          !Number.isInteger(Number(item.variacaoId)) ||
          Number(item.variacaoId) <= 0 ||
          !Number.isInteger(Number(item.quantidade)) ||
          Number(item.quantidade) <= 0
      )
    ) {
      setErro(
        "Há um produto com dados inválidos no carrinho. Remova-o e adicione-o novamente."
      );
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente: {
            nome: nome.trim(),
            telefone: telefone.trim(),
          },
          itens: carrinho.map((item) => ({
            variacaoId: Number(item.variacaoId),
            quantidade: Number(item.quantidade),
          })),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível iniciar o pagamento."
        );
      }

      if (!dados.checkoutUrl) {
        throw new Error("O link de pagamento não foi recebido.");
      }

      window.location.assign(dados.checkoutUrl);
    } catch (erroRecebido) {
      setErro(
        erroRecebido instanceof Error
          ? erroRecebido.message
          : "Ocorreu um erro. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!carregado) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        Carregando seu carrinho...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-[#5C2A2A]">
      <Link
        href="/"
        className="text-sm underline hover:text-[#863D3D]"
      >
        Voltar para a loja
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-semibold">
        Finalizar compra
      </h1>

      <p className="mt-2 text-sm text-[#5C2A2A]/70">
        Confira seus produtos e informe seus dados para continuar.
      </p>

      <section className="mt-8 rounded-xl border border-[#863D3D]/15 bg-white p-5">
        <h2 className="font-serif text-xl font-semibold">
          Resumo do pedido
        </h2>

        {carrinho.length === 0 ? (
          <div className="mt-4">
            <p>Seu carrinho está vazio.</p>
            <Link
              href="/feminino"
              className="mt-4 inline-block underline"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-4">
              {carrinho.map((item) => (
                <li
                  key={`${item.variacaoId}-${item.cor}-${item.tamanho}`}
                  className="flex justify-between gap-4 border-b border-[#863D3D]/10 pb-3"
                >
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-[#5C2A2A]/70">
                      Tamanho: {item.tamanho} · Cor: {item.cor}
                    </p>
                    <p className="text-sm">
                      Quantidade: {item.quantidade}
                    </p>
                  </div>

                  <p className="shrink-0 font-medium">
                    {formatarMoeda(item.preco * item.quantidade)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex justify-between gap-4 text-lg font-semibold">
              <span>Total dos produtos</span>
              <span>{formatarMoeda(valorTotal)}</span>
            </div>

            <p className="mt-2 text-xs text-[#5C2A2A]/65">
              O valor e a disponibilidade serão confirmados pelo servidor.
              O frete, se houver, será informado antes da conclusão da compra.
            </p>
          </>
        )}
      </section>

      {carrinho.length > 0 && (
        <form
          onSubmit={finalizarCompra}
          className="mt-6 space-y-5 rounded-xl border border-[#863D3D]/15 bg-white p-5"
        >
          <h2 className="font-serif text-xl font-semibold">
            Seus dados
          </h2>

          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium"
            >
              Nome completo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              maxLength={150}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label
              htmlFor="telefone"
              className="mb-2 block text-sm font-medium"
            >
              WhatsApp para contato
            </label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              autoComplete="tel"
              required
              minLength={10}
              maxLength={30}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
              placeholder="(67) 99999-9999"
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || carrinho.length === 0}
            className="w-full rounded-full bg-[#863D3D] px-5 py-4 font-medium text-white transition-colors hover:bg-[#5C2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Preparando pagamento..."
              : "Continuar para pagamento Pix"}
          </button>

          <p className="text-center text-xs text-[#5C2A2A]/65">
            O pagamento será realizado no ambiente de checkout da InfinitePay.
          </p>
        </form>
      )}
    </main>
  );
}
