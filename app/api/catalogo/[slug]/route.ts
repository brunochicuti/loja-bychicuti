
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Contexto = {
  params: Promise<{ slug: string }>;
};

const TAMANHOS_PERMITIDOS = [
  "2", "4", "6", "8", "10", "12", "14", "16",
  "40", "42", "44", "46", "48", "50", "52",
  "Único",
];

function criarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(
  _request: Request,
  { params }: Contexto
) {
  try {
    const { slug } = await params;

    const resultado = await db.query(
      `SELECT
         id,
         codigo,
         nome,
         descricao,
         preco,
         imagem,
         categoria
       FROM public.produtos
       WHERE ativo = TRUE
       ORDER BY id`
    );

    const produto = resultado.rows.find(
      (item) => criarSlug(item.nome) === slug
    );

    if (!produto) {
      return NextResponse.json(
        { erro: "Produto não encontrado." },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    const [cores, variacoes] = await Promise.all([
      db.query(
        `SELECT cor, imagem
         FROM public.produto_cores
         WHERE produto_id = $1
         ORDER BY cor`,
        [produto.id]
      ),
      db.query(
        `SELECT tamanho, cor, quantidade
         FROM public.variacoes_estoque
         WHERE produto_id = $1
           AND ativo = TRUE
           AND tamanho = ANY($2::text[])
         ORDER BY cor, tamanho`,
        [produto.id, TAMANHOS_PERMITIDOS]
      ),
    ]);

    return NextResponse.json(
      {
        produto,
        cores: cores.rows,
        variacoes: variacoes.rows,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao buscar produto do catálogo:", error);

    return NextResponse.json(
      { erro: "Não foi possível carregar o produto." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
