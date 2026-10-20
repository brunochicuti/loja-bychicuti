
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validarSessaoAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const FLUXOS = {
  ENTREGA: [
    "RECEBIDO",
    "CONFIRMADO",
    "EM_PREPARACAO",
    "SAIU_PARA_ENTREGA",
    "ENTREGUE",
  ],
  RETIRADA: [
    "RECEBIDO",
    "CONFIRMADO",
    "EM_PREPARACAO",
    "PRONTO_PARA_RETIRADA",
    "RETIRADO",
  ],
} as const;

type Modalidade = keyof typeof FLUXOS;

function nomeStatus(status: string): boolean {
  return Object.values(FLUXOS).some((fluxo) =>
    (fluxo as readonly string[]).includes(status)
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_autenticado")?.value;

  if (!validarSessaoAdmin(token)) {
    return NextResponse.json(
      { erro: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const pedidoId = Number(id);

  if (!Number.isSafeInteger(pedidoId) || pedidoId <= 0) {
    return NextResponse.json(
      { erro: "ID de pedido inválido." },
      { status: 400 }
    );
  }

  let statusNovo: string;

  try {
    const corpo = await request.json();
    statusNovo = corpo?.status;
  } catch {
    return NextResponse.json(
      { erro: "Corpo da solicitação inválido." },
      { status: 400 }
    );
  }

  if (typeof statusNovo !== "string" || !nomeStatus(statusNovo)) {
    return NextResponse.json(
      { erro: "Status operacional inválido." },
      { status: 400 }
    );
  }

  const conexao = await db.connect();

  try {
    await conexao.query("BEGIN");

    const resultado = await conexao.query<{
      id: number;
      status: string;
      status_operacional: string;
      modalidade_entrega: Modalidade;
      requer_analise_manual: boolean;
    }>(
      `
        SELECT
          id,
          status,
          status_operacional,
          modalidade_entrega,
          requer_analise_manual
        FROM pedidos
        WHERE id = $1
        FOR UPDATE
      `,
      [pedidoId]
    );

    const pedido = resultado.rows[0];

    if (!pedido) {
      await conexao.query("ROLLBACK");
      return NextResponse.json(
        { erro: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (pedido.requer_analise_manual) {
      await conexao.query("ROLLBACK");
      return NextResponse.json(
        { erro: "Resolva a análise manual antes de atualizar o andamento." },
        { status: 409 }
      );
    }

    if (pedido.status !== "PAGO") {
      await conexao.query("ROLLBACK");
      return NextResponse.json(
        { erro: "Só é possível avançar pedidos com pagamento confirmado." },
        { status: 409 }
      );
    }

    const fluxo = FLUXOS[pedido.modalidade_entrega];

    if (!fluxo) {
      await conexao.query("ROLLBACK");
      return NextResponse.json(
        { erro: "Modalidade de recebimento inválida." },
        { status: 409 }
      );
    }

    const etapas = fluxo as readonly string[];

    const indiceAtual = etapas.indexOf(pedido.status_operacional);
    const indiceNovo = etapas.indexOf(statusNovo);

    if (
      indiceAtual < 0 ||
      indiceNovo !== indiceAtual + 1
    ) {
      await conexao.query("ROLLBACK");
      return NextResponse.json(
        { erro: "Só é permitido avançar uma etapa por vez, na ordem correta." },
        { status: 409 }
      );
    }

    await conexao.query(
      `
        UPDATE pedidos
        SET status_operacional = $1,
            atualizado_em = NOW()
        WHERE id = $2
      `,
      [statusNovo, pedidoId]
    );

    await conexao.query(
      `
        INSERT INTO historico_status_pedidos (
          pedido_id,
          status_anterior,
          status_novo,
          alterado_por
        )
        VALUES ($1, $2, $3, 'ADMIN')
      `,
      [pedidoId, pedido.status_operacional, statusNovo]
    );

    await conexao.query("COMMIT");

    return NextResponse.json({
      sucesso: true,
      status_operacional: statusNovo,
    });
  } catch (erro) {
    await conexao.query("ROLLBACK").catch(() => undefined);
    console.error("Erro ao atualizar andamento do pedido:", erro);

    return NextResponse.json(
      { erro: "Não foi possível atualizar o andamento do pedido." },
      { status: 500 }
    );
  } finally {
    conexao.release();
  }
}
