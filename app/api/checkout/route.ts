
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const SITE_URL =
  process.env.SITE_URL || "https://bychicuti.vercel.app";

const INFINITEPAY_HANDLE =
  process.env.INFINITEPAY_HANDLE || "bychicuti";

type ItemRecebido = {
  variacaoId: number;
  quantidade: number;
};

type ProdutoBanco = {
  variacao_id: number;
  produto_id: number;
  nome: string;
  tamanho: string;
  cor: string;
  estoque: number;
  preco: string | number;
};

export async function POST(request: Request) {
  let cliente: {
    nome: string;
    telefone: string;
  };

  let itens: ItemRecebido[];

  try {
    const corpo = await request.json();

    cliente = {
      nome:
        typeof corpo?.cliente?.nome === "string"
          ? corpo.cliente.nome.trim()
          : "",
      telefone:
        typeof corpo?.cliente?.telefone === "string"
          ? corpo.cliente.telefone.trim()
          : "",
    };

    if (
      !cliente.nome ||
      cliente.nome.length < 3 ||
      cliente.nome.length > 150 ||
      cliente.telefone.length < 10 ||
      cliente.telefone.length > 30
    ) {
      return NextResponse.json(
        { erro: "Confira seu nome e telefone." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(corpo?.itens) ||
      corpo.itens.length === 0 ||
      corpo.itens.length > 50
    ) {
      return NextResponse.json(
        { erro: "O carrinho está vazio ou possui itens demais." },
        { status: 400 }
      );
    }

    const quantidades = new Map<number, number>();

    for (const item of corpo.itens) {
      const variacaoId = Number(item?.variacaoId);
      const quantidade = Number(item?.quantidade);

      if (
        !Number.isSafeInteger(variacaoId) ||
        variacaoId <= 0 ||
        !Number.isSafeInteger(quantidade) ||
        quantidade <= 0 ||
        quantidade > 100
      ) {
        return NextResponse.json(
          { erro: "Há um produto com dados inválidos." },
          { status: 400 }
        );
      }

      const total =
        (quantidades.get(variacaoId) || 0) + quantidade;

      if (total > 100) {
        return NextResponse.json(
          { erro: "A quantidade solicitada é inválida." },
          { status: 400 }
        );
      }

      quantidades.set(variacaoId, total);
    }

    itens = Array.from(quantidades, ([variacaoId, quantidade]) => ({
      variacaoId,
      quantidade,
    }));
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível ler os dados do pedido." },
      { status: 400 }
    );
  }

  const conexao = await db.connect();

  let orderNsu = "";
  let codigoPedido = "";
  let pedidoCriado = false;

  try {
    await conexao.query("BEGIN");

    const ids = itens.map((item) => item.variacaoId);

    const resultado = await conexao.query<ProdutoBanco>(
      `
        SELECT
          v.id AS variacao_id,
          v.produto_id,
          v.tamanho,
          v.cor,
          v.quantidade AS estoque,
          p.nome,
          p.preco
        FROM variacoes_estoque v
        INNER JOIN produtos p ON p.id = v.produto_id
        WHERE v.id = ANY($1::bigint[])
          AND v.ativo = TRUE
          AND p.ativo = TRUE
        FOR UPDATE OF v
      `,
      [ids]
    );

    const produtos = resultado.rows;

        if (produtos.length !== itens.length) {
        await conexao.query("ROLLBACK");
        conexao.release();

        return NextResponse.json(
            {
            erro:
                "Um ou mais produtos não estão disponíveis. Atualize seu carrinho.",
            },
            { status: 400 }
        );
    }

    const produtosPorId = new Map(
      produtos.map((produto) => [
        Number(produto.variacao_id),
        produto,
      ])
    );

    let totalCentavos = 0;

    const itensCalculados = itens.map((item) => {
      const produto = produtosPorId.get(item.variacaoId);

      if (!produto) {
        throw new Error("Produto não encontrado.");
      }

      if (item.quantidade > Number(produto.estoque)) {
        throw new Error(
          `Estoque insuficiente para ${produto.nome}, tamanho ${produto.tamanho}.`
        );
      }

      const precoCentavos = Math.round(
        Number(produto.preco) * 100
      );

      if (
        !Number.isSafeInteger(precoCentavos) ||
        precoCentavos <= 0
      ) {
        throw new Error("Preço inválido no cadastro do produto.");
      }

      const subtotalCentavos =
        precoCentavos * item.quantidade;

      totalCentavos += subtotalCentavos;

      return {
        ...item,
        produto,
        precoCentavos,
        subtotalCentavos,
      };
    });

    if (
      !Number.isSafeInteger(totalCentavos) ||
      totalCentavos <= 0 ||
      totalCentavos > 100_000_000
    ) {
      throw new Error("O valor total do pedido é inválido.");
    }

    orderNsu = randomUUID();
    codigoPedido = `BC-${randomUUID().slice(0, 8).toUpperCase()}`;

    await conexao.query(
      `
        INSERT INTO pedidos (
          codigo,
          cliente_nome,
          cliente_telefone,
          valor_total,
          status,
          provedor_pagamento,
          order_nsu
        )
        VALUES ($1, $2, $3, $4, 'PENDENTE', 'INFINITEPAY', $5)
      `,
      [
        codigoPedido,
        cliente.nome,
        cliente.telefone,
        totalCentavos / 100,
        orderNsu,
      ]
    );

    for (const item of itensCalculados) {
      await conexao.query(
        `
          INSERT INTO itens_pedido (
            pedido_id,
            variacao_id,
            nome_produto,
            tamanho,
            cor,
            preco_unitario,
            quantidade,
            subtotal
          )
          SELECT
            p.id,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          FROM pedidos p
          WHERE p.order_nsu = $1
        `,
        [
          orderNsu,
          item.variacaoId,
          item.produto.nome,
          item.produto.tamanho,
          item.produto.cor,
          item.precoCentavos / 100,
          item.quantidade,
          item.subtotalCentavos / 100,
        ]
      );
    }

    await conexao.query("COMMIT");
    pedidoCriado = true;
  } catch (erro) {
    await conexao.query("ROLLBACK").catch(() => undefined);

    console.error("Erro ao registrar pedido:", erro);

    const mensagem =
      erro instanceof Error ? erro.message : "";

    const erroDeEstoque =
      mensagem.startsWith("Estoque insuficiente");

    conexao.release();

    return NextResponse.json(
      {
        erro: erroDeEstoque
          ? mensagem
          : "Não foi possível registrar o pedido. Tente novamente.",
      },
      { status: erroDeEstoque ? 400 : 500 }
    );
  } finally {
    if (!pedidoCriado) {
      // A conexão já foi liberada no tratamento de erro.
    }
  }

  conexao.release();

  try {
    const telefoneNumerico = cliente.telefone.replace(/\D/g, "");
    const telefoneInternacional = telefoneNumerico.startsWith("55")
      ? `+${telefoneNumerico}`
      : `+55${telefoneNumerico}`;

    const resposta = await fetch(
      "https://api.checkout.infinitepay.io/links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        handle: INFINITEPAY_HANDLE,
        order_nsu: orderNsu,
        redirect_url: `${SITE_URL}/pedido-confirmado`,
        webhook_url: `${SITE_URL}/api/webhooks/infinitepay`,
        items: await buscarItensDoPedido(orderNsu),
        customer: {
            name: cliente.nome,
            phone_number: telefoneInternacional,
        },
        }),
        cache: "no-store",
      }
    );

const textoResposta = await resposta.text();

let dados: {
  url?: string;
  message?: string;
  error?: string;
};

try {
  dados = JSON.parse(textoResposta);
} catch {
  console.error("A InfinitePay retornou uma resposta inválida.");
  throw new Error(
    "Não foi possível interpretar a resposta da InfinitePay."
  );
}

console.log("Status da resposta InfinitePay:", resposta.status);
console.log("Link recebido:", Boolean(dados?.url));

const checkoutUrl =
  typeof dados?.url === "string" ? dados.url : "";

    let urlValida = false;

    try {
      const url = new URL(checkoutUrl);

      urlValida =
        url.protocol === "https:" &&
        [
          "checkout.infinitepay.com.br",
          "checkout.infinitepay.io",
        ].includes(url.hostname);
    } catch {
      urlValida = false;
    }

    if (!resposta.ok || !urlValida) {
    throw new Error(
    `A InfinitePay não retornou um link válido (status ${resposta.status}, mensagem: ${String(dados?.message ?? dados?.error ?? "sem mensagem").slice(0, 200)}).`
      );
    }

     const resultadoAtualizacao = await db.query(
      `
        UPDATE pedidos
        SET link_pagamento = $1,
            atualizado_em = NOW()
        WHERE order_nsu = $2
          AND status = 'PENDENTE'
          AND requer_analise_manual = FALSE
      `,
      [checkoutUrl, orderNsu]
    );

    if (resultadoAtualizacao.rowCount !== 1) {
      throw new Error(
        "O pedido não está disponível para receber um link de pagamento."
      );
    }

    return NextResponse.json({
      codigo: codigoPedido,
      checkoutUrl,
    });

   } catch (erro) {
    console.error("Erro ao gerar checkout:", erro);

     await db.query(
      `
        UPDATE pedidos
        SET requer_analise_manual = TRUE,
            observacao_interna = $1,
            atualizado_em = NOW()
        WHERE order_nsu = $2
          AND status = 'PENDENTE'
          AND requer_analise_manual = FALSE
      `,
      [
        `Falha ao criar o checkout na InfinitePay: ${erro instanceof Error ? erro.message : "erro desconhecido"}. Verificar se o link foi criado antes de tentar novamente.`,
        orderNsu,
      ]
    ).catch((erroAtualizacao) => {
      console.error(
        "Não foi possível encaminhar o pedido para análise manual:",
        erroAtualizacao
      );
    });

    return NextResponse.json(
      {
        erro:
          "Não foi possível confirmar a criação do pagamento. O pedido será verificado antes de uma nova tentativa.",
      },
      { status: 502 }
    );
  }
}

async function buscarItensDoPedido(orderNsu: string) {
  const resultado = await db.query(
    `
      SELECT
        ip.quantidade,
        ROUND(ip.preco_unitario * 100)::INTEGER AS preco_centavos,
        ip.nome_produto,
        ip.tamanho,
        ip.cor
      FROM itens_pedido ip
      INNER JOIN pedidos p ON p.id = ip.pedido_id
      WHERE p.order_nsu = $1
      ORDER BY ip.id
    `,
    [orderNsu]
  );

  if (resultado.rows.length === 0) {
    throw new Error("O pedido não possui itens.");
  }

  return resultado.rows.map((item) => ({
    quantity: Number(item.quantidade),
    price: Number(item.preco_centavos),
    description: `${item.nome_produto} - ${item.tamanho} - ${item.cor}`,
  }));
}
