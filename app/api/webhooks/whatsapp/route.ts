
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Verificação do webhook inválida" },
    { status: 403 }
  );
}

async function enviarResposta(
  numero: string,
  mensagem: string
) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("Configuração do WhatsApp ausente");
  }

  const response = await fetch(
    `https://graph.facebook.com/v26.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: numero,
        type: "text",
        text: { body: mensagem },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Erro ao enviar mensagem pelo WhatsApp:", error);
    throw new Error("Falha no envio pelo WhatsApp");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body?.object !== "whatsapp_business_account") {
      return NextResponse.json({ received: false }, { status: 404 });
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        for (const message of change.value?.messages ?? []) {
          const numero = message.from;
          const texto = message.text?.body?.trim();

          console.log("Mensagem recebida pelo WhatsApp:", {
            from: numero,
            type: message.type,
            text: texto,
            id: message.id,
          });

          if (!numero || !texto) continue;

          await enviarResposta(
            numero,
            "Olá! 😊 Você está falando com a ByChicuti! Como podemos ajudar? Responda com: 1 - Produtos femininos, 2 - Produtos masculinos, 3 - Atendimento."
          );
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no webhook do WhatsApp:", error);

    return NextResponse.json(
      { error: "Não foi possível processar a notificação" },
      { status: 500 }
    );
  }
}
