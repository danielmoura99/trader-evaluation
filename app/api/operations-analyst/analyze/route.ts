/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/operations-analyst/analyze/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const PLAN_GOALS = {
  "TC - 50K": 1000,
  "TC - 100K": 2000,
  "TC - 250K": 4200,
  "TC - 500K": 9000,
} as const;

// Custos por contrato
const TRADING_COSTS = {
  WIN: 1.36,
  WDO: 2.78,
} as const;

interface DailyResult {
  date: string;
  operations: number;
  result: number;
  costs: number;
  netResult: number;
  percentOfGoal: number;
  riskLevel: "safe" | "warning" | "violation";
}

interface Violation {
  date: string;
  result: number;
  netResult: number;
  percentOfGoal: number;
  type: "warning" | "violation";
}

interface CSVRow {
  Subconta?: string;
  Ativo?: string;
  Abertura?: string;
  Fechamento?: string;
  "Tempo Operação"?: string;
  "Qtd Compra"?: string;
  "Qtd Venda"?: string;
  Lado?: string;
  "Preço Compra"?: string;
  "Preço Venda"?: string;
  "Preço de Mercado"?: string;
  "Res. Intervalo"?: string;
  "Res. Intervalo (%)"?: string;
  "Número Operação"?: string;
  "Res. Operação"?: string;
  "Res. Operação (%)"?: string;
  TET?: string;
  Total?: string;
}

/**
 * ✅ FUNÇÃO PARA NORMALIZAR HEADERS COM PROBLEMAS DE ENCODING
 */
function normalizeCSVHeaders(headers: string[]): string[] {
  const headerMap: Record<string, string> = {
    "Tempo Opera��o": "Tempo Operação",
    "Pre�o Compra": "Preço Compra",
    "Pre�o Venda": "Preço Venda",
    "Pre�o de Mercado": "Preço de Mercado",
    "N�mero Opera��o": "Número Operação",
    "Res. Opera��o": "Res. Operação",
    "Res. Opera��o (%)": "Res. Operação (%)",
    Subconta: "Subconta",
    Ativo: "Ativo",
    Abertura: "Abertura",
    Fechamento: "Fechamento",
    "Qtd Compra": "Qtd Compra",
    "Qtd Venda": "Qtd Venda",
    Lado: "Lado",
    "Res. Intervalo": "Res. Intervalo",
    "Res. Intervalo (%)": "Res. Intervalo (%)",
    TET: "TET",
    Total: "Total",
  };

  return headers.map((header) => {
    const trimmedHeader = header.trim();
    return headerMap[trimmedHeader] || trimmedHeader;
  });
}

/**
 * ✅ FUNÇÃO PARSECSV (mantida igual)
 */
function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split("\n");

  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Subconta") && lines[i].includes("Ativo")) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex === -1) {
    throw new Error(
      "Formato de arquivo inválido. Não foi possível encontrar o cabeçalho das operações."
    );
  }

  const headerLine = lines[headerLineIndex];
  const rawHeaders = headerLine.split(";").map((h) => h.trim());
  const headers = normalizeCSVHeaders(rawHeaders);

  console.log("[CSV Parser] Headers normalizados:", headers);

  const dataLines = lines
    .slice(headerLineIndex + 1)
    .filter((line) => line.trim() !== "");
  const parsedData: CSVRow[] = [];

  for (const line of dataLines) {
    const values = line.split(";");
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      if (values[index] !== undefined) {
        row[header as keyof CSVRow] = values[index]?.trim();
      }
    });

    if (row.Subconta && row.Ativo && row.Abertura && row["Res. Operação"]) {
      parsedData.push(row);
      console.log(
        `[CSV Parser] Operação: ${row.Ativo} em ${row.Abertura} = R$ ${row["Res. Operação"]}`
      );
    }
  }

  return parsedData;
}

/**
 * ✅ FUNÇÃO FINAL CORRIGIDA: Parse de data brasileira com timezone correto
 */
function fixDateFormatting(
  dateValue: Date | string | number | null | undefined
): string | null {
  if (!dateValue) return null;

  try {
    let baseDate: Date;

    if (dateValue instanceof Date) {
      baseDate = new Date(dateValue);
    } else if (typeof dateValue === "string") {
      // ✅ Parse manual para formato brasileiro DD/MM/YYYY

      // Extrair parte da data (antes do espaço se houver horário)
      const [datePart] = dateValue.split(" ");

      // Verificar se está no formato DD/MM/YYYY
      if (datePart.includes("/")) {
        const [day, month, year] = datePart.split("/");

        // Validar se os componentes existem
        if (!day || !month || !year) {
          console.warn("[Date Fix] Formato de data inválido:", dateValue);
          return null;
        }

        // ✅ CORREÇÃO CRÍTICA: Usar construtor com parâmetros (timezone local)
        // Mês é 0-indexed, então maio = 4
        baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        console.log(
          `[Date Fix] Parse brasileiro: ${datePart} -> Date(${year}, ${parseInt(month) - 1}, ${day}) -> ${baseDate.toLocaleDateString("pt-BR")}`
        );
      } else {
        // Fallback para outros formatos
        baseDate = new Date(dateValue);
      }
    } else if (typeof dateValue === "number") {
      // Para serial dates do Excel
      baseDate = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
      return null;
    }

    // Verificar se a data é válida
    if (isNaN(baseDate.getTime())) {
      console.warn("[Date Fix] Data inválida após parse:", dateValue);
      return null;
    }

    // ✅ USAR A DATA PARSEADA DIRETAMENTE (sem correções adicionais)
    const finalDate = baseDate;

    // Formatar para YYYY-MM-DD
    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, "0");
    const day = String(finalDate.getDate()).padStart(2, "0");

    const dateKey = `${year}-${month}-${day}`;

    console.log(
      `[Date Fix] Final: ${dateValue} -> ${dateKey} (${finalDate.toLocaleDateString("pt-BR")})`
    );
    return dateKey;
  } catch (error) {
    console.warn("[Date Fix] Erro ao processar data:", dateValue, error);
    return null;
  }
}

/**
 * Calcula o custo de uma operação baseado no ativo e quantidade
 */
function calculateTradingCost(asset: string, quantity: number): number {
  const assetUpper = asset?.toUpperCase() || "";

  if (assetUpper.startsWith("WIN")) {
    return quantity * TRADING_COSTS.WIN;
  } else if (assetUpper.startsWith("WDO")) {
    return quantity * TRADING_COSTS.WDO;
  }

  return 0;
}

/**
 * ✅ FUNÇÃO CORRIGIDA: Determina o nível de risco (apenas positivos > 30%)
 */
function calculateRiskLevel(
  percentOfGoal: number,
  netResult: number
): "safe" | "warning" | "violation" {
  if (netResult < 0) {
    return "safe";
  }

  const absPercent = Math.abs(percentOfGoal);

  if (absPercent <= 30) {
    return "safe";
  } else if (absPercent <= 35) {
    return "warning";
  } else {
    return "violation";
  }
}

/**
 * ✅ FUNÇÃO: Converter valores CSV para números
 */
function parseCSVNumber(value: string | undefined): number {
  if (!value || value === "") return 0;

  const cleanValue = value
    .replace(/\./g, "") // Remove pontos de milhares
    .replace(",", ".") // Converte vírgula decimal para ponto
    .replace(/\r/g, ""); // Remove carriage return

  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
}

export async function POST(req: NextRequest) {
  try {
    console.log("[Operations Analyst] Iniciando análise...");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string;
    const planGoalStr = formData.get("planGoal") as string;

    if (!file || !clientId || !planGoalStr) {
      return Response.json(
        {
          success: false,
          error: "Dados obrigatórios não fornecidos",
        },
        { status: 400 }
      );
    }

    const planGoal = parseFloat(planGoalStr);
    const dailyLimit = planGoal * 0.3;

    console.log("[Operations Analyst] Meta do plano:", planGoal);
    console.log("[Operations Analyst] Limite diário:", dailyLimit);

    // LER ARQUIVO CSV
    const csvContent = await file.text();
    console.log(
      "[Operations Analyst] Arquivo CSV lido, tamanho:",
      csvContent.length
    );

    // PARSE DO CSV
    let csvData: CSVRow[];
    try {
      csvData = parseCSV(csvContent);
      console.log(
        "[Operations Analyst] Operações encontradas:",
        csvData.length
      );
    } catch (error) {
      console.error("[Operations Analyst] Erro ao processar CSV:", error);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Formato de arquivo CSV inválido",
        },
        { status: 400 }
      );
    }

    if (csvData.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Nenhuma operação encontrada no arquivo CSV",
        },
        { status: 400 }
      );
    }

    // Processar operações e agrupar por dia
    const datesMap = new Map<
      string,
      {
        operations: number;
        totalResult: number;
        totalCosts: number;
        trades: Array<{
          asset: string;
          quantity: number;
          result: number;
          cost: number;
        }>;
      }
    >();

    // PROCESSAR DADOS DO CSV
    for (const row of csvData) {
      if (row.Abertura && row["Res. Operação"]) {
        const dateValue = row.Abertura;
        const asset = row.Ativo || "";
        const qtdCompra = parseCSVNumber(row["Qtd Compra"]);
        const qtdVenda = parseCSVNumber(row["Qtd Venda"]);
        const resultado = parseCSVNumber(row["Res. Operação"]);

        const quantity = Math.max(qtdCompra, qtdVenda);
        const cost = calculateTradingCost(asset, quantity);

        // ✅ USAR FUNÇÃO CORRIGIDA COM TIMEZONE BRASILEIRO
        const dateKey = fixDateFormatting(dateValue);

        if (!dateKey) {
          console.warn(
            "[Operations Analyst] Não foi possível processar data:",
            dateValue
          );
          continue;
        }

        if (!datesMap.has(dateKey)) {
          datesMap.set(dateKey, {
            operations: 0,
            totalResult: 0,
            totalCosts: 0,
            trades: [],
          });
        }

        const dayData = datesMap.get(dateKey)!;
        dayData.operations++;
        dayData.totalResult += resultado;
        dayData.totalCosts += cost;
        dayData.trades.push({
          asset,
          quantity,
          result: resultado,
          cost,
        });

        console.log(
          `[Operations Analyst] Trade: ${asset} | Data: ${dateKey} | Qtd: ${quantity} | Resultado: R${resultado}`
        );
      }
    }

    // CALCULAR MÉTRICAS
    const dailyResults: DailyResult[] = [];
    const violations: Violation[] = [];
    const warnings: Violation[] = [];
    let totalResult = 0;
    let totalCosts = 0;

    const mapEntries = Array.from(datesMap.entries());

    for (const [date, data] of mapEntries) {
      const netResult = data.totalResult - data.totalCosts;
      const percentOfGoal = (Math.abs(netResult) / planGoal) * 100;
      const riskLevel = calculateRiskLevel(percentOfGoal, netResult);

      dailyResults.push({
        date,
        operations: data.operations,
        result: data.totalResult,
        costs: data.totalCosts,
        netResult,
        percentOfGoal,
        riskLevel,
      });

      totalResult += data.totalResult;
      totalCosts += data.totalCosts;

      if (riskLevel === "violation") {
        violations.push({
          date,
          result: data.totalResult,
          netResult,
          percentOfGoal,
          type: "violation",
        });
      } else if (riskLevel === "warning") {
        warnings.push({
          date,
          result: data.totalResult,
          netResult,
          percentOfGoal,
          type: "warning",
        });
      }
    }

    // Ordenar resultados diários por data
    dailyResults.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calcular validações
    const totalNetResult = totalResult - totalCosts;
    const daysOperated = dailyResults.length;
    const minimumDays = daysOperated >= 10;
    const totalGoalReached = totalNetResult >= planGoal;
    const dailyLimitRespected = violations.length === 0;
    const approved = minimumDays && totalGoalReached && dailyLimitRespected;

    console.log("[Operations Analyst] Resultado da análise:", {
      daysOperated,
      totalResult,
      totalCosts,
      totalNetResult,
      violations: violations.length,
      warnings: warnings.length,
      approved,
      timezoneFixed: true, // ✅ Indicador de que timezone foi corrigido
      expectedDays: 10, // ✅ Esperamos 10 dias únicos para o arquivo do Fabio
    });

    // Buscar dados do cliente (código existente permanece igual)
    let client = await prisma.client.findFirst({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        cpf: true,
        plan: true,
        platform: true,
      },
    });

    if (!client) {
      const mgcClient = await prisma.mgcClient.findFirst({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          cpf: true,
          plan: true,
          platform: true,
        },
      });

      if (mgcClient) {
        client = mgcClient;
      }
    }

    if (!client) {
      client = {
        id: clientId,
        name: "Cliente",
        cpf: "000.000.000-00",
        plan: "TC - 50K",
        platform: "Profit One",
      };
    }

    const analysis = {
      client,
      metrics: {
        daysOperated,
        dailyResults,
        totalResult,
        totalCosts,
        totalNetResult,
        goalAmount: planGoal,
      },
      validation: {
        minimumDays,
        totalGoalReached,
        dailyLimitRespected,
        approved,
      },
      violations,
      warnings,
    };

    return Response.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("[Operations Analyst] Erro crítico na análise:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
