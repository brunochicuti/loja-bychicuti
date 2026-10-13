import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/exigir-admin";

export async function GET() {
  try {
    const resultado = await db.query(`
      SELECT
        id,
        codigo,
        nome,
        descricao,
        preco,
        imagem,
        categoria
      FROM public.produtos
      WHERE ativo = TRUE
      ORDER BY nome ASC;
    `);

    return NextResponse.json({
      produtos: resultado.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return NextResponse.json(
      { erro: "Não foi possível buscar os produtos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json(
        { erro: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const corpo = await request.json();

    const {
      codigo,
      nome,
      descricao,
      preco,
      imagem,
      categoria,
    } = corpo;

    if (
      typeof codigo !== "string" ||
      !/^\d{4}$/.test(codigo) ||
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof preco !== "number" ||
      !Number.isFinite(preco) ||
      preco < 0 ||
      typeof categoria !== "string" ||
      !categoria.trim()
    ) {
      return NextResponse.json(
        {
          erro:
            "Informe um código de 4 dígitos, um nome, um preço válido e uma categoria.",
        },
        { status: 400 }
      );
    }

    if (
      (descricao != null && typeof descricao !== "string") ||
      (imagem != null && typeof imagem !== "string")
    ) {
      return NextResponse.json(
        { erro: "Descrição ou imagem inválida." },
        { status: 400 }
      );
    }

    const resultado = await db.query(
      `INSERT INTO public.produtos
        (codigo, nome, descricao, preco, imagem, categoria, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING
         id,
         codigo,
         nome,
         descricao,
         preco,
         imagem,
         categoria`,
      [
        codigo,
        nome.trim(),
        descricao ?? null,
        preco,
        imagem ?? null,
        categoria.trim(),
      ]
    );

    return NextResponse.json(
      { produto: resultado.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);

    const erro = error as { code?: string };

    if (erro.code === "23505") {
      return NextResponse.json(
        { erro: "Esse código já está cadastrado em outro produto." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { erro: "Não foi possível cadastrar o produto." },
      { status: 500 }
    );
  }
}