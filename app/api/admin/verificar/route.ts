import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validarSessaoAdmin } from "@/lib/admin-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_autenticado")?.value;

  if (!validarSessaoAdmin(token)) {
    return NextResponse.json(
      { erro: "Acesso não autorizado." },
      { status: 401 }
    );
  }

  return NextResponse.json({ autenticado: true });
}
