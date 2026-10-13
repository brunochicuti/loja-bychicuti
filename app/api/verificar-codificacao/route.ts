
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const teste = "Básica, Sutiã e Conjuntos";

    const resultado = await db.query(
      "SELECT $1::text AS texto",
      [teste]
    );

    return NextResponse.json({
      enviado: teste,
      recebido: resultado.rows[0].texto,
      correto: teste === resultado.rows[0].texto,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: "Falha no teste de acentuação." },
      { status: 500 }
    );
  }
}
