
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validarSessaoAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_autenticado")?.value;

  if (!validarSessaoAdmin(token)) {
    return NextResponse.json(
      { erro: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  try {
    const resultado = await db.query(
      `
        SELECT
          p.id,
          p.codigo,
          p.cliente_nome,
          p.cliente_telefone,
          p.valor_total,
          p.status,
          p.status_operacional,
          p.modalidade_entrega,
          p.criado_em,
          p.atualizado_em,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'nome_produto', ip.nome_produto,
                  'tamanho', ip.tamanho,
                  'cor', ip.cor,
                  'quantidade', ip.quantidade,
                  'preco_unitario', ip.preco_unitario,
                  'subtotal', ip.subtotal
                )
                ORDER BY ip.id
              )
              FROM itens_pedido ip
              WHERE ip.pedido_id = p.id
            ),
            '[]'::json
          ) AS itens
        FROM pedidos p
        ORDER BY p.criado_em DESC
        LIMIT 200
      `
    );

    return NextResponse.json({
      pedidos: resultado.rows,
    });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);

    return NextResponse.json(
      { erro: "Não foi possível carregar os pedidos." },
      { status: 500 }
    );
  }
}
