"use client";

import { createContext, useContext, useState } from "react";

type ItemCarrinho = {
  id: number;
  nome: string;
  preco: number;
  imagem: string;
  tamanho: string;
  cor: string;
  quantidade: number;
};

type CarrinhoContextoType = {
  carrinho: ItemCarrinho[];
  adicionarAoCarrinho: (item: ItemCarrinho) => void;
};

const CarrinhoContexto = createContext<CarrinhoContextoType | undefined>(
  undefined
);

export function CarrinhoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  function adicionarAoCarrinho(item: ItemCarrinho) {
    setCarrinho((carrinhoAtual) => [...carrinhoAtual, item]);
  }

  return (
    <CarrinhoContexto.Provider
      value={{
        carrinho,
        adicionarAoCarrinho,
      }}
    >
      {children}
    </CarrinhoContexto.Provider>
  );
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContexto);

  if (!contexto) {
    throw new Error("useCarrinho deve ser usado dentro de CarrinhoProvider");
  }

  return contexto;
}