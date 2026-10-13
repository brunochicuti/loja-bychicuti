
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/exigir-admin";

type Contexto = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: Contexto
) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json(
        { erro: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { erro: "ID de produto inválido." },
        { status: 400 }
      );
    }

    const corpo = await request.json();
    const { codigo, nome, descricao, preco, imagem, categoria } = corpo;

    if (
      typeof codigo !== "string" ||
      !/^\d{4}$/.test(codigo)
    ) {
      return NextResponse.json(
        { erro: "O código deve conter exatamente 4 dígitos." },
        { status: 400 }
      );
    }

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      nome.trim().length > 150 ||
      typeof preco !== "number" ||
      !Number.isFinite(preco) ||
      preco < 0 ||
      typeof categoria !== "string" ||
      !categoria.trim() ||
      categoria.trim().length > 100
    ) {
      return NextResponse.json(
        { erro: "Confira o nome, o preço e a categoria." },
        { status: 400 }
      );
    }

    if (
      (descricao !== null &&
        descricao !== undefined &&
        typeof descricao !== "string") ||
      (imagem !== null &&
        imagem !== undefined &&
        typeof imagem !== "string")
    ) {
      return NextResponse.json(
        { erro: "Descrição ou imagem inválida." },
        { status: 400 }
      );
    }

    const resultado = await db.query(
      `UPDATE public.produtos
       SET codigo = $1,
           nome = $2,
           descricao = $3,
           preco = $4,
           imagem = $5,
           categoria = $6
       WHERE id = $7
         AND ativo = TRUE
       RETURNING id, codigo, nome, descricao, preco, imagem, categoria`,
      [
        codigo,
        nome.trim(),
        descricao?.trim() || null,
        preco,
        imagem?.trim() || null,
        categoria.trim(),
        id,
      ]
    );

    if (resultado.rowCount === 0) {
      return NextResponse.json(
        { erro: "Produto não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      produto: resultado.rows[0],
    });
  } catch (error) {
    console.error("Erro ao editar produto:", error);

    const erro = error as { code?: string };

    if (erro.code === "23505") {
      return NextResponse.json(
        { erro: "Esse código já está cadastrado em outro produto." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { erro: "Não foi possível editar o produto." },
      { status: 500 }
    );
  }
}
