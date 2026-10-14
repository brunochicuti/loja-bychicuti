"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCarrinho } from "@/contexto/carrinhoContexto";

type Produto = {
  id: number | string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  preco: string | number;
  imagem: string | null;
  categoria: string;
};

type Cor = {
  cor: string;
  imagem: string | null;
};

type Variacao = {
  tamanho: string;
  cor: string;
  quantidade: number;
};

type Catalogo = {
  produto: Produto;
  cores: Cor[];
  variacoes: Variacao[];
};

const WHATSAPP = "https://wa.me/556796910734";

export default function PaginaProduto() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { adicionarAoCarrinho, totalItens } = useCarrinho();

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [corSelecionada, setCorSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarProduto() {
      setCarregando(true);
      setErro("");
      setCatalogo(null);
      setCorSelecionada("");
      setTamanhoSelecionado("");
      setAdicionado(false);

      try {
        const resposta = await fetch(
          `/api/catalogo/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível carregar o produto."
          );
        }

        if (ativo) {
          setCatalogo(dados);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar o produto."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarProduto();

    return () => {
      ativo = false;
    };
  }, [slug]);

  if (carregando) {
    return (
      <main className="produto-pagina">
        Carregando produto...
      </main>
    );
  }

  if (erro || !catalogo) {
    return (
      <main className="produto-pagina">
        <h1>Produto indisponível</h1>
        <p>{erro || "Não encontramos esse produto."}</p>
        <a href="/feminino">Voltar para produtos</a>
      </main>
    );
  }

  const { produto, cores, variacoes } = catalogo;

  const coresDisponiveis = cores.filter((cor) =>
    variacoes.some(
      (v) => v.cor === cor.cor && v.quantidade > 0
    )
  );

  // Tamanhos únicos, organizados numericamente em ordem crescente.
  // Os tamanhos antigos continuam sendo exibidos caso estejam cadastrados.
  const tamanhosDisponiveis = [
    ...new Set(variacoes.map((v) => v.tamanho)),
  ].sort((a, b) => {
    const tamanhoA = a.trim().toUpperCase();
    const tamanhoB = b.trim().toUpperCase();

    const ordemAntiga = ["PP", "P", "M", "G", "GG", "XG", "XGG"];

    const indiceA = ordemAntiga.indexOf(tamanhoA);
    const indiceB = ordemAntiga.indexOf(tamanhoB);

    const numericoA = /^\d+$/.test(tamanhoA);
    const numericoB = /^\d+$/.test(tamanhoB);

    if (numericoA && numericoB) {
      return Number(tamanhoA) - Number(tamanhoB);
    }

    if (indiceA !== -1 && indiceB !== -1) {
      return indiceA - indiceB;
    }

    if (numericoA) return -1;
    if (numericoB) return 1;

    if (indiceA !== -1) return -1;
    if (indiceB !== -1) return 1;

    return tamanhoA.localeCompare(tamanhoB, "pt-BR");
  });

  const variacaoSelecionada = variacoes.find(
    (v) =>
      v.cor === corSelecionada &&
      v.tamanho === tamanhoSelecionado
  );

  const emEstoque = (cor: string, tamanho: string) =>
    variacoes.some(
      (v) =>
        v.cor === cor &&
        v.tamanho === tamanho &&
        v.quantidade > 0
    );

  const imagemAtual =
    cores.find((c) => c.cor === corSelecionada)?.imagem ||
    produto.imagem;

  const preco = Number(produto.preco);

  const mensagem = encodeURIComponent(
    [
      "Olá! Tenho interesse neste produto:",
      `Código: ${produto.codigo || "Não informado"}`,
      `Produto: ${produto.nome}`,
      `Preço: ${preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}`,
      `Cor: ${corSelecionada}`,
      `Tamanho: ${tamanhoSelecionado}`,
    ].join("\n")
  );

  function adicionarProduto() {
    const idNumerico = Number(produto.id);

    if (
      !Number.isInteger(idNumerico) ||
      idNumerico <= 0 ||
      !Number.isFinite(preco) ||
      !corSelecionada ||
      !tamanhoSelecionado ||
      !variacaoSelecionada ||
      variacaoSelecionada.quantidade <= 0
    ) {
      console.error("Não foi possível adicionar o produto:", {
        produto,
        corSelecionada,
        tamanhoSelecionado,
        variacaoSelecionada,
      });
      return;
    }

    adicionarAoCarrinho({
      id: idNumerico,
      nome: produto.nome,
      preco,
      imagem: imagemAtual,
      cor: corSelecionada,
      tamanho: tamanhoSelecionado,
      quantidade: 1,
    });

    setAdicionado(true);
  }

  return (
    <main className="produto-pagina">
      <a href="/feminino" className="produto-voltar">
        ← Voltar para produtos
      </a>

      <section className="produto-detalhes">
        <div className="produto-imagem">
          {imagemAtual ? (
            <img src={imagemAtual} alt={produto.nome} />
          ) : (
            <p>Imagem não cadastrada</p>
          )}
        </div>

        <div className="produto-info">
          <p className="produto-categoria">{produto.categoria}</p>

          <h1>{produto.nome}</h1>

          <p className="produto-codigo">
            Código do produto:{" "}
            <strong>{produto.codigo || "Não informado"}</strong>
          </p>

          <p className="produto-preco">
            {preco.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>

          {produto.descricao && <p>{produto.descricao}</p>}

          <h2>Cor</h2>

          <div className="produto-opcoes">
            {coresDisponiveis.map((cor) => (
              <button
                key={cor.cor}
                type="button"
                className={
                  corSelecionada === cor.cor
                    ? "produto-opcao selecionada"
                    : "produto-opcao"
                }
                aria-pressed={corSelecionada === cor.cor}
                onClick={() => {
                  setCorSelecionada(cor.cor);
                  setTamanhoSelecionado("");
                  setAdicionado(false);
                }}
              >
                {cor.cor}
              </button>
            ))}
          </div>

          {coresDisponiveis.length === 0 && (
            <p>Produto sem estoque no momento.</p>
          )}

          <h2>Tamanho</h2>

          <div className="produto-opcoes">
            {tamanhosDisponiveis.map((tamanho) => {
              const disponivel = corSelecionada
                ? emEstoque(corSelecionada, tamanho)
                : variacoes.some(
                    (v) =>
                      v.tamanho === tamanho &&
                      v.quantidade > 0
                  );

              return (
                <button
                  key={tamanho}
                  type="button"
                  disabled={!disponivel || !corSelecionada}
                  className={[
                    "produto-opcao",
                    tamanhoSelecionado === tamanho
                      ? "selecionada"
                      : "",
                  ].join(" ")}
                  aria-pressed={tamanhoSelecionado === tamanho}
                  onClick={() => {
                    setTamanhoSelecionado(tamanho);
                    setAdicionado(false);
                  }}
                >
                  {tamanho}
                  {!disponivel ? " — esgotado" : ""}
                </button>
              );
            })}
          </div>

          {variacaoSelecionada &&
            variacaoSelecionada.quantidade > 0 && (
              <p className="produto-estoque">
                Disponível: {variacaoSelecionada.quantidade} unidade(s)
              </p>
            )}

          {variacaoSelecionada &&
            variacaoSelecionada.quantidade === 0 && (
              <p>Essa combinação está esgotada.</p>
            )}

          {corSelecionada &&
          tamanhoSelecionado &&
          variacaoSelecionada &&
          variacaoSelecionada.quantidade > 0 ? (
            <div className="produto-acoes">
              <button
                type="button"
                className="produto-adicionar"
                onClick={adicionarProduto}
              >
                Adicionar ao carrinho
              </button>

              <p className="produto-teste" aria-live="polite">
                Itens no carrinho: {totalItens}
              </p>

              {adicionado && (
                <p className="produto-sucesso" role="status">
                  Produto adicionado ao carrinho!
                </p>
              )}

              <a
                className="produto-whatsapp"
                href={`${WHATSAPP}?text=${mensagem}`}
                target="_blank"
                rel="noreferrer"
              >
                Comprar pelo WhatsApp
              </a>
            </div>
          ) : (
            <p className="produto-aviso">
              Selecione uma cor e um tamanho disponíveis.
            </p>
          )}
        </div>
      </section>

      <style jsx>{`
        .produto-pagina {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 20px 60px;
          color: #5c2a2a;
        }

        .produto-voltar {
          display: inline-block;
          margin-bottom: 28px;
          color: #863d3d;
          text-decoration: none;
        }

        .produto-detalhes {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 44px;
          align-items: start;
        }

        .produto-imagem {
          background: #fbf6f3;
          border-radius: 12px;
          overflow: hidden;
        }

        .produto-imagem img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .produto-categoria {
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 12px;
        }

        .produto-info h1 {
          font-size: 32px;
          margin: 8px 0 14px;
        }

        .produto-codigo {
          margin: 0 0 14px;
          font-size: 14px;
          color: #7a5555;
        }

        .produto-preco {
          font-size: 26px;
          font-weight: 600;
          margin: 0 0 24px;
        }

        .produto-info h2 {
          font-size: 16px;
          margin: 24px 0 12px;
        }

        .produto-opcoes {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .produto-opcao {
          border: 1px solid #d7b8b8;
          border-radius: 7px;
          padding: 10px 14px;
          background: white;
          color: #5c2a2a;
          cursor: pointer;
        }

        .produto-opcao.selecionada {
          border-color: #863d3d;
          background: #863d3d;
          color: white;
        }

        .produto-opcao:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .produto-estoque {
          margin-top: 16px;
        }

        .produto-acoes {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          margin-top: 20px;
        }

        .produto-adicionar {
          padding: 14px 20px;
          border: 1px solid #863d3d;
          border-radius: 8px;
          background: transparent;
          color: #863d3d;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .produto-adicionar:hover {
          background: #f3e5e2;
        }

        .produto-whatsapp {
          display: inline-block;
          margin-top: 0;
          padding: 14px 20px;
          border-radius: 8px;
          background: #863d3d;
          color: white;
          text-decoration: none;
          text-align: center;
        }

        .produto-sucesso {
          margin: 0;
          color: #28653a;
          font-size: 14px;
        }

        .produto-teste {
          margin: 0;
          color: #863d3d;
          font-size: 14px;
        }

        .produto-aviso {
          margin-top: 20px;
          font-size: 14px;
        }

        @media (max-width: 700px) {
          .produto-detalhes {
            grid-template-columns: 1fr;
            gap: 26px;
          }

          .produto-info h1 {
            font-size: 26px;
          }

          .produto-whatsapp {
            display: block;
          }
        }
      `}</style>
    </main>
  );
}
