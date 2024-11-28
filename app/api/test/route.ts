// app/api/test/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const response = await fetch("https://api.ipify.org?format=json");
  const data = await response.json();

  return NextResponse.json({
    ip: data.ip,
    headers: Object.fromEntries(req.headers),
    env: {
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      hasToken: !!process.env.BROKER_TOKEN,
    },
  });
}
