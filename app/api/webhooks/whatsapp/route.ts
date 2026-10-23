import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";

const SITE = "https://bychicuti.vercel.app";

const MENU =
  "Olá! Sou o assistente da By Chicuti. Responda com um número:\n\n" +
  "1 - Horário e endereço\n" +
  "2 - Tamanhos\n" +
  "3 - Ver produtos e comprar no site\n" +
  "4 - Status do meu pedido\n\n" +
  "Ou envie o código do pedido (exemplo: BC-1A2B3C4D).";

// A Meta chama este endereço uma vez, para confirmar que o site é seu.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const modo = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const desafio = searchParams.get("hub.challenge");

  if (modo === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN && desafio) {
    return new Response(desafio, { status: 200 });
  }

  return new Response("Acesso negado", { status: 403 });
}

// Confere se a mensagem veio mesmo da Meta.
function assinaturaValida(corpo: string, cabecalho: string | null) {
  if (!APP_SECRET || !cabecalho) return false;

  const esperado =
    "sha256=" +
    crypto.createHmac("sha256", APP_SECRET).update(corpo).digest("hex");

  const a = Buffer.from(esperado);
  const b = Buffer.from(cabecalho);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function enviar(para: string, texto: string) {
  const resposta = await fetch(
    `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: para,
        type: "text",
        text: { body: texto },
      }),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!resposta.ok) {
    console.error("Falha ao enviar mensagem do WhatsApp:", resposta.status);
  }
}

// Só devolve o status do pedido, nunca nome, telefone ou endereço.
async function statusDoPedido(codigo: string) {
  const codigoMaiusculo = codigo.toUpperCase();

  const resultado = await db.query(
    "SELECT status FROM pedidos WHERE codigo = $1",
    [codigoMaiusculo]
  );

  const pedido = resultado.rows[0];

  if (!pedido) {
    return "Não encontrei esse pedido. Confira o código e tente de novo.";
  }

  if (pedido.status === "PAGO") {
    return `Pedido ${codigoMaiusculo}: pagamento confirmado. Já estamos separando o seu pedido.`;
  }

  if (pedido.status === "PENDENTE") {
    return `Pedido ${codigoMaiusculo}: aguardando a confirmação do pagamento.`;
  }

  return `Pedido ${codigoMaiusculo}: está em análise pela loja. Em breve entramos em contato.`;
}

async function responder(textoRecebido: string) {
  const texto = textoRecebido.trim();

  const codigo = texto.match(/BC-[A-Fa-f0-9]{8}/);
  if (codigo) {
    return statusDoPedido(codigo[0]);
  }

  switch (texto) {
    case "1":
      return "Horário: segunda a sábado, das 9h às 18h.\nEndereço: TROQUE PELO ENDEREÇO REAL DA LOJA.";
    case "2":
      return "TROQUE PELA SUA TABELA DE TAMANHOS. Em caso de dúvida, mande uma mensagem que a loja ajuda.";
    case "3":
      return `Veja os produtos e compre pelo site: ${SITE}`;
    case "4":
      return "Envie o código do seu pedido (exemplo: BC-1A2B3C4D) que eu consulto o status.";
    default:
      return MENU;
  }
}

export async function POST(request: Request) {
  const corpo = await request.text();

  if (!assinaturaValida(corpo, request.headers.get("x-hub-signature-256"))) {
    return new Response("Assinatura inválida", { status: 401 });
  }

  try {
    const dados = JSON.parse(corpo);
    const mensagem = dados?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (mensagem && mensagem.type === "text") {
      const resposta = await responder(String(mensagem.text?.body ?? ""));
      await enviar(String(mensagem.from), resposta);
    }
  } catch (erro) {
    console.error("Erro no bot do WhatsApp:", erro);
  }

  // Sempre responde 200 depois de validar a assinatura, para a Meta não reenviar.
  return NextResponse.json({ ok: true });
}