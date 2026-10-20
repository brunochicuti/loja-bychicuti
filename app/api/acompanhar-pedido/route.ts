
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json(
      { erro: "Link de acompanhamento inválido." },
      { status: 400 }
    );
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const resultado = await pool.query(
      `
        SELECT
          codigo,
          status,
          status_operacional,
          criado_em,
          atualizado_em
        FROM pedidos
        WHERE token_acompanhamento_hash = $1
        LIMIT 1
      `,
      [tokenHash]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const pedido = resultado.rows[0];

    return NextResponse.json({
      codigo: pedido.codigo,
      status: pedido.status,
      statusOperacional: pedido.status_operacional,
      criadoEm: pedido.criado_em,
      atualizadoEm: pedido.atualizado_em,
    });
  } catch (erro) {
    console.error("Erro ao consultar acompanhamento do pedido:", erro);

    return NextResponse.json(
      { erro: "Não foi possível consultar o pedido agora." },
      { status: 500 }
    );
  }
}
