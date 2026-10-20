
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useCarrinho } from "@/contexto/carrinhoContexto";

type EnderecoEntrega = {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

type ModalidadeEntrega = "ENTREGA" | "RETIRADA";

const ENDERECO_LOJA =
  "BR 163 km288 — Travessão Maria Curandeira, Douradina/MS";

export default function CheckoutPage() {
  const { carrinho, carregado, valorTotal } = useCarrinho();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [modalidadeEntrega, setModalidadeEntrega] =
    useState<ModalidadeEntrega>("ENTREGA");

  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [frete, setFrete] = useState<number | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [freteCalculadoPara, setFreteCalculadoPara] = useState("");

  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  function obterEndereco(): EnderecoEntrega {
    return {
      cep: cep.replace(/\D/g, ""),
      endereco: endereco.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      uf: uf.trim().toUpperCase(),
    };
  }

  function chaveEndereco(): string {
    return JSON.stringify(obterEndereco());
  }

  const enderecoAtual = chaveEndereco();

  const freteValido =
    modalidadeEntrega === "RETIRADA" ||
    (frete !== null &&
      freteCalculadoPara !== "" &&
      freteCalculadoPara === enderecoAtual);

  const freteAplicado =
    modalidadeEntrega === "RETIRADA"
      ? 0
      : freteValido
        ? frete ?? 0
        : 0;

  const totalComFrete = valorTotal + freteAplicado;

  function invalidarFrete() {
    setFrete(null);
    setDistanciaKm(null);
    setFreteCalculadoPara("");
  }

  function selecionarModalidade(tipo: ModalidadeEntrega) {
    setModalidadeEntrega(tipo);
    setErro("");

    if (tipo === "RETIRADA") {
      setFrete(0);
      setDistanciaKm(null);
      setFreteCalculadoPara("RETIRADA");
    } else {
      invalidarFrete();
    }
  }

  async function buscarCep() {
    const cepNumerico = cep.replace(/\D/g, "");

    if (cepNumerico.length !== 8) {
      setErro("Digite um CEP válido com 8 números.");
      return;
    }

    setBuscandoCep(true);
    setErro("");
    invalidarFrete();

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepNumerico}/json/`
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CEP.");
      }

      const dados = await resposta.json();

      if (dados.erro) {
        throw new Error("CEP não encontrado. Confira os números.");
      }

      setEndereco(dados.logradouro || "");
      setBairro(dados.bairro || "");
      setCidade(dados.localidade || "");
      setUf(dados.uf || "");
    } catch (erroRecebido) {
      setErro(
        erroRecebido instanceof Error
          ? erroRecebido.message
          : "Erro ao consultar o CEP."
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  async function calcularFreteEntrega() {
    setErro("");

    const destino = obterEndereco();

    if (
      !/^\d{8}$/.test(destino.cep) ||
      !destino.endereco ||
      !destino.numero ||
      !destino.bairro ||
      !destino.cidade ||
      !/^[A-Z]{2}$/.test(destino.uf)
    ) {
      setErro(
        "Preencha o CEP, rua, número, bairro, cidade e estado antes de calcular o frete."
      );
      return;
    }

    setCalculandoFrete(true);
    invalidarFrete();

    try {
      const resposta = await fetch("/api/frete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endereco: destino,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível calcular o frete."
        );
      }

      if (
        typeof dados.frete !== "number" ||
        !Number.isFinite(dados.frete) ||
        dados.frete < 0 ||
        typeof dados.distanciaKm !== "number" ||
        !Number.isFinite(dados.distanciaKm)
      ) {
        throw new Error("O servidor retornou um frete inválido.");
      }

      setFrete(dados.frete);
      setDistanciaKm(dados.distanciaKm);
      setFreteCalculadoPara(JSON.stringify(destino));
    } catch (erroRecebido) {
      setErro(
        erroRecebido instanceof Error
          ? erroRecebido.message
          : "Erro ao calcular o frete."
      );
    } finally {
      setCalculandoFrete(false);
    }
  }

  async function finalizarCompra(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();
    setErro("");

    if (carrinho.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    if (nome.trim().length < 3) {
      setErro("Informe seu nome completo.");
      return;
    }

    if (telefone.trim().length < 10) {
      setErro("Informe um WhatsApp válido para contato.");
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

    const destino = obterEndereco();

    if (modalidadeEntrega === "ENTREGA") {
      if (
        destino.cep.length !== 8 ||
        !destino.endereco ||
        !destino.numero ||
        !destino.bairro ||
        !destino.cidade ||
        !/^[A-Z]{2}$/.test(destino.uf)
      ) {
        setErro(
          "Confira o CEP e preencha todos os campos obrigatórios do endereço."
        );
        return;
      }

      if (!freteValido) {
        setErro(
          "Calcule o frete para o endereço atual antes de continuar para o pagamento."
        );
        return;
      }
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modalidadeEntrega,
          cliente: {
            nome: nome.trim(),
            telefone: telefone.trim(),
            ...destino,
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

      {carrinho.length === 0 ? (
        <section className="mt-8 rounded-xl border border-[#863D3D]/15 bg-white p-5">
          <p>Seu carrinho está vazio.</p>
          <Link
            href="/feminino"
            className="mt-4 inline-block underline"
          >
            Ver produtos
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-xl border border-[#863D3D]/15 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold">
              Como deseja receber seu pedido?
            </h2>

            <div className="mt-4 space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  modalidadeEntrega === "ENTREGA"
                    ? "border-[#863D3D] bg-[#FBF6F3]"
                    : "border-[#863D3D]/20 hover:bg-[#FBF6F3]"
                }`}
              >
                <input
                  type="radio"
                  name="modalidadeEntrega"
                  value="ENTREGA"
                  checked={modalidadeEntrega === "ENTREGA"}
                  onChange={() => selecionarModalidade("ENTREGA")}
                  className="mt-1 accent-[#863D3D]"
                />

                <span>
                  <strong className="block">Receber em casa</strong>
                  <span className="mt-1 block text-sm text-[#5C2A2A]/70">
                    Informe seu endereço e calcule o valor da entrega.
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  modalidadeEntrega === "RETIRADA"
                    ? "border-[#863D3D] bg-[#FBF6F3]"
                    : "border-[#863D3D]/20 hover:bg-[#FBF6F3]"
                }`}
              >
                <input
                  type="radio"
                  name="modalidadeEntrega"
                  value="RETIRADA"
                  checked={modalidadeEntrega === "RETIRADA"}
                  onChange={() => selecionarModalidade("RETIRADA")}
                  className="mt-1 accent-[#863D3D]"
                />

                <span>
                  <strong className="block">Retirar na loja</strong>
                  <span className="mt-1 block text-sm text-[#5C2A2A]/70">
                    Sem custo de frete. Você retira o pedido na loja.
                  </span>
                </span>
              </label>
            </div>

            {modalidadeEntrega === "RETIRADA" && (
              <div className="mt-4 rounded-lg bg-[#FBF6F3] p-4">
                <p className="font-semibold">
                  Retirada na ByChicuti
                </p>

                <p className="mt-2 text-sm">{ENDERECO_LOJA}</p>

                <p className="mt-3 text-sm font-medium">
                  Horário de atendimento
                </p>

                <p className="mt-1 text-sm">
                  Segunda a sexta: 7h às 18h
                  <br />
                  Sábado: 7h às 12h
                </p>

                <p className="mt-3 text-sm text-[#5C2A2A]/70">
                  O frete será de R$ 0,00. Aguarde as orientações da loja
                  sobre a retirada do pedido.
                </p>
              </div>
            )}
          </section>

          <section className="mt-6 rounded-xl border border-[#863D3D]/15 bg-white p-5">
            <h2 className="font-serif text-xl font-semibold">
              Resumo do pedido
            </h2>

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

            <div className="mt-5 space-y-3 border-t border-[#863D3D]/10 pt-4">
              <div className="flex justify-between gap-4">
                <span>Subtotal dos produtos</span>
                <span>{formatarMoeda(valorTotal)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span>
                  {modalidadeEntrega === "RETIRADA"
                    ? "Retirada na loja"
                    : "Frete"}
                </span>

                <span
                  className={
                    modalidadeEntrega === "RETIRADA"
                      ? "font-medium text-green-700"
                      : ""
                  }
                >
                  {modalidadeEntrega === "RETIRADA"
                    ? "Grátis"
                    : freteValido
                      ? formatarMoeda(frete ?? 0)
                      : "Ainda não calculado"}
                </span>
              </div>

              {modalidadeEntrega === "ENTREGA" &&
                freteValido &&
                distanciaKm !== null && (
                  <p className="text-xs text-[#5C2A2A]/65">
                    Distância estimada por rota de carro:{" "}
                    {distanciaKm.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    km.
                  </p>
                )}

              {modalidadeEntrega === "ENTREGA" && (
                <button
                  type="button"
                  onClick={calcularFreteEntrega}
                  disabled={
                    calculandoFrete || buscandoCep || enviando
                  }
                  className="w-full rounded-full border border-[#863D3D]/30 px-5 py-3 font-medium hover:bg-[#FBF6F3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {calculandoFrete
                    ? "Calculando frete..."
                    : freteValido
                      ? "Recalcular frete"
                      : "Calcular frete"}
                </button>
              )}

              <div className="flex justify-between gap-4 border-t border-[#863D3D]/10 pt-3 text-lg font-semibold">
                <span>Total do pedido</span>
                <span>{formatarMoeda(totalComFrete)}</span>
              </div>

              <p className="text-xs text-[#5C2A2A]/65">
                {modalidadeEntrega === "RETIRADA"
                  ? "O total não inclui frete, pois você retirará o pedido na loja."
                  : "O total inclui o frete depois de calculado para o endereço informado."}
              </p>
            </div>
          </section>

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

            {modalidadeEntrega === "ENTREGA" && (
              <div className="border-t border-[#863D3D]/15 pt-5">
                <h3 className="mb-4 font-serif text-lg font-semibold">
                  Endereço de entrega
                </h3>

                <div className="space-y-2">
                  <label
                    htmlFor="cep"
                    className="block text-sm font-medium"
                  >
                    CEP
                  </label>

                  <div className="flex gap-2">
                    <input
                      id="cep"
                      name="cep"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                      maxLength={8}
                      value={cep}
                      onChange={(e) => {
                        setCep(
                          e.target.value.replace(/\D/g, "").slice(0, 8)
                        );
                        invalidarFrete();
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                      placeholder="00000000"
                    />

                    <button
                      type="button"
                      onClick={buscarCep}
                      disabled={
                        buscandoCep || calculandoFrete || enviando
                      }
                      className="rounded-lg border border-[#863D3D]/30 px-4 py-3 text-sm font-medium hover:bg-[#FBF6F3] disabled:opacity-60"
                    >
                      {buscandoCep ? "Buscando..." : "Buscar CEP"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label
                    htmlFor="endereco"
                    className="block text-sm font-medium"
                  >
                    Rua ou avenida
                  </label>

                  <input
                    id="endereco"
                    name="endereco"
                    autoComplete="address-line1"
                    required
                    maxLength={200}
                    value={endereco}
                    onChange={(e) => {
                      setEndereco(e.target.value);
                      invalidarFrete();
                    }}
                    className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="numero"
                      className="mb-2 block text-sm font-medium"
                    >
                      Número
                    </label>

                    <input
                      id="numero"
                      name="numero"
                      autoComplete="address-line2"
                      required
                      maxLength={20}
                      value={numero}
                      onChange={(e) => {
                        setNumero(e.target.value);
                        invalidarFrete();
                      }}
                      className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                      placeholder="Número ou s/n"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="complemento"
                      className="mb-2 block text-sm font-medium"
                    >
                      Complemento (opcional)
                    </label>

                    <input
                      id="complemento"
                      name="complemento"
                      maxLength={100}
                      value={complemento}
                      onChange={(e) => {
                        setComplemento(e.target.value);
                        invalidarFrete();
                      }}
                      className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                      placeholder="Casa, apartamento..."
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label
                    htmlFor="bairro"
                    className="block text-sm font-medium"
                  >
                    Bairro
                  </label>

                  <input
                    id="bairro"
                    name="bairro"
                    autoComplete="address-level3"
                    required
                    maxLength={100}
                    value={bairro}
                    onChange={(e) => {
                      setBairro(e.target.value);
                      invalidarFrete();
                    }}
                    className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                    placeholder="Seu bairro"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="cidade"
                      className="mb-2 block text-sm font-medium"
                    >
                      Cidade
                    </label>

                    <input
                      id="cidade"
                      name="cidade"
                      autoComplete="address-level2"
                      required
                      maxLength={100}
                      value={cidade}
                      onChange={(e) => {
                        setCidade(e.target.value);
                        invalidarFrete();
                      }}
                      className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="uf"
                      className="mb-2 block text-sm font-medium"
                    >
                      Estado
                    </label>

                    <input
                      id="uf"
                      name="uf"
                      autoComplete="address-level1"
                      required
                      minLength={2}
                      maxLength={2}
                      value={uf}
                      onChange={(e) => {
                        setUf(e.target.value.toUpperCase());
                        invalidarFrete();
                      }}
                      className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 uppercase outline-none focus:ring-2 focus:ring-[#863D3D]/30"
                      placeholder="MS"
                    />
                  </div>
                </div>
              </div>
            )}

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
              disabled={
                enviando ||
                buscandoCep ||
                calculandoFrete ||
                carrinho.length === 0
              }
              className="w-full rounded-full bg-[#863D3D] px-5 py-4 font-medium text-white transition-colors hover:bg-[#5C2A2A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando
                ? "Preparando pagamento..."
                : "Continuar para pagamento"}
            </button>

            <p className="text-center text-xs text-[#5C2A2A]/65">
              O pagamento será realizado no ambiente de checkout da
              InfinitePay.
            </p>
          </form>
        </>
      )}
    </main>
  );
}
