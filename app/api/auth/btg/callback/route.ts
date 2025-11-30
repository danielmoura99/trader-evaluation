/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/auth/btg/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/services/btg-auth-service";
import { prisma } from "@/lib/prisma";

/**
 * Callback do OAuth2 do BTG
 *
 * O BTG redireciona para cá com o code
 * Trocamos o code por access_token e refresh_token
 * Salvamos no banco para uso futuro
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        { error: `BTG OAuth Error: ${error}` },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code received" },
        { status: 400 }
      );
    }

    // Trocar code por tokens
    const tokens = await exchangeCodeForToken(code);

    // TODO: Salvar tokens no banco
    // Por enquanto, apenas retornar (você precisa criar um model BTGToken)
    console.log("[BTG Auth] Tokens received:");
    console.log("Access Token:", tokens.access_token.substring(0, 20) + "...");
    console.log(
      "Refresh Token:",
      tokens.refresh_token?.substring(0, 20) + "..."
    );
    console.log("Expires in:", tokens.expires_in, "seconds");

    // Retornar página de sucesso
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BTG - Autenticação Concluída</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
          }
          h1 { color: #28a745; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .token-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
          }
          .success { color: #28a745; font-weight: 600; }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Autenticação BTG Concluída!</h1>
          <p class="success">Tokens OAuth2 recebidos com sucesso!</p>

          <div class="token-box">
            <strong>Access Token:</strong><br>
            ${tokens.access_token}<br><br>

            <strong>Refresh Token:</strong><br>
            ${tokens.refresh_token || "N/A"}<br><br>

            <strong>Expires In:</strong><br>
            ${tokens.expires_in} segundos (${Math.floor(tokens.expires_in / 3600)} horas)<br><br>

            <strong>Scope:</strong><br>
            ${tokens.scope}
          </div>

          <div class="warning">
            ⚠️ <strong>IMPORTANTE:</strong> Salve o <code>refresh_token</code> no banco de dados!
            Ele será usado para renovar o <code>access_token</code> automaticamente.
            <br><br>
            Consulte o arquivo <code>BTG_PIX_SETUP.md</code> para instruções de como
            criar o modelo <code>BTGToken</code> no Prisma.
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #999;">
            Você pode fechar esta janela.
          </p>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error: any) {
    console.error("[BTG Auth] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to exchange authorization code",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
