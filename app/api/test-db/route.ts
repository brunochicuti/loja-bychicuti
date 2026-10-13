import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const resultado = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return NextResponse.json({
      tabelas: resultado.rows.map((linha) => linha.table_name),
    });
  } catch (error) {
    console.error("Erro ao listar tabelas:", error);

    return NextResponse.json(
      { erro: "Não foi possível listar as tabelas." },
      { status: 500 }
    );
  }
}