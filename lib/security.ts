import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

type ApiKeyValidationResult = {
  ok: boolean;
  token: string | null;
};

export async function requireAdminSession() {
  const session = await requireAuthenticatedSession();

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return session;
}

export async function requireAuthenticatedSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function ensureAuthenticatedApiAccess() {
  try {
    await requireAuthenticatedSession();
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function ensureAdminApiAccess() {
  try {
    await requireAdminSession();
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim() || null;
}

export function validateBearerApiKey(
  request: Request,
  expected: string | undefined
): ApiKeyValidationResult {
  const token = extractBearerToken(request);

  if (!token || !expected) {
    return { ok: false, token };
  }

  return {
    ok: timingSafeEqual(token, expected),
    token,
  };
}

export function timingSafeEqual(
  provided: string | undefined,
  expected: string | undefined
) {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export function isSafeAssetFileName(fileName: string) {
  return /^[A-Za-z0-9._-]+$/.test(fileName);
}
