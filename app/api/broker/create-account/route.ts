// app/api/broker/create-account/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const brokerApi = axios.create({
  baseURL: "https://api-broker4.nelogica.com.br/",
  headers: {
    Origin: process.env.NEXT_PUBLIC_APP_URL || "tradershouse.com.br",
    "Content-Type": "application/json",
  },
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Payload recebido:", payload);

    // Log do token para debug
    console.log("Token sendo usado:", "2B295526980F475BA2A608C8C1C4F8DF");

    const fullPayload = {
      ...payload,
      authenticationCode: "2B295526980F475BA2A608C8C1C4F8DF",
    };

    console.log("Payload completo enviado para corretora:", fullPayload);

    const response = await brokerApi.post("request.php", fullPayload);

    console.log("Resposta da corretora:", response.data);

    return NextResponse.json(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro detalhado:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Falha ao criar conta na corretora",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
