
import { NextResponse } from "next/server";
import { calcularFrete, type EnderecoEntrega } from "@/lib/frete";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const corpo = await request.json();
    const dados = corpo?.endereco;

    const destino: EnderecoEntrega = {
      cep: String(dados?.cep ?? "").replace(/\D/g, ""),
      endereco: String(dados?.endereco ?? "").trim(),
      numero: String(dados?.numero ?? "").trim(),
      complemento: String(dados?.complemento ?? "").trim(),
      bairro: String(dados?.bairro ?? "").trim(),
      cidade: String(dados?.cidade ?? "").trim(),
      uf: String(dados?.uf ?? "").trim().toUpperCase(),
    };

    if (
      !/^\d{8}$/.test(destino.cep) ||
      !destino.endereco ||
      destino.endereco.length > 200 ||
      !destino.numero ||
      destino.numero.length > 20 ||
      (destino.complemento?.length ?? 0) > 100 ||
      !destino.bairro ||
      destino.bairro.length > 100 ||
      !destino.cidade ||
      destino.cidade.length > 100 ||
      !/^[A-Z]{2}$/.test(destino.uf)
    ) {
      return NextResponse.json(
        { erro: "Confira todos os dados do endereço." },
        { status: 400 }
      );
    }

    const resultado = await calcularFrete(destino);

    if (resultado.modalidade === "CORREIOS") {
      return NextResponse.json(
        {
          modalidade: "CORREIOS",
          distanciaKm: resultado.distanciaKm,
          erro:
            "Esse endereço fica a mais de 100 km da loja. A cotação automática dos Correios ainda não está disponível.",
        },
        { status: 400 }
      );
    }

    if (resultado.freteCentavos === null) {
      throw new Error("Valor do frete indisponível.");
    }

    return NextResponse.json({
      modalidade: resultado.modalidade,
      distanciaKm: resultado.distanciaKm,
      frete: resultado.freteCentavos / 100,
    });
  } catch (erro) {
    console.error("Erro ao consultar frete:", erro);

    return NextResponse.json(
      {
        erro:
          "Não foi possível calcular o frete. Confira o endereço e tente novamente.",
      },
      { status: 500 }
    );
  }
}
