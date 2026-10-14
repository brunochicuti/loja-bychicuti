
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
      `SELECT id, tamanho, cor, quantidade
       FROM variacoes_estoque
       WHERE produto_id = $1
       ORDER BY cor, tamanho`,
      [id]
    );

    const cores = await db.query(
      `SELECT
         pc.id,
         pc.cor,
         pc.imagem,
         COALESCE(
           json_agg(
             json_build_object(
               'id', pci.id,
               'imagem', pci.imagem,
               'ordem', pci.ordem
             )
             ORDER BY pci.ordem, pci.id
           ) FILTER (WHERE pci.id IS NOT NULL),
           '[]'::json
         ) AS imagens
       FROM produto_cores pc
       LEFT JOIN produto_cor_imagens pci
         ON pci.produto_cor_id = pc.id
       WHERE pc.produto_id = $1
       GROUP BY pc.id, pc.cor, pc.imagem
       ORDER BY pc.cor`,
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

export async function PATCH(
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
    const { corId, imagem, imagens } = corpo;

    if (
      !Number.isSafeInteger(corId) ||
      corId <= 0 ||
      typeof imagem !== "string" ||
      imagem.trim().length === 0 ||
      imagem.trim().length > 2000
    ) {
      return respostaErro(
        "Informe o ID da cor e o caminho da imagem principal.",
        400
      );
    }

    if (
      imagens !== undefined &&
      (
        !Array.isArray(imagens) ||
        imagens.length > 20 ||
        imagens.some(
          (item: unknown) =>
            typeof item !== "string" ||
            !item.trim() ||
            item.trim().length > 2000
        )
      )
    ) {
      return respostaErro(
        "A lista de imagens adicionais é inválida.",
        400
      );
    }

    const corEncontrada = await db.query(
      `SELECT id
       FROM produto_cores
       WHERE id = $1 AND produto_id = $2`,
      [corId, id]
    );

    if (corEncontrada.rowCount === 0) {
      return respostaErro("Cor não encontrada para esse produto.", 404);
    }

    await db.query(
      `UPDATE produto_cores
       SET imagem = $1
       WHERE id = $2 AND produto_id = $3`,
      [imagem.trim(), corId, id]
    );

    if (imagens !== undefined) {
      await db.query(
        "DELETE FROM produto_cor_imagens WHERE produto_cor_id = $1",
        [corId]
      );

      for (let i = 0; i < imagens.length; i++) {
        await db.query(
          `INSERT INTO produto_cor_imagens
             (produto_cor_id, imagem, ordem)
           VALUES ($1, $2, $3)`,
          [corId, imagens[i].trim(), i + 1]
        );
      }
    }

    const atualizado = await db.query(
      `SELECT
         pc.id,
         pc.cor,
         pc.imagem,
         COALESCE(
           json_agg(
             json_build_object(
               'id', pci.id,
               'imagem', pci.imagem,
               'ordem', pci.ordem
             )
             ORDER BY pci.ordem, pci.id
           ) FILTER (WHERE pci.id IS NOT NULL),
           '[]'::json
         ) AS imagens
       FROM produto_cores pc
       LEFT JOIN produto_cor_imagens pci
         ON pci.produto_cor_id = pc.id
       WHERE pc.id = $1
       GROUP BY pc.id, pc.cor, pc.imagem`,
      [corId]
    );

    return NextResponse.json({
      mensagem: "Fotos da cor atualizadas com sucesso.",
      cor: atualizado.rows[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar fotos da cor:", error);
    return respostaErro("Não foi possível atualizar as fotos da cor.", 500);
  }
}
