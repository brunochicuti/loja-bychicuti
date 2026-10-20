
const ORIGEM = {
  latitude: -22.079825305332978,
  longitude: -54.57047916443028,
};

export type EnderecoEntrega = {
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type ResultadoFrete = {
  distanciaMetros: number;
  distanciaKm: number;
  modalidade: "ENTREGA_PROPRIA" | "CORREIOS";
  freteCentavos: number | null;
};

export async function calcularFrete(
  destino: EnderecoEntrega
): Promise<ResultadoFrete> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("A chave da Google Routes API não está configurada.");
  }

  const enderecoDestino = [
    `${destino.endereco}, ${destino.numero}`,
    destino.complemento,
    destino.bairro,
    destino.cidade,
    destino.uf,
    destino.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const resposta = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: ORIGEM.latitude,
              longitude: ORIGEM.longitude,
            },
          },
        },
        destination: {
          address: enderecoDestino,
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        units: "METRIC",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!resposta.ok) {
    console.error("Erro ao consultar Google Routes:", resposta.status);
    throw new Error(
      "Não foi possível calcular a rota para esse endereço."
    );
  }

  const dados = await resposta.json();
  const distanciaMetros = dados?.routes?.[0]?.distanceMeters;

  if (
    !Number.isSafeInteger(distanciaMetros) ||
    distanciaMetros < 0
  ) {
    throw new Error(
      "Não foi possível localizar uma rota válida para esse endereço."
    );
  }

  const distanciaKm = distanciaMetros / 1000;
console.log("Distância exata em metros:", distanciaMetros);
console.log("Distância exata em km:", distanciaKm);

  if (distanciaKm > 100) {
    return {
      distanciaMetros,
      distanciaKm,
      modalidade: "CORREIOS",
      freteCentavos: null,
    };
  }

  let freteCentavos: number;

  if (distanciaKm <= 2) {
    freteCentavos = 700;
  } else if (distanciaKm <= 5) {
    freteCentavos = 1000;
  } else if (distanciaKm <= 8) {
    freteCentavos = 1400;
  } else if (distanciaKm <= 10) {
    freteCentavos = 1800;
  } else {
    freteCentavos =
      1800 + Math.ceil((distanciaMetros - 10000) * 0.15);
  }

  return {
    distanciaMetros,
    distanciaKm,
    modalidade: "ENTREGA_PROPRIA",
    freteCentavos,
  };
}
