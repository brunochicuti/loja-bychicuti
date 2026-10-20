
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resultado = await authClient.signIn.email({
        email: email.trim(),
        password: senha,
        callbackURL: "/meus-pedidos",
      });

      if (resultado.error) {
        setErro(
          resultado.error.message ||
            "Não foi possível entrar. Confira seus dados e confirme seu e-mail."
        );
        return;
      }

      router.push("/meus-pedidos");
      router.refresh();
    } catch {
      setErro("Não foi possível entrar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#FBF6F3] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-[#863D3D]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center font-serif text-3xl font-semibold text-[#5C2A2A]">
          Entrar na minha conta
        </h1>

        <p className="mt-3 text-center text-sm text-[#5C2A2A]/75">
          Acesse sua conta para acompanhar seus pedidos.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#5C2A2A]"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-[#5C2A2A]"
            >
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-full bg-[#863D3D] px-5 py-3 font-medium text-white transition-colors hover:bg-[#5C2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5C2A2A]">
          Ainda não tem uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-[#863D3D] underline"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
