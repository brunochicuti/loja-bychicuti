
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Produto = {
  id: number | string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  preco: number | string;
  imagem: string | null;
  categoria: string;
};

type Variacao = {
  id: number;
  tamanho: string;
  cor: string;
  quantidade: number;
};

type ImagemCor = {
  id: number;
  imagem: string;
  ordem: number;
};

type CorProduto = {
  id: number;
  cor: string;
  imagem: string | null;
  imagens?: ImagemCor[];
};

type Venda = {
  id: number | string;
  variacao_id: number | string;
  produto_id: number | string;
  produto: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  observacao: string | null;
  data: string | null;
};

const categorias = [
  "Calcinhas",
  "Sutiãs",
  "Conjuntos",
  "Cuecas",
  "Pijamas",
  "Outros",
];

const tamanhosPadrao = [  "2",
                          "4",
                          "6",
                          "8",
                          "10",
                          "12",
                          "14",
                          "16",
                          "40",
                          "42",
                          "44",
                          "46",
                          "48",
                          "52",
                          "PP",
                          "P",
                          "M",
                          "G",
                          "GG",
                          "XG",
                          "Único",];

export default function AdminPage() {
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoEditando, setProdutoEditando] = useState<number | string | null>(null);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Calcinhas");
  const [imagem, setImagem] = useState("");

  const [produtoEstoque, setProdutoEstoque] = useState<Produto | null>(null);
  const [codigoBuscaEstoque, setCodigoBuscaEstoque] = useState("");
  const [mensagemBuscaEstoque, setMensagemBuscaEstoque] = useState("");
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [cores, setCores] = useState<CorProduto[]>([]);
  const [tamanhoEstoque, setTamanhoEstoque] = useState("P");
  const [corEstoque, setCorEstoque] = useState("");
  const [quantidadeEstoque, setQuantidadeEstoque] = useState("1");
  const [carregandoEstoque, setCarregandoEstoque] = useState(false);
  const [salvandoEstoque, setSalvandoEstoque] = useState(false);
  const [mensagemEstoque, setMensagemEstoque] = useState("");
  const [imagemAtualDaCor, setImagemAtualDaCor] = useState("");

  const [produtoVenda, setProdutoVenda] = useState("");
  const [variacaoVenda, setVariacaoVenda] = useState("");
  const [quantidadeVenda, setQuantidadeVenda] = useState("1");
  const [variacoesVenda, setVariacoesVenda] = useState<Variacao[]>([]);
  const [carregandoVariacoesVenda, setCarregandoVariacoesVenda] = useState(false);
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [mensagemVenda, setMensagemVenda] = useState("");

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregandoVendas, setCarregandoVendas] = useState(false);
  const [mensagemHistorico, setMensagemHistorico] = useState("");

  const [imagemPrincipalCor, setImagemPrincipalCor] = useState("");
  const [imagensAdicionaisCor, setImagensAdicionaisCor] = useState<string[]>([]);
  const [novaImagemCor, setNovaImagemCor] = useState("");
  const [salvandoFotosCor, setSalvandoFotosCor] = useState(false);

  async function salvarFotosCor() {
  if (!produtoEstoque) {
    setMensagemEstoque("Selecione um produto primeiro.");
    return;
  }

  const corSelecionada = cores.find(
    (item) => item.cor === corEstoque
  );

  if (!corSelecionada) {
    setMensagemEstoque(
      "Selecione uma cor cadastrada no estoque. Se for uma cor nova, registre primeiro uma entrada."
    );
    return;
  }

  // Garante que o ID seja enviado como número inteiro.
  const corId = Number(corSelecionada.id);
  const principal = imagemPrincipalCor.trim();

  if (!Number.isSafeInteger(corId) || corId <= 0) {
    setMensagemEstoque(
      "O ID da cor é inválido. Atualize o estoque e tente novamente."
    );
    return;
  }

  if (!principal) {
    setMensagemEstoque(
      "Informe o caminho da foto principal."
    );
    return;
  }

  if (principal.length > 2000) {
    setMensagemEstoque(
      "O caminho da foto principal ultrapassa o limite permitido."
    );
    return;
  }

  const imagensAdicionais = imagensAdicionaisCor.map(
    (url) => url.trim()
  );

  if (
    imagensAdicionais.length > 20 ||
    imagensAdicionais.some(
      (url) => !url || url.length > 2000
    )
  ) {
    setMensagemEstoque(
      "Confira as fotos adicionais cadastradas."
    );
    return;
  }

  setSalvandoFotosCor(true);
  setMensagemEstoque("");

  try {
    const resposta = await fetch(
      `/api/produtos/${produtoEstoque.id}/estoque`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          corId: corId,
          imagem: principal,
          imagens: imagensAdicionais,
        }),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      if (resposta.status === 401) {
        setAutenticado(false);
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      throw new Error(
        dados.erro || "Não foi possível salvar as fotos."
      );
    }

    if (!dados.cor) {
      throw new Error(
        "A API não retornou os dados atualizados da cor."
      );
    }

    setCores((atuais) =>
      atuais.map((item) =>
        Number(item.id) === corId ? dados.cor : item
      )
    );

    setImagemAtualDaCor(dados.cor.imagem || "");

    setMensagemEstoque(
      "Fotos da cor salvas com sucesso!"
    );
  } catch (erro) {
    setMensagemEstoque(
      erro instanceof Error
        ? erro.message
        : "Erro ao salvar as fotos."
    );
  } finally {
    setSalvandoFotosCor(false);
  }
}

  async function carregarProdutos() {
    const resposta = await fetch("/api/produtos", { cache: "no-store" });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar os produtos.");
    }

    setProdutos(dados.produtos || []);
  }

  async function carregarHistoricoVendas() {
    setCarregandoVendas(true);
    setMensagemHistorico("");

    try {
      const resposta = await fetch("/api/vendas?limite=100", {
        cache: "no-store",
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
        }

        throw new Error(
          dados.erro || "Não foi possível carregar o histórico de vendas."
        );
      }

      setVendas(dados.vendas || []);
    } catch (erro) {
      setMensagemHistorico(
        erro instanceof Error
          ? erro.message
          : "Erro ao carregar o histórico de vendas."
      );
    } finally {
      setCarregandoVendas(false);
    }
  }

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      try {
        const resposta = await fetch("/api/admin/verificar", {
          cache: "no-store",
        });
        const dados = await resposta.json();

        if (!ativo) return;

        if (resposta.ok && dados.autenticado === true) {
          setAutenticado(true);

          const lista = await fetch("/api/produtos", {
            cache: "no-store",
          });
          const resultado = await lista.json();

          if (!lista.ok) {
            throw new Error(
              resultado.erro || "Não foi possível carregar os produtos."
            );
          }

          if (ativo) {
            setProdutos(resultado.produtos || []);
            await carregarHistoricoVendas();
          }
        } else {
          setAutenticado(false);
        }
      } catch (erro) {
        if (ativo) {
          setMensagem(
            erro instanceof Error
              ? erro.message
              : "Não foi possível conectar ao servidor."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
        cache: "no-store",
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagem(dados.erro || "Não foi possível entrar.");
        return;
      }

      const verificacao = await fetch("/api/admin/verificar", {
        cache: "no-store",
      });
      const sessao = await verificacao.json();

      if (!verificacao.ok || sessao.autenticado !== true) {
        setAutenticado(false);
        setMensagem("Não foi possível confirmar a sessão.");
        return;
      }

      setAutenticado(true);
      setSenha("");

      await carregarProdutos();
      await carregarHistoricoVendas();

      setMensagem("Login realizado com sucesso!");
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Erro de conexão."
      );
    } finally {
      setCarregando(false);
    }
  }

  function limparFormulario() {
    setProdutoEditando(null);
    setNome("");
    setDescricao("");
    setPreco("");
    setCategoria("Calcinhas");
    setImagem("");
    setMensagem("");
    setCodigo("");
  }

  function iniciarEdicao(produto: Produto) {
    setProdutoEditando(produto.id);
    setNome(produto.nome);
    setDescricao(produto.descricao || "");
    setPreco(String(produto.preco).replace(".", ","));
    setCategoria(produto.categoria);
    setImagem(produto.imagem || "");
    setMensagem("");
    setCodigo(produto.codigo || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagem("");

    const valor = Number(preco.trim().replace(",", "."));

    if (!Number.isFinite(valor) || valor < 0) {
      setMensagem("Informe um preço válido.");
      return;
    }

    if (!nome.trim() || !categoria.trim()) {
      setMensagem("Preencha o nome e a categoria.");
      return;
    }

    setSalvando(true);

    try {
      const editando = produtoEditando !== null;

      const resposta = await fetch(
        editando
          ? `/api/produtos/${produtoEditando}`
          : "/api/produtos",
        {
          method: editando ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: codigo.trim(),
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            preco: valor,
            categoria: categoria.trim(),
            imagem: imagem.trim() || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
          setMensagem("Sua sessão expirou. Entre novamente.");
          return;
        }

        throw new Error(
          dados.erro || "Não foi possível salvar o produto."
        );
      }

      if (editando) {
        setProdutos((atuais) =>
          atuais
            .map((produto) =>
              String(produto.id) === String(dados.produto.id)
                ? dados.produto
                : produto
            )
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        );
      } else {
        setProdutos((atuais) =>
          [...atuais, dados.produto].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR")
          )
        );
      }

      limparFormulario();

      setMensagem(
        editando
          ? "Produto atualizado com sucesso!"
          : "Produto cadastrado com sucesso!"
      );
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Erro ao salvar o produto."
      );
    } finally {
      setSalvando(false);
    }
  }
function buscarEstoquePorCodigo(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const codigoBusca = codigoBuscaEstoque.trim();

  if (!/^\d{4}$/.test(codigoBusca)) {
    setMensagemBuscaEstoque("Informe um código de produto com 4 dígitos.");
    return;
  }

  const produtoEncontrado = produtos.find(
    (produto) => produto.codigo === codigoBusca
  );

  if (!produtoEncontrado) {
    setMensagemBuscaEstoque(
      "Nenhum produto ativo foi encontrado com esse código."
    );
    return;
  }

  setMensagemBuscaEstoque("");
  setProdutoEstoque(produtoEncontrado);

  void abrirEstoque(produtoEncontrado);

  window.setTimeout(() => {
    document
      .getElementById("gerenciar-estoque")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

  async function abrirEstoque(produto: Produto) {
    setProdutoEstoque(produto);
    setVariacoes([]);
    setCores([]);
    setMensagemEstoque("");
    setCarregandoEstoque(true);
    setCorEstoque("");
    setTamanhoEstoque("P");
    setQuantidadeEstoque("1");

    try {
      const resposta = await fetch(
        `/api/produtos/${produto.id}/estoque`,
        { cache: "no-store" }
      );
      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
          throw new Error("Sua sessão expirou. Entre novamente.");
        }

        throw new Error(dados.erro || "Erro ao carregar o estoque.");
      }

      setVariacoes(dados.variacoes || []);
      setCores(dados.cores || []);

      if (dados.cores?.length) {
        setCorEstoque(dados.cores[0].cor);
      }
    } catch (erro) {
      setMensagemEstoque(
        erro instanceof Error ? erro.message : "Erro ao carregar o estoque."
      );
    } finally {
      setCarregandoEstoque(false);
    }
  }

  async function registrarEstoque(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!produtoEstoque) return;

    const quantidade = Number(quantidadeEstoque);

    if (!corEstoque.trim()) {
      setMensagemEstoque("Informe ou selecione uma cor.");
      return;
    }

    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade < 1 ||
      quantidade > 1000000
    ) {
      setMensagemEstoque("Informe uma quantidade inteira maior que zero.");
      return;
    }

    setSalvandoEstoque(true);
    setMensagemEstoque("");

    try {
      const resposta = await fetch(
        `/api/produtos/${produtoEstoque.id}/estoque`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tamanho: tamanhoEstoque,
            cor: corEstoque.trim(),
            quantidade,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
          throw new Error("Sua sessão expirou. Entre novamente.");
        }

        throw new Error(
          dados.erro || "Não foi possível registrar a entrada."
        );
      }

      setMensagemEstoque("Entrada de estoque registrada com sucesso!");
      setQuantidadeEstoque("1");

      const atualizacao = await fetch(
        `/api/produtos/${produtoEstoque.id}/estoque`,
        { cache: "no-store" }
      );
      const estoqueAtualizado = await atualizacao.json();

      if (!atualizacao.ok) {
        throw new Error(
          estoqueAtualizado.erro ||
            "Entrada salva, mas não foi possível atualizar a lista."
        );
      }

      setVariacoes(estoqueAtualizado.variacoes || []);
      setCores(estoqueAtualizado.cores || []);

      const corAtual = (estoqueAtualizado.cores || []).find(
        (item: CorProduto) => item.cor === corEstoque
      );

      setImagemAtualDaCor(corAtual?.imagem || "");
    } catch (erro) {
      setMensagemEstoque(
        erro instanceof Error ? erro.message : "Erro ao registrar estoque."
      );
    } finally {
      setSalvandoEstoque(false);
    }
  }

  async function carregarVariacoesVenda(produtoId: string) {
    setProdutoVenda(produtoId);
    setVariacaoVenda("");
    setVariacoesVenda([]);
    setMensagemVenda("");

    if (!produtoId) return;

    setCarregandoVariacoesVenda(true);

    try {
      const resposta = await fetch(
        `/api/produtos/${produtoId}/estoque`,
        { cache: "no-store" }
      );
      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
        }

        throw new Error(dados.erro || "Não foi possível carregar o estoque.");
      }

      setVariacoesVenda(dados.variacoes || []);
    } catch (erro) {
      setMensagemVenda(
        erro instanceof Error ? erro.message : "Erro ao carregar as variações."
      );
    } finally {
      setCarregandoVariacoesVenda(false);
    }
  }

  async function registrarVenda(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensagemVenda("");

    const variacaoId = Number(variacaoVenda);
    const quantidade = Number(quantidadeVenda);

    if (
      !produtoVenda ||
      !Number.isSafeInteger(variacaoId) ||
      variacaoId <= 0
    ) {
      setMensagemVenda("Selecione o produto, o tamanho e a cor.");
      return;
    }

    if (
      !Number.isSafeInteger(quantidade) ||
      quantidade <= 0 ||
      quantidade > 1000000
    ) {
      setMensagemVenda("Informe uma quantidade inteira maior que zero.");
      return;
    }

    const variacaoSelecionada = variacoesVenda.find(
      (item) => item.id === variacaoId
    );

    if (!variacaoSelecionada) {
      setMensagemVenda("Selecione uma variação válida.");
      return;
    }

    if (quantidade > variacaoSelecionada.quantidade) {
      setMensagemVenda(
        `Estoque insuficiente. Saldo atual: ${variacaoSelecionada.quantidade}.`
      );
      return;
    }

    const confirmado = window.confirm(
      `Confirma o registro da venda de ${quantidade} unidade(s) de ${variacaoSelecionada.tamanho}, cor ${variacaoSelecionada.cor}? O estoque será descontado.`
    );

    if (!confirmado) return;

    setSalvandoVenda(true);

    try {
      const resposta = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variacaoId, quantidade }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          setAutenticado(false);
        }

        throw new Error(dados.erro || "Não foi possível registrar a venda.");
      }

      setMensagemVenda(
        dados.mensagem ||
          "Venda registrada e estoque atualizado com sucesso."
      );

      setQuantidadeVenda("1");

      await carregarVariacoesVenda(produtoVenda);
      await carregarHistoricoVendas();

      if (
        produtoEstoque &&
        String(produtoEstoque.id) === String(produtoVenda)
      ) {
        await abrirEstoque(produtoEstoque);
      }
    } catch (erro) {
      setMensagemVenda(
        erro instanceof Error ? erro.message : "Erro ao registrar a venda."
      );
    } finally {
      setSalvandoVenda(false);
    }
  }

  useEffect(() => {
  const corSelecionada = cores.find(
    (item) => item.cor === corEstoque
  );

  setImagemAtualDaCor(corSelecionada?.imagem || "");
  setImagemPrincipalCor(corSelecionada?.imagem || "");

  setImagensAdicionaisCor(
    (corSelecionada?.imagens || []).map((imagem) => imagem.imagem)
  );

  setNovaImagemCor("");
  }, [cores, corEstoque]);

  function formatarData(data: string | null) {
    if (!data) return "Data não disponível";

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return "Data não disponível";
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  return (
    <main className="min-h-screen bg-[#FBF6F3] px-6 pt-36 pb-16">
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-sm uppercase tracking-[0.2em] text-[#863D3D]">
            ByChicuti
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#5C2A2A]">
            Painel administrativo
          </h1>
          <p className="mt-3 text-[#5C2A2A]/70">
            Gerencie os produtos, as vendas e o estoque da sua loja.
          </p>
        </header>

        {carregando ? (
          <p className="mt-8" role="status">
            Verificando sua sessão...
          </p>
        ) : autenticado ? (
          <>
            <section className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6">
              <h2 className="text-xl font-medium text-[#5C2A2A]">
                {produtoEditando !== null
                  ? "Editar produto"
                  : "Cadastrar produto"}
              </h2>

              {produtoEditando !== null && (
                <p className="mt-2 text-sm text-[#5C2A2A]/70">
                  Editando: {nome}
                </p>
              )}

              <form
                onSubmit={salvarProduto}
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >

                <label className="text-sm text-[#5C2A2A]">
                  Código do produto *
                  <input
                    type="text"
                    inputMode="numeric"
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                    placeholder="Ex.: 0001"
                  />
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Nome do produto *
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={150}
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                    placeholder="Ex.: Calcinha Básica Lisa"
                  />
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Preço (R$) *
                  <input
                    type="text"
                    inputMode="decimal"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                    placeholder="Ex.: 19,90"
                  />
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Categoria *
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3"
                  >
                    {categorias.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Caminho da imagem
                  <input
                    value={imagem}
                    onChange={(e) => setImagem(e.target.value)}
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                    placeholder="/produtos/calcinha.jpg"
                  />
                </label>

                {imagem.trim() && (
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-sm text-[#5C2A2A]/70">
                      Prévia da imagem
                    </p>
                    <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-[#863D3D]/20 bg-[#FBF6F3]">
                      <Image
                        src={imagem.trim()}
                        alt={nome || "Prévia do produto"}
                        fill
                        unoptimized
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}

                <label className="text-sm text-[#5C2A2A] sm:col-span-2">
                  Descrição
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                    placeholder="Descreva o produto..."
                  />
                </label>

                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded bg-[#863D3D] px-5 py-3 text-white disabled:opacity-60 sm:col-span-2"
                >
                  {salvando
                    ? "Salvando..."
                    : produtoEditando !== null
                      ? "Salvar alterações"
                      : "Cadastrar produto"}
                </button>

                {produtoEditando !== null && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    disabled={salvando}
                    className="rounded border border-[#863D3D]/30 px-5 py-3 text-[#863D3D] disabled:opacity-60 sm:col-span-2"
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            </section>

              <section className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6">
                <h2 className="text-xl font-medium text-[#5C2A2A]">
                  Gerenciar estoque pelo código
                </h2>

                <p className="mt-2 text-sm text-[#5C2A2A]/70">
                  Informe o código de quatro dígitos para localizar o produto e
                  registrar entradas por tamanho e cor.
                </p>

                <form
                  onSubmit={buscarEstoquePorCodigo}
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    value={codigoBuscaEstoque}
                    onChange={(e) => {
                      setCodigoBuscaEstoque(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      );
                      setMensagemBuscaEstoque("");
                    }}
                    placeholder="Ex.: 0001"
                    aria-label="Código do produto"
                    className="min-w-0 flex-1 rounded border border-[#863D3D]/30 px-3 py-3"
                  />

                  <button
                    type="submit"
                    className="rounded bg-[#863D3D] px-5 py-3 text-white hover:bg-[#5C2A2A]"
                  >
                    Buscar produto
                  </button>
                </form>

                {mensagemBuscaEstoque && (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {mensagemBuscaEstoque}
                  </p>
                )}
              </section>

            <section className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6">
              <h2 className="text-xl font-medium text-[#5C2A2A]">
                Produtos cadastrados ({produtos.length})
              </h2>

              {produtos.length === 0 ? (
                <p className="mt-4 text-sm text-[#5C2A2A]/70">
                  Nenhum produto encontrado.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-[#863D3D]/15">
                  {produtos.map((produto) => (
                    <article key={produto.id} className="py-4">
                      <div className="flex flex-wrap items-start gap-4">
                        {produto.imagem ? (
                          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-[#863D3D]/15 bg-[#FBF6F3]">
                            <Image
                              src={produto.imagem}
                              alt={produto.nome}
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg bg-[#FBF6F3] text-center text-xs text-[#5C2A2A]/50">
                            Sem imagem
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[#5C2A2A]">
                            {produto.nome}
                          </h3>

                          <p className="mt-1 text-sm text-[#863D3D]">
                            Código: {produto.codigo || "Não informado"}
                          </p>

                          <p className="mt-1 text-sm text-[#5C2A2A]/70">
                            {produto.categoria}
                          </p>

                          {produto.descricao && (
                            <p className="mt-1 text-sm text-[#5C2A2A]/70">
                              {produto.descricao}
                            </p>
                          )}

                          {produto.imagem && (
                            <p className="mt-1 break-all text-xs text-[#5C2A2A]/50">
                              {produto.imagem}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <p className="font-medium text-[#863D3D]">
                              {Number(produto.preco).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>

                            <button
                              type="button"
                              onClick={() => iniciarEdicao(produto)}
                              className="rounded border border-[#863D3D]/30 px-3 py-2 text-sm text-[#863D3D] hover:bg-[#FBF6F3]"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirEstoque(produto)}
                              className="rounded bg-[#863D3D] px-3 py-2 text-sm text-white hover:bg-[#5C2A2A]"
                            >
                              Gerenciar estoque
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6">
              <h2 className="text-xl font-medium text-[#5C2A2A]">
                Registrar venda
              </h2>

              <p className="mt-2 text-sm text-[#5C2A2A]/70">
                Registre somente vendas já confirmadas. O estoque será
                descontado após a confirmação.
              </p>

              <form onSubmit={registrarVenda} className="mt-5 grid gap-4">
                <label className="text-sm text-[#5C2A2A]">
                  Produto
                  <select
                    value={produtoVenda}
                    onChange={(e) => carregarVariacoesVenda(e.target.value)}
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3"
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={String(produto.id)}>
                        {produto.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Tamanho e cor
                  <select
                    value={variacaoVenda}
                    onChange={(e) => setVariacaoVenda(e.target.value)}
                    required
                    disabled={!produtoVenda || carregandoVariacoesVenda}
                    className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3 disabled:opacity-60"
                  >
                    <option value="">
                      {carregandoVariacoesVenda
                        ? "Carregando estoque..."
                        : "Selecione tamanho e cor"}
                    </option>
                    {variacoesVenda.map((variacao) => (
                      <option key={variacao.id} value={String(variacao.id)}>
                        {variacao.tamanho} — {variacao.cor} — estoque:{" "}
                        {variacao.quantidade}
                      </option>
                    ))}
                  </select>

                  {produtoVenda &&
                    !carregandoVariacoesVenda &&
                    variacoesVenda.length === 0 && (
                      <span className="mt-2 block text-xs text-[#5C2A2A]/70">
                        Esse produto ainda não tem variações cadastradas no
                        estoque.
                      </span>
                    )}
                </label>

                <label className="text-sm text-[#5C2A2A]">
                  Quantidade vendida
                  <input
                    type="number"
                    min={1}
                    max={1000000}
                    step={1}
                    value={quantidadeVenda}
                    onChange={(e) => setQuantidadeVenda(e.target.value)}
                    required
                    className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                  />
                </label>

                <button
                  type="submit"
                  disabled={
                    salvandoVenda ||
                    carregandoVariacoesVenda ||
                    !produtoVenda ||
                    !variacaoVenda
                  }
                  className="rounded bg-[#863D3D] px-5 py-3 text-white disabled:opacity-60"
                >
                  {salvandoVenda
                    ? "Registrando venda..."
                    : "Confirmar e registrar venda"}
                </button>
              </form>

              {mensagemVenda && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-4 text-sm text-[#5C2A2A]"
                >
                  {mensagemVenda}
                </p>
              )}
            </section>

            <section
              id="historico-vendas"
              className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium text-[#5C2A2A]">
                    Histórico de vendas
                  </h2>
                  <p className="mt-2 text-sm text-[#5C2A2A]/70">
                    Consulte as últimas 100 vendas registradas no painel.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={carregarHistoricoVendas}
                  disabled={carregandoVendas}
                  className="rounded bg-[#863D3D] px-4 py-3 text-sm text-white disabled:opacity-60"
                >
                  {carregandoVendas ? "Atualizando..." : "Atualizar histórico"}
                </button>
              </div>

              {mensagemHistorico && (
                <p
                  role="alert"
                  className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800"
                >
                  {mensagemHistorico}
                </p>
              )}

              {carregandoVendas && vendas.length === 0 ? (
                <p className="mt-5 text-sm text-[#5C2A2A]/70">
                  Carregando histórico de vendas...
                </p>
              ) : vendas.length === 0 ? (
                <p className="mt-5 text-sm text-[#5C2A2A]/70">
                  Nenhuma venda encontrada.
                </p>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#863D3D]/20 text-[#5C2A2A]/70">
                        <th className="px-3 py-3 font-medium">Data</th>
                        <th className="px-3 py-3 font-medium">Produto</th>
                        <th className="px-3 py-3 font-medium">Tamanho</th>
                        <th className="px-3 py-3 font-medium">Cor</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Quantidade
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {vendas.map((venda) => (
                        <tr
                          key={venda.id}
                          className="border-b border-[#863D3D]/10"
                        >
                          <td className="whitespace-nowrap px-3 py-3">
                            {formatarData(venda.data)}
                          </td>
                          <td className="px-3 py-3">{venda.produto}</td>
                          <td className="px-3 py-3">{venda.tamanho}</td>
                          <td className="px-3 py-3">{venda.cor}</td>
                          <td className="px-3 py-3 text-right font-medium">
                            {venda.quantidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {produtoEstoque && (
              <section
                className="mt-8 rounded border border-[#863D3D]/20 bg-white p-6"
                id="gerenciar-estoque"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-[#863D3D]">
                      Controle de estoque
                    </p>
                    <h2 className="mt-1 text-xl font-medium text-[#5C2A2A]">
                      {produtoEstoque.nome}
                    </h2>
                    <p className="mt-1 text-sm text-[#5C2A2A]/70">
                      Registre entradas por tamanho e cor.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProdutoEstoque(null)}
                    className="rounded border border-[#863D3D]/30 px-3 py-2 text-sm text-[#863D3D]"
                  >
                    Fechar
                  </button>
                </div>

                {carregandoEstoque ? (
                  <p className="mt-5 text-sm text-[#5C2A2A]/70">
                    Carregando estoque...
                  </p>
                ) : (
                  <>
                    <form
                      onSubmit={registrarEstoque}
                      className="mt-5 grid gap-4 sm:grid-cols-2"
                    >
                      <label className="text-sm text-[#5C2A2A]">
                        Tamanho
                        <select
                          value={tamanhoEstoque}
                          onChange={(e) => setTamanhoEstoque(e.target.value)}
                          className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3"
                        >
                          {Array.from(
                            new Set([
                              ...tamanhosPadrao,
                              ...variacoes.map((v) => v.tamanho),
                            ])
                          ).map((tamanho) => (
                            <option key={tamanho} value={tamanho}>
                              {tamanho}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm text-[#5C2A2A]">
                        Cor
                        <input
                          list="cores-produto"
                          value={corEstoque}
                          onChange={(e) => setCorEstoque(e.target.value)}
                          maxLength={50}
                          required
                          className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                          placeholder="Ex.: Azul"
                        />
                        <datalist id="cores-produto">
                          {cores.map((cor) => (
                            <option key={cor.id} value={cor.cor} />
                          ))}
                        </datalist>
                      </label>

                      {imagemAtualDaCor && (
                        <div className="sm:col-span-2">
                          <p className="mb-2 text-sm text-[#5C2A2A]/70">
                            Imagem da cor selecionada
                          </p>
                          <div className="relative h-28 w-24 overflow-hidden rounded border border-[#863D3D]/20 bg-[#FBF6F3]">
                            <Image
                              src={imagemAtualDaCor}
                              alt={`${produtoEstoque.nome} - ${corEstoque}`}
                              fill
                              unoptimized
                              sizes="96px"
                              className="object-contain"
                            />
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-2 mt-4 rounded-xl border border-[#863D3D]/20 bg-[#FBF6F3] p-4">
                        <h3 className="mb-4 text-lg font-semibold text-[#5C2A2A]">
                          Fotos da cor: {corEstoque || "Selecione uma cor"}
                        </h3>

                        <label className="mb-4 block text-sm text-[#5C2A2A]">
                          Foto principal
                          <input
                            type="text"
                            value={imagemPrincipalCor}
                            onChange={(e) => setImagemPrincipalCor(e.target.value)}
                            placeholder="/produtos/calcinha-preta.jpeg"
                            className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3"
                          />
                        </label>

                        <label className="mb-2 block text-sm text-[#5C2A2A]">
                          Nova foto adicional
                          <input
                            type="text"
                            value={novaImagemCor}
                            onChange={(e) => setNovaImagemCor(e.target.value)}
                            placeholder="/produtos/calcinha-preta-lado.jpeg"
                            className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-3 py-3"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const caminho = novaImagemCor.trim();

                            if (!caminho) {
                              setMensagemEstoque("Informe o caminho da foto.");
                              return;
                            }

                            if (imagensAdicionaisCor.length >= 20) {
                              setMensagemEstoque("Limite de 20 fotos adicionais.");
                              return;
                            }

                            setImagensAdicionaisCor((atuais) => [...atuais, caminho]);
                            setNovaImagemCor("");
                            setMensagemEstoque("");
                          }}
                          className="mb-4 rounded border border-[#863D3D]/30 px-4 py-2 text-sm text-[#863D3D]"
                        >
                          Adicionar foto
                        </button>

                        {imagensAdicionaisCor.map((imagem, indice) => (
                          <div key={indice} className="mb-3 flex gap-2">
                            <input
                              type="text"
                              value={imagem}
                              onChange={(e) => {
                                setImagensAdicionaisCor((atuais) =>
                                  atuais.map((item, i) =>
                                    i === indice ? e.target.value : item
                                  )
                                );
                              }}
                              className="min-w-0 flex-1 rounded border border-[#863D3D]/30 bg-white px-3 py-2"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setImagensAdicionaisCor((atuais) =>
                                  atuais.filter((_, i) => i !== indice)
                                )
                              }
                              className="rounded border border-red-300 px-3 py-2 text-sm text-red-700"
                            >
                              Remover
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={salvarFotosCor}
                          disabled={salvandoFotosCor || !corEstoque}
                          className="mt-3 rounded bg-[#863D3D] px-4 py-3 font-semibold text-white disabled:opacity-50"
                        >
                          {salvandoFotosCor ? "Salvando..." : "Salvar fotos da cor"}
                        </button>
                      </div>

                      <label className="text-sm text-[#5C2A2A]">
                        Quantidade a adicionar
                        <input
                          type="number"
                          min={1}
                          max={1000000}
                          step={1}
                          value={quantidadeEstoque}
                          onChange={(e) =>
                            setQuantidadeEstoque(e.target.value)
                          }
                          required
                          className="mt-2 w-full rounded border border-[#863D3D]/30 px-3 py-3"
                        />
                      </label>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={salvandoEstoque}
                          className="w-full rounded bg-[#863D3D] px-4 py-3 text-white disabled:opacity-60"
                        >
                          {salvandoEstoque
                            ? "Registrando..."
                            : "Registrar entrada"}
                        </button>
                      </div>
                    </form>

                    {mensagemEstoque && (
                      <p
                        role="status"
                        aria-live="polite"
                        className="mt-4 text-sm text-[#5C2A2A]"
                      >
                        {mensagemEstoque}
                      </p>
                    )}

                    <div className="mt-8">
                      <h3 className="font-medium text-[#5C2A2A]">
                        Saldo por tamanho e cor
                      </h3>

                      {variacoes.length === 0 ? (
                        <p className="mt-3 text-sm text-[#5C2A2A]/70">
                          Ainda não há variações de estoque para este produto.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                            <thead>
                              <tr className="border-b border-[#863D3D]/20 text-[#5C2A2A]/70">
                                <th className="px-3 py-3 font-medium">
                                  Tamanho
                                </th>
                                <th className="px-3 py-3 font-medium">Cor</th>
                                <th className="px-3 py-3 text-right font-medium">
                                  Quantidade
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {variacoes.map((variacao) => (
                                <tr
                                  key={variacao.id}
                                  className="border-b border-[#863D3D]/10"
                                >
                                  <td className="px-3 py-3">
                                    {variacao.tamanho}
                                  </td>
                                  <td className="px-3 py-3">
                                    {variacao.cor}
                                  </td>
                                  <td className="px-3 py-3 text-right font-medium">
                                    {variacao.quantidade}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        ) : (
          <form
            className="mt-8 max-w-md space-y-4 rounded border border-[#863D3D]/20 bg-white p-6"
            onSubmit={entrar}
          >
            <h2 className="text-xl font-medium text-[#5C2A2A]">Entrar</h2>

            <label className="block text-sm text-[#5C2A2A]">
              Senha de administrador
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-2 w-full rounded border border-[#863D3D]/30 bg-white px-4 py-3"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded bg-[#863D3D] px-4 py-3 text-white disabled:opacity-60"
            >
              {carregando ? "Verificando..." : "Entrar"}
            </button>
          </form>
        )}

        {mensagem && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 text-sm text-[#5C2A2A]"
          >
            {mensagem}
          </p>
        )}
      </div>
    </main>
  );
}
