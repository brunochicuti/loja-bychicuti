
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const resultado = await authClient.signUp.email({
        name: nome.trim(),
        email: email.trim(),
        password: senha,
        callbackURL: "/meus-pedidos",
      });

      if (resultado.error) {
        setErro(
          resultado.error.message ||
            "Não foi possível criar sua conta."
        );
        return;
      }

      setMensagem(
        "Cadastro enviado! Confira seu e-mail para confirmar sua conta antes de entrar."
      );
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
    } catch {
      setErro(
        "Não foi possível concluir o cadastro. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#FBF6F3] px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-[#863D3D]/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center font-serif text-3xl font-semibold text-[#5C2A2A]">
          Criar minha conta
        </h1>

        <p className="mt-3 text-center text-sm text-[#5C2A2A]/75">
          Cadastre-se para acompanhar seus pedidos na ByChicuti.
        </p>

        <form onSubmit={cadastrar} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium text-[#5C2A2A]"
            >
              Nome completo
            </label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
            />
          </div>

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
              maxLength={254}
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
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-[#863D3D]/25 px-4 py-3 outline-none focus:ring-2 focus:ring-[#863D3D]/30"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use pelo menos 8 caracteres.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmar-senha"
              className="mb-2 block text-sm font-medium text-[#5C2A2A]"
            >
              Confirmar senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
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

          {mensagem && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
            >
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-full bg-[#863D3D] px-5 py-3 font-medium text-white transition-colors hover:bg-[#5C2A2A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5C2A2A]">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#863D3D] underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
