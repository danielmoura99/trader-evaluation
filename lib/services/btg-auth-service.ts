// lib/services/btg-auth-service.ts

/**
 * Serviço de autenticação OAuth2 para BTG Pactual
 *
 * Documentação: https://developers.empresas.btgpactual.com/docs/authorization-code
 *
 * IMPORTANTE: O fluxo Client Credentials NÃO funciona para APIs Banking/PIX
 * É necessário usar Authorization Code flow para PIX cobrança
 */

const BTG_AUTH_URL = "https://id.btgpactual.com";
const BTG_CLIENT_ID = process.env.BTG_CLIENT_ID;
const BTG_CLIENT_SECRET = process.env.BTG_CLIENT_SECRET;
const BTG_REDIRECT_URI = process.env.BTG_REDIRECT_URI;

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

let cachedToken: {
  access_token: string;
  expires_at: number;
} | null = null;

/**
 * Gera URL de autorização para o fluxo Authorization Code
 * O usuário deve ser redirecionado para esta URL para autorizar o acesso
 */
export function getAuthorizationUrl(): string {
  const scope = "openid empresas.btgpactual.com/pix-cash-in";
  const params = new URLSearchParams({
    client_id: BTG_CLIENT_ID!,
    response_type: "code",
    redirect_uri: BTG_REDIRECT_URI!,
    scope,
    prompt: "login",
  });

  return `${BTG_AUTH_URL}/oauth2/authorize?${params.toString()}`;
}

/**
 * Troca o authorization code por um access token
 * Chamado após o redirect do BTG com o code
 */
export async function exchangeCodeForToken(
  authorizationCode: string
): Promise<TokenResponse> {
  const auth = Buffer.from(`${BTG_CLIENT_ID}:${BTG_CLIENT_SECRET}`).toString(
    "base64"
  );

  const params = new URLSearchParams({
    code: authorizationCode,
    redirect_uri: BTG_REDIRECT_URI!,
    grant_type: "authorization_code",
  });

  const response = await fetch(`${BTG_AUTH_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BTG Auth Error: ${response.status} - ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Cache do token
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return data;
}

/**
 * Atualiza o token usando refresh_token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const auth = Buffer.from(`${BTG_CLIENT_ID}:${BTG_CLIENT_SECRET}`).toString(
    "base64"
  );

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(`${BTG_AUTH_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BTG Refresh Token Error: ${response.status} - ${error}`);
  }

  const data: TokenResponse = await response.json();

  // Atualiza cache
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return data;
}

/**
 * Retorna o access token válido (usa cache se disponível)
 * NOTA: Esta função assume que você já tem um token salvo no banco
 * Você precisa implementar storage do token (refresh_token) no banco
 */
export async function getValidAccessToken(): Promise<string> {
  // Se tem token em cache e não expirou
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  // TODO: Buscar refresh_token do banco e renovar
  // Por enquanto, retorna erro
  throw new Error(
    "No valid access token. Need to re-authenticate using Authorization Code flow."
  );
}

/**
 * Salva o token no cache manualmente (útil para testes ou após autenticação)
 */
export function setAccessToken(accessToken: string, expiresIn: number): void {
  cachedToken = {
    access_token: accessToken,
    expires_at: Date.now() + expiresIn * 1000,
  };
}
