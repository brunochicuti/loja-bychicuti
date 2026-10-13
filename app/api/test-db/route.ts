import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.query("SELECT 1");
    return NextResponse.json({ conectado: true });
  } catch (error) {
    console.error("Erro na conexão com PostgreSQL:", error);
    return NextResponse.json(
      { conectado: false, erro: "Falha na conexão com o banco." },
      { status: 500 }
    );
  }
}