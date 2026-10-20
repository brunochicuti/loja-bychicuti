
import {
  createHash,
  randomBytes,
  randomUUID,
} from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calcularFrete, type EnderecoEntrega } from "@/lib/frete";
import { Resend } from "resend";

export const runtime = "nodejs";

const SITE_URL =
  process.env.SITE_URL || "https://bychicuti.vercel.app";

const INFINITEPAY_HANDLE =
  process.env.INFINITEPAY_HANDLE || "bychicuti";


  const resend = new Resend(process.env.RESEND_API_KEY);

  const EMAIL_REMETENTE =
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type ItemRecebido = {
  variacaoId: number;
  quantidade: number;
};

type ModalidadeEntrega = "ENTREGA" | "RETIRADA";

type ClienteCheckout = EnderecoEntrega & {
  nome: string;
  telefone: string;
  email: string;
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

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

export async function POST(request: Request) {
  let cliente: ClienteCheckout;
  let itens: ItemRecebido[];
  let modalidadeEntrega: ModalidadeEntrega;

  try {
    const corpo = await request.json();
    const dadosCliente = corpo?.cliente;

    modalidadeEntrega = corpo?.modalidadeEntrega;

    if (
      modalidadeEntrega !== "ENTREGA" &&
      modalidadeEntrega !== "RETIRADA"
    ) {
      return NextResponse.json(
        { erro: "Selecione uma modalidade de recebimento válida." },
        { status: 400 }
      );
    }

cliente = {
  nome: texto(dadosCliente?.nome),
  telefone: texto(dadosCliente?.telefone),
  email: texto(dadosCliente?.email).toLowerCase(),
  cep: texto(dadosCliente?.cep).replace(/\D/g, ""),
  endereco: texto(dadosCliente?.endereco),
  numero: texto(dadosCliente?.numero),
  complemento: texto(dadosCliente?.complemento),
  bairro: texto(dadosCliente?.bairro),
  cidade: texto(dadosCliente?.cidade),
  uf: texto(dadosCliente?.uf).toUpperCase(),
};

      if (
        cliente.nome.length < 3 ||
        cliente.nome.length > 150 ||
        cliente.telefone.length < 10 ||
        cliente.telefone.length > 30 ||
        cliente.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)
      ) {
      return NextResponse.json(
        { erro: "Confira seu nome e telefone." },
        { status: 400 }
      );
    }

    // O endereço é obrigatório somente para entrega em casa.
    if (modalidadeEntrega === "ENTREGA") {
      if (
        !/^\d{8}$/.test(cliente.cep) ||
        !cliente.endereco ||
        cliente.endereco.length > 200 ||
        !cliente.numero ||
        cliente.numero.length > 20 ||
        (cliente.complemento?.length ?? 0) > 100 ||
        !cliente.bairro ||
        cliente.bairro.length > 100 ||
        !cliente.cidade ||
        cliente.cidade.length > 100 ||
        !/^[A-Z]{2}$/.test(cliente.uf)
      ) {
        return NextResponse.json(
          {
            erro:
              "Confira o CEP e todos os dados do endereço de entrega.",
          },
          { status: 400 }
        );
      }
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

  // Na retirada, o frete é zero e não precisamos calcular uma rota.
  let freteCentavos = 0;
  let distanciaKm: number | null = null;

  if (modalidadeEntrega === "ENTREGA") {
    try {
      const resultadoFrete = await calcularFrete(cliente);

      if (resultadoFrete.modalidade === "CORREIOS") {
        return NextResponse.json(
          {
            erro:
              "Esse endereço fica a mais de 100 km da loja. A cotação automática dos Correios ainda não está disponível. Nenhum pedido foi criado.",
          },
          { status: 400 }
        );
      }

      freteCentavos = resultadoFrete.freteCentavos ?? -1;
      distanciaKm = resultadoFrete.distanciaKm;

      if (
        !Number.isSafeInteger(freteCentavos) ||
        freteCentavos < 0
      ) {
        return NextResponse.json(
          { erro: "Não foi possível determinar o valor do frete." },
          { status: 400 }
        );
      }
    } catch (erro) {
      console.error("Erro ao calcular frete:", erro);

      return NextResponse.json(
        {
          erro:
            "Não foi possível calcular a entrega para esse endereço. Confira os dados e tente novamente.",
        },
        { status: 400 }
      );
    }
  }

  const orderNsu = randomUUID();
  const codigoPedido = `BC-${randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;

    const tokenAcompanhamento = randomBytes(32).toString("hex");

    const tokenAcompanhamentoHash = createHash("sha256")
      .update(tokenAcompanhamento)
      .digest("hex");

  let totalPedidoCentavos = 0;
  let subtotalProdutosCentavos = 0;

  const conexao = await db.connect();

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

      subtotalProdutosCentavos += subtotalCentavos;

      return {
        ...item,
        produto,
        precoCentavos,
        subtotalCentavos,
      };
    });

    totalPedidoCentavos =
      subtotalProdutosCentavos + freteCentavos;

    if (
      !Number.isSafeInteger(subtotalProdutosCentavos) ||
      subtotalProdutosCentavos <= 0 ||
      !Number.isSafeInteger(totalPedidoCentavos) ||
      totalPedidoCentavos > 100_000_000
    ) {
      throw new Error("O valor total do pedido é inválido.");
    }

        await conexao.query(
      `
        INSERT INTO pedidos (
          codigo,
          cliente_nome,
          cliente_telefone,
          cliente_email,
          valor_total,
          status,
          provedor_pagamento,
          order_nsu,
          cliente_cep,
          cliente_endereco,
          cliente_numero,
          cliente_complemento,
          cliente_bairro,
          cliente_cidade,
          cliente_uf,
          frete_valor,
          modalidade_entrega,
          token_acompanhamento_hash
        )
        VALUES (
          $1, $2, $3, $4, $5,
          'PENDENTE',
          'INFINITEPAY',
          $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16
        )
      `,
      [
        codigoPedido,
        cliente.nome,
        cliente.telefone,
        cliente.email,
        totalPedidoCentavos / 100,
        orderNsu,
        modalidadeEntrega === "ENTREGA" ? cliente.cep : null,
        modalidadeEntrega === "ENTREGA" ? cliente.endereco : null,
        modalidadeEntrega === "ENTREGA" ? cliente.numero : null,
        modalidadeEntrega === "ENTREGA"
          ? cliente.complemento || null
          : null,
        modalidadeEntrega === "ENTREGA" ? cliente.bairro : null,
        modalidadeEntrega === "ENTREGA" ? cliente.cidade : null,
        modalidadeEntrega === "ENTREGA" ? cliente.uf : null,
        freteCentavos / 100,
        modalidadeEntrega,
        tokenAcompanhamentoHash,
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
  } catch (erro) {
    await conexao.query("ROLLBACK").catch(() => undefined);

    console.error("Erro ao registrar pedido:", erro);

    const mensagem =
      erro instanceof Error ? erro.message : "";

    const erroDeEstoque =
      mensagem.startsWith("Estoque insuficiente");

    return NextResponse.json(
      {
        erro: erroDeEstoque
          ? mensagem
          : "Não foi possível registrar o pedido. Tente novamente.",
      },
      { status: erroDeEstoque ? 400 : 500 }
    );
  } finally {
    conexao.release();
  }

  try {
    const telefoneNumerico = cliente.telefone.replace(/\D/g, "");

    const jaTemPais =
      telefoneNumerico.startsWith("55") &&
      telefoneNumerico.length >= 12;

    const telefoneInternacional = jaTemPais
      ? `+${telefoneNumerico}`
      : `+55${telefoneNumerico}`;

    const itensPagamento = await buscarItensDoPedido(
      orderNsu,
      freteCentavos,
      cliente.cidade,
      modalidadeEntrega
    );

    const corpoPagamento: Record<string, unknown> = {
      handle: INFINITEPAY_HANDLE,
      order_nsu: orderNsu,
      redirect_url: `${SITE_URL}/pedido-confirmado?token=${encodeURIComponent(
      tokenAcompanhamento
      )}`,
      webhook_url: `${SITE_URL}/api/webhooks/infinitepay`,
      items: itensPagamento,
      customer: {
        name: cliente.nome,
        phone_number: telefoneInternacional,
      },
    };

    // A retirada não exige nem envia um endereço de entrega.
    if (modalidadeEntrega === "ENTREGA") {
      corpoPagamento.address = {
        cep: cliente.cep,
        street: cliente.endereco,
        number: cliente.numero,
        ...(cliente.complemento
          ? { complement: cliente.complemento }
          : {}),
        neighborhood: cliente.bairro,
      };
    }

    const resposta = await fetch(
      "https://api.checkout.infinitepay.io/links",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corpoPagamento),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
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
      throw new Error(
        "Não foi possível interpretar a resposta da InfinitePay."
      );
    }

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
        `A InfinitePay não retornou um link válido (status ${resposta.status}, mensagem: ${String(
          dados?.message ?? dados?.error ?? "sem mensagem"
        ).slice(0, 200)}).`
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

    const acompanhamentoUrl =
      `${SITE_URL}/acompanhar-pedido?token=${encodeURIComponent(
        tokenAcompanhamento
      )}`;

    await enviarEmailPedido({
      email: cliente.email,
      nome: cliente.nome,
      codigo: codigoPedido,
      acompanhamentoUrl,
      total: totalPedidoCentavos / 100,
    });

    return NextResponse.json({
      codigo: codigoPedido,
      acompanhamentoUrl: `${SITE_URL}/acompanhar-pedido?token=${tokenAcompanhamento}`,
      checkoutUrl,
      modalidadeEntrega,
      subtotalProdutos: subtotalProdutosCentavos / 100,
      frete: freteCentavos / 100,
      total: totalPedidoCentavos / 100,
      distanciaKm,
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
        `Falha ao criar o checkout na InfinitePay: ${
          erro instanceof Error
            ? erro.message
            : "erro desconhecido"
        }. Verificar se o link foi criado antes de tentar novamente.`,
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

    async function enviarEmailPedido({
      email,
      nome,
      codigo,
      acompanhamentoUrl,
      total,
    }: {
      email: string;
      nome: string;
      codigo: string;
      acompanhamentoUrl: string;
      total: number;
    }) {
      if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY não configurada.");
        return;
      }

      try {
        const { error } = await resend.emails.send({
          from: EMAIL_REMETENTE,
          to: email,
          subject: `Pedido ${codigo} recebido - ByChicuti`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #5C2A2A;">
              <h1>ByChicuti</h1>
              <h2>Olá, ${nome.replace(/[&<>"']/g, (caractere) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[caractere]!) }!</h2>
              <p>Recebemos seu pedido e o link para pagamento Pix foi gerado.</p>
              <p><strong>Código do pedido:</strong> ${codigo}</p>
              <p><strong>Total:</strong> ${total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}</p>
              <p>Você pode acompanhar o status do seu pedido pelo link abaixo:</p>
              <p>
                <a href="${acompanhamentoUrl}" style="display: inline-block; background: #863D3D; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">
                  Acompanhar meu pedido
                </a>
              </p>
              <p>Este pedido ainda está aguardando a confirmação do pagamento.</p>
              <p>Obrigado por comprar na ByChicuti!</p>
            </div>
          `,
        });

        if (error) {
          console.error("Falha no envio do e-mail do pedido:", error);
        }
      } catch (erro) {
        console.error("Erro inesperado ao enviar e-mail do pedido:", erro);
      }
    }

async function buscarItensDoPedido(
  orderNsu: string,
  freteCentavos: number,
  cidade: string,
  modalidadeEntrega: ModalidadeEntrega
) {
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

  const itens: {
    quantity: number;
    price: number;
    description: string;
  }[] = resultado.rows.map((item) => ({
    quantity: Number(item.quantidade),
    price: Number(item.preco_centavos),
    description: `${item.nome_produto} - ${item.tamanho} - ${item.cor}`,
  }));

  // Só adiciona a cobrança de frete para pedidos de entrega.
  if (modalidadeEntrega === "ENTREGA" && freteCentavos > 0) {
    itens.push({
      quantity: 1,
      price: freteCentavos,
      description: `Frete para ${cidade}`.slice(0, 200),
    });
  }

  return itens;
}
