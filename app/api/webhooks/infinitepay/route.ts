
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const INFINITEPAY_HANDLE =
  process.env.INFINITEPAY_HANDLE || "bychicuti";

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
  requer_analise_manual: boolean;
};

type ItemPedido = {
  id:number;
  variacao_id: number;
  quantidade: number;
  nome_produto: string;
  tamanho: string;
  cor: string;
};

export async function POST(request: Request) {
  console.log("Webhook InfinitePay recebido.");

  let payload: WebhookPayload;

  try {
    payload = await request.json();
  } catch {
    console.error("Webhook recebeu um JSON inválido.");

    return NextResponse.json(
      { erro: "Corpo da notificação inválido." },
      { status: 400 }
    );
  }

  console.log("Webhook recebeu os campos:", {
    order_nsu: Boolean(payload?.order_nsu),
    transaction_nsu: Boolean(payload?.transaction_nsu),
    invoice_slug: Boolean(payload?.invoice_slug),
  });

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
        SELECT
            id,
            valor_total,
            status,
            transaction_nsu,
            requer_analise_manual
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
        if (pedido.requer_analise_manual) {
            if (pedido.transaction_nsu === transactionNsu) {
                // Repetição da notificação do pagamento já registrado.
                await conexao.query("COMMIT");

                return NextResponse.json({
                success: true,
                requer_analise_manual: true,
                });
            }

            // Outro NSU para um pedido ja encaminhado para analise:
            // não processar nem baixar estoque novamente.
            await conexao.query("ROLLBACK");

            console.error(
                "Pagamento adicional ou NSU divergente em pedido sob análise manual.",
                {
                orderNsu,
                transactionNsu,
                transactionNsuRegistrado: pedido.transaction_nsu,
                }
            );

            return NextResponse.json(
                {
                erro: "Pedido em análise manual. O novo pagamento precisa ser verificado.",
                },
                { status: 409 }
            );
            }

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
            const pedidoComMesmoNsu = await conexao.query(
                `
                    SELECT id
                    FROM pedidos
                    WHERE transaction_nsu = $1
                    AND transaction_nsu <> ''
                    AND id <> $2
                    LIMIT 1
                `,
                [transactionNsu, pedido.id]
            );

            const observacaoManual =
                `Pagamento confirmado pela InfinitePay, mas o pedido estava com status ${pedido.status}. ` +
                `Verificar pagamento, estoque e necessidade de regularização manual.`;

            if (pedidoComMesmoNsu.rowCount === 0) {
                await conexao.query(
                    `
                        UPDATE pedidos
                        SET requer_analise_manual = TRUE,
                            transaction_nsu = COALESCE(
                                NULLIF(transaction_nsu, ''),
                                $1
                            ),
                            observacao_interna = $2,
                            atualizado_em = NOW()
                        WHERE id = $3
                    `,
                    [transactionNsu, observacaoManual, pedido.id]
                );
            } else {
                await conexao.query(
                    `
                        UPDATE pedidos
                        SET requer_analise_manual = TRUE,
                            observacao_interna = $1,
                            atualizado_em = NOW()
                        WHERE id = $2
                    `,
                    [
                        observacaoManual +
                            " O NSU já está associado a outro pedido. Conferir manualmente.",
                        pedido.id,
                    ]
                );
            }

            await conexao.query("COMMIT");

            console.error(
                "Pagamento confirmado para pedido em estado inesperado. Encaminhado para análise manual.",
                {
                    orderNsu,
                    transactionNsu,
                    statusAtual: pedido.status,
                    nsuDuplicado: pedidoComMesmoNsu.rowCount !== 0,
                }
            );

            return NextResponse.json({
                success: true,
                requer_analise_manual: true,
            });
        }
      // Bloqueia as variações em ordem fixa para evitar
      // atualizações simultâneas inconsistentes.
      const resultadoItens = await conexao.query<ItemPedido>(
        `
        SELECT id, variacao_id, quantidade
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

       const quantidadesPorVariacao = new Map<number, number>();

      for (const item of itens) {
        const quantidadeAtual =
          quantidadesPorVariacao.get(item.variacao_id) ?? 0;

        quantidadesPorVariacao.set(
          item.variacao_id,
          quantidadeAtual + item.quantidade
        );
      }

      // Bloqueia e verifica o estoque total necessário.

      const variacoesOrdenadas = [
        ...quantidadesPorVariacao.entries(),
      ].sort((a, b) => a[0] - b[0]);

      for (const [variacaoId, quantidadeTotal] of variacoesOrdenadas) {
        const estoqueAtual = await conexao.query(
          `
            SELECT id
            FROM variacoes_estoque
            WHERE id = $1
              AND quantidade >= $2
            FOR UPDATE
          `,
          [variacaoId, quantidadeTotal]
        );


        if (estoqueAtual.rowCount !== 1) {
        const observacao =
            `Pagamento confirmado pela InfinitePay, mas estoque insuficiente. ` +
            `Variação: ${variacaoId}. ` +
            `Quantidade necessária: ${quantidadeTotal}. ` +
            `Transação: ${transactionNsu}. Requer análise manual.`;

        const nsuAtual = pedido.transaction_nsu;

        const pedidoComMesmoNsu = await conexao.query(
            `
            SELECT id
            FROM pedidos
            WHERE transaction_nsu = $1
                AND transaction_nsu <> ''
                AND id <> $2
            LIMIT 1
            `,
            [transactionNsu, pedido.id]
        );

        const nsuDivergente =
            nsuAtual !== null &&
            nsuAtual !== "" &&
            nsuAtual !== transactionNsu;

        let observacaoFinal = observacao;

        if (nsuDivergente) {
            observacaoFinal +=
            ` O pedido já possuía outro NSU (${nsuAtual}). ` +
            `Conferir as transações manualmente.`;
        }

        if (pedidoComMesmoNsu.rowCount !== 0) {
            observacaoFinal +=
            " O NSU desta transação já está associado a outro pedido. " +
            "Conferir manualmente.";
        }

        const podeRegistrarNsu =
            !nsuDivergente &&
            pedidoComMesmoNsu.rowCount === 0;

        if (podeRegistrarNsu) {
            await conexao.query(
            `
                UPDATE pedidos
                SET transaction_nsu = $1,
                    requer_analise_manual = TRUE,
                    observacao_interna = $2,
                    atualizado_em = NOW()
                WHERE id = $3
            `,
            [transactionNsu, observacaoFinal, pedido.id]
            );
        } else {
            await conexao.query(
            `
                UPDATE pedidos
                SET requer_analise_manual = TRUE,
                    observacao_interna = $1,
                    atualizado_em = NOW()
                WHERE id = $2
            `,
            [observacaoFinal, pedido.id]
            );
        }

        await conexao.query("COMMIT");

        console.error(
            "Pagamento confirmado: pedido encaminhado para análise manual.",
            {
            orderNsu,
            transactionNsu,
            variacaoId,
            quantidadeNecessaria: quantidadeTotal,
            nsuDuplicado: pedidoComMesmoNsu.rowCount !== 0,
            nsuDivergente,
            }
        );

        return NextResponse.json({
            success: true,
            requer_analise_manual: true,
        });
        }
      }

      // Baixa uma vez o total de cada Variação.
for (const [variacaoId, quantidadeTotal] of variacoesOrdenadas) {
        const resultadoBaixa = await conexao.query(
          `
            UPDATE variacoes_estoque
            SET quantidade = quantidade - $1
            WHERE id = $2
              AND quantidade >= $1
          `,
          [quantidadeTotal, variacaoId]
        );

        if (resultadoBaixa.rowCount !== 1) {
          throw new Error(
            `Falha ao baixar estoque da variação ${variacaoId}.`
          );
        }
      }

      // Registra cada item original para manter a rastreabilidade.
      for (const item of itens) {
        await conexao.query(
          `
            INSERT INTO movimentacoes_estoque (
              pedido_id,
              item_pedido_id,
              variacao_id,
              tipo,
              quantidade,
              observacao
            )
            VALUES ($1, $2, $3, 'VENDA', $4, $5)
          `,
          [
            pedido.id,
            item.id,
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
      {
        success: false,
        message: "Não foi possível processar a notificação.",
      },
      { status: 500 }
    );
  }
}
