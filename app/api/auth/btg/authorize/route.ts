// app/api/auth/btg/authorize/route.ts
import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/services/btg-auth-service";
import { ensureAdminApiAccess } from "@/lib/security";

export async function GET() {
  try {
    const accessDenied = await ensureAdminApiAccess();
    if (accessDenied) {
      return accessDenied;
    }

    const authUrl = getAuthorizationUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}
