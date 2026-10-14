import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/exigir-admin";

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function GET(request: Request) {
  try {
    if (!(await exigirAdmin())) {
      return respostaErro("Acesso não autorizado.", 401);
    }

    const { searchParams } = new URL(request.url);
    const limiteSolicitado = Number(searchParams.get("limite") || 100);
    const limite = Number.isSafeInteger(limiteSolicitado)
      ? Math.min(Math.max(limiteSolicitado, 1), 500)
      : 100;

    const resultado = await db.query(
      `SELECT
         m.id,
         m.variacao_id,
         m.quantidade,
         m.observacao,
         to_jsonb(m)->>'created_at' AS data,
         to_jsonb(m)->>'data' AS data_alternativa,
         v.produto_id,
         v.tamanho,
         v.cor,
         p.nome AS produto
       FROM movimentacoes_estoque m
       JOIN variacoes_estoque v ON v.id = m.variacao_id
       JOIN produtos p ON p.id = v.produto_id
       WHERE m.tipo = 'VENDA'
       ORDER BY m.id DESC
       LIMIT $1`,
      [limite]
    );

    const vendas = resultado.rows.map((venda) => ({
      ...venda,
      data: venda.data || venda.data_alternativa || null,
    }));

    return NextResponse.json({ vendas });
  } catch (error) {
    console.error("Erro ao consultar histórico de vendas:", error);
    return respostaErro(
      "Não foi possível carregar o histórico de vendas.",
      500
    );
  }
}

export async function POST(request: Request) {
  let cliente: import("pg").PoolClient | undefined;

  try {
    if (!(await exigirAdmin())) {
      return respostaErro("Acesso não autorizado.", 401);
    }

    let corpo: {
      variacaoId?: unknown;
      quantidade?: unknown;
    };

    try {
      corpo = await request.json();
    } catch {
      return respostaErro("O corpo da requisição é inválido.", 400);
    }

    const { variacaoId, quantidade } = corpo;

    if (
      typeof variacaoId !== "number" ||
      !Number.isSafeInteger(variacaoId) ||
      variacaoId <= 0 ||
      typeof quantidade !== "number" ||
      !Number.isSafeInteger(quantidade) ||
      quantidade <= 0 ||
      quantidade > 1000000
    ) {
      return respostaErro(
        "Informe uma variação válida e uma quantidade inteira maior que zero.",
        400
      );
    }

    cliente = await db.connect();
    await cliente.query("BEGIN");

    const resultado = await cliente.query(
      `UPDATE variacoes_estoque
       SET quantidade = quantidade - $1
       WHERE id = $2
         AND ativo = TRUE
         AND quantidade >= $1
         AND EXISTS (
           SELECT 1
           FROM produtos
           WHERE produtos.id = variacoes_estoque.produto_id
             AND produtos.ativo = TRUE
         )
       RETURNING id, produto_id, tamanho, cor, quantidade`,
      [quantidade, variacaoId]
    );

    if (resultado.rowCount === 0) {
      await cliente.query("ROLLBACK");

      const verificacao = await db.query(
        `SELECT v.quantidade, v.ativo
         FROM variacoes_estoque v
         JOIN produtos p ON p.id = v.produto_id
         WHERE v.id = $1
           AND p.ativo = TRUE`,
        [variacaoId]
      );

      if (verificacao.rowCount === 0) {
        return respostaErro("Variação ou produto não encontrado.", 404);
      }

      if (verificacao.rows[0].ativo === false) {
        return respostaErro(
          "Essa variação está desativada e não pode ser vendida.",
          409
        );
      }

      return respostaErro(
        `Estoque insuficiente. Saldo atual: ${verificacao.rows[0].quantidade}.`,
        409
      );
    }

    const variacao = resultado.rows[0];

    await cliente.query(
      `INSERT INTO movimentacoes_estoque
         (variacao_id, tipo, quantidade, observacao)
       VALUES ($1, 'VENDA', $2, $3)`,
      [
        variacao.id,
        quantidade,
        "Venda confirmada pelo WhatsApp, registrada no painel administrativo",
      ]
    );

    await cliente.query("COMMIT");

    return NextResponse.json({
      mensagem: "Venda registrada e estoque atualizado com sucesso.",
      variacao,
      quantidadeVendida: quantidade,
    });
  } catch (error) {
    if (cliente) {
      try {
        await cliente.query("ROLLBACK");
      } catch {
        // A transação pode já ter sido encerrada.
      }
    }

    console.error("Erro ao registrar venda:", error);
    return respostaErro("Não foi possível registrar a venda.", 500);
  } finally {
    cliente?.release();
  }
}