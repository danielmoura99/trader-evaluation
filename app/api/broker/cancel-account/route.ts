// app/api/broker/cancel-account/route.ts
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
    console.log("Payload de cancelamento recebido:", payload);

    const brokerPayload = {
      request: "prop_trading_cancel_user_subscription",
      document: payload.document,
      subscriptionPlanId: payload.subscriptionPlanId,
      testAccount: payload.testAccount,
      authenticationCode: "2B295526980F475BA2A608C8C1C4F8DF",
    };

    console.log("Enviando cancelamento para corretora:", brokerPayload);

    const response = await brokerApi.post("request.php", brokerPayload);

    console.log("Resposta da corretora:", response.data);

    return NextResponse.json(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro ao cancelar conta:", error.response?.data || error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao cancelar conta na corretora",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
