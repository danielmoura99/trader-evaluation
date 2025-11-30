/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/auth/btg/authorize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/services/btg-auth-service";

/**
 * Endpoint para iniciar o fluxo de autenticação OAuth2 com BTG
 *
 * Acesse: https://seu-dominio.com/api/auth/btg/authorize
 * Será redirecionado para o BTG para autorizar
 * Depois volta para /api/auth/btg/callback
 */
export async function GET(req: NextRequest) {
  try {
    const authUrl = getAuthorizationUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
