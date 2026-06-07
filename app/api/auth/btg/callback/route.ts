// app/api/auth/btg/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/services/btg-auth-service";
import { ensureAdminApiAccess } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const accessDenied = await ensureAdminApiAccess();
    if (accessDenied) {
      return accessDenied;
    }

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

    const tokens = await exchangeCodeForToken(code);
    console.log("[BTG Auth] Tokens OAuth2 recebidos com sucesso");

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>BTG - Autenticacao Concluida</title>
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
          <h1>Autenticacao BTG concluida</h1>
          <p>Os tokens OAuth2 foram recebidos com sucesso.</p>

          <div class="warning">
            <strong>Importante:</strong> Os tokens foram omitidos da tela por seguranca.
            Salve o <code>refresh_token</code> com criptografia no banco e nunca exponha
            o <code>access_token</code> em logs ou interfaces.
            <br><br>
            Expires in: ${tokens.expires_in} segundos
            <br>
            Scope: ${tokens.scope}
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #999;">
            Voce pode fechar esta janela.
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
  } catch (error) {
    console.error("[BTG Auth] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to exchange authorization code",
        message: "Confira os logs do servidor para detalhes internos.",
      },
      { status: 500 }
    );
  }
}
