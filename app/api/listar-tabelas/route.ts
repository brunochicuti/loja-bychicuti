import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const resultado = await db.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (
          'produtos',
          'produto_cores',
          'variacoes_estoque',
          'movimentacoes_estoque'
        )
      ORDER BY table_name, ordinal_position;
    `);

    return NextResponse.json({
      colunas: resultado.rows,
    });
  } catch (error) {
    console.error("Erro ao consultar estrutura:", error);

    return NextResponse.json(
      { erro: "Não foi possível consultar a estrutura." },
      { status: 500 }
    );
  }
}