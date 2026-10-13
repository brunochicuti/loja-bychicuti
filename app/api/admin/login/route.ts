
import { NextResponse } from "next/server";
import { criarSessaoAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const senha = corpo?.senha;
    const senhaCorreta = process.env.ADMIN_PASSWORD;

    if (!senhaCorreta) {
      return NextResponse.json(
        { erro: "Senha administrativa não configurada no servidor." },
        { status: 500 }
      );
    }

    if (typeof senha !== "string" || senha !== senhaCorreta) {
      return NextResponse.json(
        { erro: "Senha incorreta." },
        { status: 401 }
      );
    }

    const resposta = NextResponse.json({ sucesso: true });

    resposta.cookies.set("admin_autenticado", criarSessaoAdmin(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return resposta;
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível realizar o login." },
      { status: 400 }
    );
  }
}
