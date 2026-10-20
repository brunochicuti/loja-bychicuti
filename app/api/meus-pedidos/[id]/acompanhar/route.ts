
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Contexto = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: Contexto
) {
  try {
    const sessao = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessao?.user?.email) {
      return NextResponse.json(
        { erro: "Entre na sua conta para acompanhar o pedido." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { erro: "Pedido inválido." },
        { status: 400 }
      );
    }

    const email = sessao.user.email.trim().toLowerCase();

    const resultado = await db.query(
      `SELECT
          codigo,
          status,
          status_operacional,
          modalidade_entrega,
          criado_em,
          atualizado_em
       FROM pedidos
       WHERE id = $1
         AND LOWER(TRIM(cliente_email)) = $2
       LIMIT 1`,
      [id, email]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { erro: "Pedido não encontrado na sua conta." },
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
      modalidadeEntrega: pedido.modalidade_entrega,
    });
  } catch (erro) {
    console.error("Erro ao acompanhar pedido da conta:", erro);

    return NextResponse.json(
      { erro: "Não foi possível consultar o pedido agora." },
      { status: 500 }
    );
  }
}
