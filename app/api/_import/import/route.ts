import { NextResponse } from "next/server";
import { importClients } from "@/utils/import-data";
import { ensureAuthenticatedApiAccess } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const accessDenied = await ensureAuthenticatedApiAccess();
    if (accessDenied) {
      return accessDenied;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo fornecido" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const result = await importClients(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na importacao:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao processar arquivo",
      },
      { status: 500 }
    );
  }
}
