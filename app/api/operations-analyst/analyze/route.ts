/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/operations-analyst/analyze/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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
  riskLevel: "safe" | "warning" | "violation"; // Novo campo para nível de risco
}

interface Violation {
  date: string;
  result: number;
  netResult: number;
  percentOfGoal: number;
  type: "warning" | "violation"; // Novo campo para tipo
}

// Tipagem para as linhas do Excel
type ExcelRow = (string | number | Date | null | undefined)[];

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

  return 0; // Se não for WIN nem WDO, custo zero
}

/**
 * Determina o nível de risco baseado no percentual da meta
 */
function calculateRiskLevel(
  percentOfGoal: number
): "safe" | "warning" | "violation" {
  const absPercent = Math.abs(percentOfGoal);

  if (absPercent <= 30) {
    return "safe";
  } else if (absPercent <= 35) {
    return "warning"; // Zona amarela: 30-35%
  } else {
    return "violation"; // Zona vermelha: >35%
  }
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
    const dailyLimit = planGoal * 0.3; // 30% da meta

    console.log("[Operations Analyst] Meta do plano:", planGoal);
    console.log("[Operations Analyst] Limite diário:", dailyLimit);

    // Ler arquivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {
      cellStyles: true,
      cellFormula: true, // Corrigido: cellFormula em vez de cellFormulas
      cellDates: true,
      cellNF: true,
      sheetStubs: true,
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as ExcelRow[];

    // Encontrar onde começam os dados (depois dos headers)
    let dataStartIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (Array.isArray(row) && row[0] === "Subconta") {
        dataStartIndex = i + 1;
        break;
      }
    }

    if (dataStartIndex === -1) {
      return Response.json(
        {
          success: false,
          error:
            "Formato de arquivo inválido. Não foi possível encontrar os headers esperados.",
        },
        { status: 400 }
      );
    }

    console.log("[Operations Analyst] Dados começam na linha:", dataStartIndex);

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

    for (let i = dataStartIndex; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row[2] && row[13] !== undefined) {
        // row[1] = ativo, row[2] = data de abertura, row[5] = qtd compra, row[6] = qtd venda, row[13] = resultado da operação
        const dateValue = row[2];
        const asset = String(row[1] || "");
        const qtdCompra =
          typeof row[5] === "number" ? row[5] : parseFloat(String(row[5])) || 0;
        const qtdVenda =
          typeof row[6] === "number" ? row[6] : parseFloat(String(row[6])) || 0;
        const resultadoRaw = row[13];
        const resultado =
          typeof resultadoRaw === "number"
            ? resultadoRaw
            : parseFloat(String(resultadoRaw)) || 0;

        // Quantidade é o maior valor entre compra e venda (já que uma operação pode ser só compra ou só venda)
        const quantity = Math.max(qtdCompra, qtdVenda);

        // Calcular custo da operação
        const cost = calculateTradingCost(asset, quantity);

        // Converter para data
        let dateKey: string;
        try {
          if (dateValue instanceof Date) {
            dateKey = dateValue.toISOString().split("T")[0];
          } else if (typeof dateValue === "string") {
            dateKey = new Date(dateValue).toISOString().split("T")[0];
          } else {
            continue; // Pular linha se não conseguir converter a data
          }
        } catch (error) {
          console.warn(
            "[Operations Analyst] Erro ao converter data:",
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
          `[Operations Analyst] Trade: ${asset} | Qtd: ${quantity} | Resultado: R${resultado} | Custo: R${cost.toFixed(2)}`
        );
      }
    }

    // Calcular métricas
    const dailyResults: DailyResult[] = [];
    const violations: Violation[] = [];
    const warnings: Violation[] = [];
    let totalResult = 0;
    let totalCosts = 0;

    // Converter Map.entries() para Array para compatibilidade
    const mapEntries = Array.from(datesMap.entries());

    for (const [date, data] of mapEntries) {
      const netResult = data.totalResult - data.totalCosts;
      const percentOfGoal = (Math.abs(netResult) / planGoal) * 100;
      const riskLevel = calculateRiskLevel(percentOfGoal);

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

      // Categorizar violações e avisos
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

    // Calcular validações - apenas violações (>35%) eliminam
    const totalNetResult = totalResult - totalCosts;
    const daysOperated = dailyResults.length;
    const minimumDays = daysOperated >= 10;
    const totalGoalReached = totalNetResult >= planGoal;
    const dailyLimitRespected = violations.length === 0; // Apenas violações reais eliminam
    const approved = minimumDays && totalGoalReached && dailyLimitRespected;

    console.log("[Operations Analyst] Resultado da análise:", {
      daysOperated,
      totalResult,
      totalCosts,
      totalNetResult,
      violations: violations.length,
      warnings: warnings.length,
      approved,
    });

    // Buscar dados do cliente no banco de dados
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

    // Se não encontrar na tabela principal, buscar em MGC clients
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

    // Se não encontrar, usar dados padrão (fallback)
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
      warnings, // Novo campo para avisos
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
