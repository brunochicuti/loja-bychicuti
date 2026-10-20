"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  id: number | string;
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
  const router = useRouter();

  const { adicionarAoCarrinho, totalItens, carrinho } = useCarrinho();

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [corSelecionada, setCorSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [adicionado, setAdicionado] = useState(false);

  const imagemRef = useRef<HTMLDivElement>(null);
  const [posicaoLupa, setPosicaoLupa] = useState({ x: 50, y: 50 });
  const [zoomAtivo, setZoomAtivo] = useState(false);

  const [quantidade, setQuantidade] = useState(1);

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

    const coresPermitidas = [
      "Azul Marinho",
      "Cappuccino",
      "Nude",
      "Satin",
      "Sensuale",
      "Verde Garden",
      "Vermelha",
    ];

    const coresDisponiveis = cores.filter(
      (cor) =>
        coresPermitidas.includes(cor.cor) &&
        variacoes.some(
          (v) => v.cor === cor.cor && v.quantidade > 0
        )
    );

  // Tamanhos únicos, organizados numericamente em ordem crescente.
  // Os tamanhos antigos continuam sendo exibidos caso estejam cadastrados.
  const tamanhosDisponiveis = [
    ...new Set(
      variacoes
        .map((v) => v.tamanho.trim())
        .filter((tamanho) => /^\d+$/.test(tamanho))
    ),
  ].sort((a, b) => Number(a) - Number(b));

  const variacaoSelecionada = variacoes.find(
    (v) =>
      v.cor === corSelecionada &&
      v.tamanho === tamanhoSelecionado
  );

    const idNumerico = Number(produto.id);

    const quantidadeNoCarrinho = carrinho
      .filter(
        (item) =>
          Number(item.id) === idNumerico &&
          item.cor === corSelecionada &&
          item.tamanho === tamanhoSelecionado
      )
      .reduce((total, item) => total + item.quantidade, 0);

    const estoqueRestante = Math.max(
      0,
      Number(variacaoSelecionada?.quantidade ?? 0) -
        quantidadeNoCarrinho
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

  const total = (preco * quantidade).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
  });
  
  
    const mensagem = encodeURIComponent(
      [
        "Olá! Gostaria de fazer uma encomenda pela ByChicuti.",
        "",
        `Produto: ${produto.nome}`,
        `Código: ${produto.codigo || "Não informado"}`,
        `Cor: ${corSelecionada || "Não selecionada"}`,
        `Tamanho: ${tamanhoSelecionado || "Não selecionado"}`,
        `Quantidade: ${quantidade}`,
        `Valor dos produtos: ${total}`,
      ].join("\n")
    );


    function adicionarProduto(): boolean {
      const idNumerico = Number(produto.id);

      if (
        !Number.isInteger(idNumerico) ||
        idNumerico <= 0 ||
        !Number.isFinite(preco) ||
        preco < 0 ||
        !corSelecionada ||
        !tamanhoSelecionado ||
        !variacaoSelecionada ||
        Number(variacaoSelecionada.id) <= 0 ||
        variacaoSelecionada.quantidade <= 0 ||
        quantidade <= 0 ||
        quantidade > estoqueRestante
      ) {
        setErro("Confira a cor, o tamanho e a quantidade disponíveis.");
        return false;
      }

      adicionarAoCarrinho({
        id: idNumerico,
        variacaoId: variacaoSelecionada.id,
        nome: produto.nome,
        preco,
        imagem: imagemAtual,
        cor: corSelecionada,
        tamanho: tamanhoSelecionado,
        quantidade,
      });

      setErro("");
      setAdicionado(true);
      return true;
    }

    function comprarAgora() {
      if (adicionarProduto()) {
        router.push("/checkout");
      }
    }

  return (
    <main className="produto-pagina">
      <a href="/feminino" className="produto-voltar">
        ← Voltar para produtos
      </a>

      <section className="produto-detalhes">
        <div
          ref={imagemRef}
          className={`produto-imagem ${zoomAtivo ? "zoom-ativo" : ""}`}
          onMouseMove={(e) => {
            if (!zoomAtivo || !imagemRef.current) return;

            const rect = imagemRef.current.getBoundingClientRect();

            setPosicaoLupa({
              x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
              y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
            });
          }}
        >
          {imagemAtual ? (
            <button
              type="button"
              className="produto-zoom-botao"
              onClick={() => setZoomAtivo((ativo) => !ativo)}
              aria-label={zoomAtivo ? "Voltar ao tamanho normal" : "Ampliar imagem"}
              aria-pressed={zoomAtivo}
            >
              <img
                src={imagemAtual}
                alt={produto.nome}
                style={{
                  transform: zoomAtivo ? "scale(2.5)" : "scale(1)",
                  transformOrigin: `${posicaoLupa.x}% ${posicaoLupa.y}%`,
                }}
              />
            </button>
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
                  setQuantidade(1);
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
                    setQuantidade(1);
                  }}
                >
                  {tamanho}
                  {!disponivel ? " — esgotado" : ""}
                </button>
              );
            })}
          </div>

              <h2>Quantidade</h2>

              <div className="flex items-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() =>
                    setQuantidade((atual) => Math.max(1, atual - 1))
                    
                  }
                  disabled={quantidade <= 1}
                  className="w-11 h-11 rounded-lg border border-[#D7B8B8] disabled:opacity-40"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>

                <span className="w-8 text-center font-semibold" aria-live="polite">
                  {quantidade}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantidade((atual) =>
                      Math.min(estoqueRestante, atual + 1)
                    )
                  }
                  disabled={
                    !variacaoSelecionada || quantidade >= estoqueRestante
                  }
                  className="w-11 h-11 rounded-lg border border-[#D7B8B8] disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
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
              className="produto-comprar-agora"
              onClick={comprarAgora}
            >
              Comprar agora
            </button>

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
              Faça sua encomenda pelo WhatsApp
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
          position: relative;
        }

        .produto-zoom-botao {
          display: block;
          position: relative;
          width: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          overflow: hidden;
          cursor: zoom-in;
        }

        .produto-zoom-botao img {
          display: block;
          width: 100%;
          height: auto;
          transition: transform 0.25s ease;
        }

        .produto-imagem.zoom-ativo .produto-zoom-botao {
          cursor: zoom-out;
        }
          
        .produto-lupa {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-repeat: no-repeat;
        background-size: 250% 250%;
        border: 2px solid #863d3d;
        border-radius: 12px;
        }
        .produto-ampliado img {
        max-width: 100%;
        max-height: 80%;
        object-fit: contain;
        border-radius: 8px;
      }

      .produto-ampliado p {
        color: white;
        font-size: 14px;
        margin-top: 14px;
      }

      .produto-fechar-ampliado {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border: 0;
        border-radius: 50%;
        background: #fbf6f3;
        color: #5c2a2a;
        font-size: 22px;
        cursor: pointer;
      }

      @media (hover: none), (max-width: 700px) {
        .produto-imagem {
          cursor: zoom-in;
        }

        .produto-lupa {
          display: none;
        }
      }
        .produto-ampliado {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(30, 15, 15, 0.92);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          cursor: zoom-out;
        }
        .produto-ampliado img {
          max-width: 100%;
          max-height: 80%;
          object-fit: contain;
          border-radius: 8px;
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

        .produto-comprar-agora {
          padding: 14px 20px;
          border: 1px solid #863d3d;
          border-radius: 8px;
          background: #863d3d;
          color: white;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .produto-comprar-agora:hover {
          background: #5c2a2a;
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