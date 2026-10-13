
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const DURACAO_SESSAO = 8 * 60 * 60;

function obterChave(): string {
  const chave = process.env.ADMIN_SESSION_SECRET;

  if (!chave || chave.length < 64) {
    throw new Error("ADMIN_SESSION_SECRET não configurada corretamente.");
  }

  return chave;
}

function assinar(conteudo: string): string {
  return createHmac("sha256", obterChave())
    .update(conteudo)
    .digest("base64url");
}

export function criarSessaoAdmin(): string {
  const expiracao = Math.floor(Date.now() / 1000) + DURACAO_SESSAO;
  const conteudo = Buffer.from(
    JSON.stringify({ admin: true, expiracao })
  ).toString("base64url");

  return `${conteudo}.${assinar(conteudo)}`;
}

export function validarSessaoAdmin(token?: string): boolean {
  if (!token) return false;

  try {
    const partes = token.split(".");
    if (partes.length !== 2) return false;

    const [conteudo, assinatura] = partes;
    const assinaturaEsperada = assinar(conteudo);

    const recebida = Buffer.from(assinatura, "base64url");
    const esperada = Buffer.from(assinaturaEsperada, "base64url");

    if (
      recebida.length !== esperada.length ||
      !timingSafeEqual(recebida, esperada)
    ) {
      return false;
    }

    const dados = JSON.parse(
      Buffer.from(conteudo, "base64url").toString("utf8")
    );

    return (
      dados.admin === true &&
      Number.isInteger(dados.expiracao) &&
      dados.expiracao > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}
