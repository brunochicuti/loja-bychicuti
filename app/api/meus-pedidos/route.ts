
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sessao = await auth.api.getSession({
      headers: await headers(),
    });

    if (!sessao?.user?.email) {
      return NextResponse.json(
        { erro: "Você precisa entrar na sua conta." },
        { status: 401 }
      );
    }

    const email = sessao.user.email.trim().toLowerCase();

    const pedidos = await db.query(
      `SELECT
          p.id,
          p.codigo,
          p.valor_total,
          p.status,
          p.criado_em,
          p.modalidade_entrega,
          p.status_operacional,
          p.frete_valor
       FROM pedidos p
       WHERE LOWER(TRIM(p.cliente_email)) = $1
       ORDER BY p.criado_em DESC`,
      [email]
    );

    const ids = pedidos.rows.map((pedido) => pedido.id);

    let itens: { pedido_id: string; nome_produto: string; tamanho: string; cor: string; preco_unitario: string; quantidade: number; subtotal: string }[] = [];

    if (ids.length > 0) {
      const resultadoItens = await db.query(
        `SELECT
            pedido_id,
            nome_produto,
            tamanho,
            cor,
            preco_unitario,
            quantidade,
            subtotal
         FROM itens_pedido
         WHERE pedido_id = ANY($1::bigint[])
         ORDER BY id`,
        [ids]
      );

      itens = resultadoItens.rows;
    }

    const pedidosComItens = pedidos.rows.map((pedido) => ({
      ...pedido,
      itens: itens.filter(
        (item) => String(item.pedido_id) === String(pedido.id)
      ),
    }));

    return NextResponse.json({ pedidos: pedidosComItens });
  } catch (erro) {
    console.error("Erro ao consultar pedidos do cliente:", erro);

    return NextResponse.json(
      { erro: "Não foi possível consultar seus pedidos." },
      { status: 500 }
    );
  }
}
