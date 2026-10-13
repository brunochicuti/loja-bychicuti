
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ItemCarrinho = {
  id: number;
  nome: string;
  preco: number;
  imagem: string | null;
  tamanho: string;
  cor: string;
  quantidade: number;
};

type CarrinhoContextoType = {
  carrinho: ItemCarrinho[];
  carregado: boolean;
  adicionarAoCarrinho: (item: ItemCarrinho) => void;
  alterarQuantidade: (
    id: number,
    cor: string,
    tamanho: string,
    quantidade: number
  ) => void;
  removerDoCarrinho: (
    id: number,
    cor: string,
    tamanho: string
  ) => void;
  limparCarrinho: () => void;
  totalItens: number;
  valorTotal: number;
};

const CHAVE_CARRINHO = "bychicuti_carrinho";

const CarrinhoContexto = createContext<
  CarrinhoContextoType | undefined
>(undefined);

export function CarrinhoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  // Carrega o carrinho salvo no navegador.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_CARRINHO);

      if (salvo) {
        const itens: unknown = JSON.parse(salvo);

        if (Array.isArray(itens)) {
          setCarrinho(itens as ItemCarrinho[]);
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar o carrinho:", erro);
    } finally {
      setCarregado(true);
    }
  }, []);

  // Salva o carrinho sempre que houver alterações.
  useEffect(() => {
    if (!carregado) return;

    try {
      window.localStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(carrinho)
      );
    } catch (erro) {
      console.error("Erro ao salvar o carrinho:", erro);
    }
  }, [carrinho, carregado]);

  // Adiciona um produto ao carrinho.
  function adicionarAoCarrinho(item: ItemCarrinho) {
    console.log("Produto recebido pelo carrinho:", item);

    if (
      !Number.isInteger(item.id) ||
      !Number.isFinite(item.preco) ||
      item.preco < 0 ||
      !Number.isInteger(item.quantidade) ||
      item.quantidade < 1 ||
      !item.cor?.trim() ||
      !item.tamanho?.trim()
    ) {
      console.log(
        "Dados inválidos para adicionar ao carrinho:",
        item
      );
      return;
    }

    setCarrinho((atual) => {
      const existente = atual.find(
        (produto) =>
          produto.id === item.id &&
          produto.cor === item.cor &&
          produto.tamanho === item.tamanho
      );

      if (existente) {
        return atual.map((produto) =>
          produto.id === item.id &&
          produto.cor === item.cor &&
          produto.tamanho === item.tamanho
            ? {
                ...produto,
                quantidade:
                  produto.quantidade + item.quantidade,
              }
            : produto
        );
      }

      return [...atual, item];
    });
  }

  // Altera a quantidade de um produto.
  function alterarQuantidade(
    id: number,
    cor: string,
    tamanho: string,
    quantidade: number
  ) {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      return;
    }

    setCarrinho((atual) =>
      atual.map((produto) =>
        produto.id === id &&
        produto.cor === cor &&
        produto.tamanho === tamanho
          ? { ...produto, quantidade }
          : produto
      )
    );
  }

  // Remove um produto específico.
  function removerDoCarrinho(
    id: number,
    cor: string,
    tamanho: string
  ) {
    setCarrinho((atual) =>
      atual.filter(
        (produto) =>
          !(
            produto.id === id &&
            produto.cor === cor &&
            produto.tamanho === tamanho
          )
      )
    );
  }

  // Limpa todos os produtos.
  function limparCarrinho() {
    setCarrinho([]);
  }

  const totalItens = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const valorTotal = carrinho.reduce(
    (total, item) => total + item.preco * item.quantidade,
    0
  );

  return (
    <CarrinhoContexto.Provider
      value={{
        carrinho,
        carregado,
        adicionarAoCarrinho,
        alterarQuantidade,
        removerDoCarrinho,
        limparCarrinho,
        totalItens,
        valorTotal,
      }}
    >
      {children}
    </CarrinhoContexto.Provider>
  );
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContexto);

  if (!contexto) {
    throw new Error(
      "useCarrinho deve ser usado dentro de CarrinhoProvider"
    );
  }

  return contexto;
}
