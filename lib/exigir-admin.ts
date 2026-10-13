import { cookies } from "next/headers";
import { validarSessaoAdmin } from "@/lib/admin-auth";

export async function exigirAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_autenticado")?.value;

  return validarSessaoAdmin(token);
}