
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const INFINITEPAY_HANDLE =
  process.env.INFINITEPAY_HANDLE || "ByChicuti";

type WebhookPayload = {
  order_nsu?: string;
  transaction_nsu?: string;
  invoice_slug?: string;
};

type Pedido = {
  id: number;
  valor_total: string | number;
  status: string;
  transaction_nsu: string | null;
};

type ItemPedido = {
  variacao_id: number;
  quantidade: number;
  nome_produto: string;
  tamanho: string;
  cor: string;
};

export async function POST(request: Request) {
  let payload: WebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Corpo da notificação inválido." },
      { status: 400 }
    );
  }

  const orderNsu = payload.order_nsu;
  const transactionNsu = payload.transaction_nsu;
  const slug = payload.invoice_slug;

  if (
    typeof orderNsu !== "string" ||
    !orderNsu ||
    typeof transactionNsu !== "string" ||
    !transactionNsu ||
    typeof slug !== "string" ||
    !slug
  ) {
    return NextResponse.json(
      { erro: "Dados de pagamento incompletos." },
      { status: 400 }
    );
  }

  try {
    // Confere o pagamento diretamente com a InfinitePay.
    const respostaPagamento = await fetch(
      "https://api.checkout.infinitepay.io/payment_check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: INFINITEPAY_HANDLE,
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!respostaPagamento.ok) {
      throw new Error("Falha ao consultar o pagamento.");
    }

    const pagamento = await respostaPagamento.json();

    if (
    pagamento?.success !== true ||
    pagamento?.paid !== true ||
    !Number.isSafeInteger(Number(pagamento?.amount)) ||
    Number(pagamento.amount) <= 0 ||
    !Number.isSafeInteger(Number(pagamento?.paid_amount)) ||
    Number(pagamento.paid_amount) < Number(pagamento.amount)
    ) {
      return NextResponse.json(
        { erro: "Pagamento ainda não confirmado." },
        { status: 400 }
      );
    }

    const conexao = await db.connect();

    try {
      await conexao.query("BEGIN");

      const resultadoPedido = await conexao.query<Pedido>(
        `
          SELECT id, valor_total, status, transaction_nsu
          FROM pedidos
          WHERE order_nsu = $1
          FOR UPDATE
        `,
        [orderNsu]
      );

      const pedido = resultadoPedido.rows[0];

      if (!pedido) {
        await conexao.query("ROLLBACK");

        return NextResponse.json(
          { erro: "Pedido não encontrado." },
          { status: 400 }
        );
      }

      const valorEsperado = Math.round(
        Number(pedido.valor_total) * 100
      );

      if (Number(pagamento.amount) !== valorEsperado) {
        await conexao.query("ROLLBACK");

        console.error(
          "Valor divergente no pagamento:",
          orderNsu
        );

        return NextResponse.json(
          { erro: "O valor do pagamento não corresponde ao pedido." },
          { status: 400 }
        );
      }

      // Notificações repetidas não podem baixar o estoque novamente.
      if (pedido.status === "PAGO") {
        if (pedido.transaction_nsu === transactionNsu) {
          await conexao.query("COMMIT");

          return NextResponse.json({ success: true });
        }

        await conexao.query("ROLLBACK");

        return NextResponse.json(
          { erro: "O pedido já possui outro pagamento registrado." },
          { status: 400 }
        );
      }

      if (pedido.status !== "PENDENTE") {
        await conexao.query("ROLLBACK");

        return NextResponse.json(
          { erro: "O pedido não pode ser confirmado neste estado." },
          { status: 400 }
        );
      }

      // Bloqueia as variações em ordem fixa para evitar
      // atualizações simultâneas inconsistentes.
      const resultadoItens = await conexao.query<ItemPedido>(
        `
          SELECT
            variacao_id,
            quantidade,
            nome_produto,
            tamanho,
            cor
          FROM itens_pedido
          WHERE pedido_id = $1
          ORDER BY variacao_id
        `,
        [pedido.id]
      );

      const itens = resultadoItens.rows;

      if (itens.length === 0) {
        await conexao.query("ROLLBACK");

        return NextResponse.json(
          { erro: "Pedido sem itens." },
          { status: 400 }
        );
      }

      for (const item of itens) {
        const estoqueAtual = await conexao.query(
          `
            SELECT id
            FROM variacoes_estoque
            WHERE id = $1
              AND quantidade >= $2
            FOR UPDATE
          `,
          [item.variacao_id, item.quantidade]
        );

        if (estoqueAtual.rowCount !== 1) {
          await conexao.query("ROLLBACK");

          console.error(
            "Pagamento confirmado, mas estoque insuficiente.",
            { orderNsu, variacaoId: item.variacao_id }
          );

          return NextResponse.json(
            {
              erro:
                "Pagamento confirmado, mas é necessária análise manual do estoque.",
            },
            { status: 400 }
          );
        }
      }

      for (const item of itens) {
        await conexao.query(
          `
            UPDATE variacoes_estoque
            SET quantidade = quantidade - $1
            WHERE id = $2
          `,
          [item.quantidade, item.variacao_id]
        );

        await conexao.query(
          `
            INSERT INTO movimentacoes_estoque (
              variacao_id,
              tipo,
              quantidade,
              observacao
            )
            VALUES ($1, 'VENDA', $2, $3)
          `,
          [
            item.variacao_id,
            item.quantidade,
            `Pedido ${orderNsu} pago pela InfinitePay`,
          ]
        );
      }

      await conexao.query(
        `
          UPDATE pedidos
          SET status = 'PAGO',
              transaction_nsu = $1,
              atualizado_em = NOW()
          WHERE id = $2
        `,
        [transactionNsu, pedido.id]
      );

      await conexao.query("COMMIT");

      return NextResponse.json({ success: true });
    } catch (erro) {
      await conexao.query("ROLLBACK").catch(() => undefined);
      throw erro;
    } finally {
      conexao.release();
    }
  } catch (erro) {
    console.error("Erro ao processar webhook InfinitePay:", erro);

    return NextResponse.json(
      { erro: "Não foi possível processar a notificação." },
      { status: 500 }
    );
  }
}
