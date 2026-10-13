
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/exigir-admin";

type Contexto = {
  params: Promise<{ id: string }>;
};

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function GET(
  _request: Request,
  { params }: Contexto
) {
  try {
    if (!(await exigirAdmin())) {
      return respostaErro("Acesso não autorizado.", 401);
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return respostaErro("ID de produto inválido.", 400);
    }

    const produto = await db.query(
      "SELECT id FROM produtos WHERE id = $1 AND ativo = TRUE",
      [id]
    );

    if (produto.rowCount === 0) {
      return respostaErro("Produto não encontrado.", 404);
    }

    const resultado = await db.query(
      `SELECT
         id,
         tamanho,
         cor,
         quantidade
       FROM variacoes_estoque
       WHERE produto_id = $1
       ORDER BY cor, tamanho`,
      [id]
    );

    const cores = await db.query(
      `SELECT id, cor, imagem
       FROM produto_cores
       WHERE produto_id = $1
       ORDER BY cor`,
      [id]
    );

    return NextResponse.json({
      variacoes: resultado.rows,
      cores: cores.rows,
    });
  } catch (error) {
    console.error("Erro ao consultar estoque:", error);
    return respostaErro("Não foi possível consultar o estoque.", 500);
  }
}

export async function POST(
  request: Request,
  { params }: Contexto
) {
  try {
    if (!(await exigirAdmin())) {
      return respostaErro("Acesso não autorizado.", 401);
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return respostaErro("ID de produto inválido.", 400);
    }

    const corpo = await request.json();
    const { tamanho, cor, quantidade } = corpo;

    if (
      typeof tamanho !== "string" ||
      !tamanho.trim() ||
      tamanho.trim().length > 20 ||
      typeof cor !== "string" ||
      !cor.trim() ||
      cor.trim().length > 50 ||
      !Number.isSafeInteger(quantidade) ||
      quantidade < 0 ||
      quantidade > 1000000
    ) {
      return respostaErro(
        "Informe um tamanho, uma cor e uma quantidade válida.",
        400
      );
    }

    const produto = await db.query(
      "SELECT id FROM produtos WHERE id = $1 AND ativo = TRUE",
      [id]
    );

    if (produto.rowCount === 0) {
      return respostaErro("Produto não encontrado.", 404);
    }

    const corNormalizada = cor.trim();
    const tamanhoNormalizado = tamanho.trim();

    const resultado = await db.query(
      `WITH cor_registrada AS (
         INSERT INTO produto_cores (produto_id, cor)
         VALUES ($1, $2)
         ON CONFLICT (produto_id, cor) DO NOTHING
       ),
       variacao AS (
         INSERT INTO variacoes_estoque
           (produto_id, tamanho, cor, quantidade)
         VALUES ($1, $3, $2, $4)
         ON CONFLICT (produto_id, tamanho, cor)
         DO UPDATE SET
           quantidade =
             variacoes_estoque.quantidade + EXCLUDED.quantidade
         RETURNING id, produto_id, tamanho, cor, quantidade
       ),
       movimento AS (
         INSERT INTO movimentacoes_estoque
           (variacao_id, tipo, quantidade, observacao)
         SELECT
           id,
           'ENTRADA',
           $4,
           'Entrada de estoque pelo painel administrativo'
         FROM variacao
         WHERE $4 > 0
         RETURNING id
       )
       SELECT * FROM variacao`,
      [id, corNormalizada, tamanhoNormalizado, quantidade]
    );

    return NextResponse.json(
      {
        mensagem: "Estoque atualizado com sucesso.",
        variacao: resultado.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return respostaErro("Não foi possível atualizar o estoque.", 500);
  }
}
