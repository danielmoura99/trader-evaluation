/* eslint-disable @typescript-eslint/no-unused-vars */
// utils/operations-analyzer.ts
import * as XLSX from "xlsx";

export const PLAN_GOALS = {
  "TC - 50K": 1000,
  "TC - 100K": 2000,
  "TC - 250K": 4200,
  "TC - 500K": 9000,
} as const;

// Custos por contrato
export const TRADING_COSTS = {
  WIN: 1.36,
  WDO: 2.78,
} as const;

export interface DailyResult {
  date: string;
  operations: number;
  result: number;
  costs: number;
  netResult: number;
  percentOfGoal: number;
  riskLevel: "safe" | "warning" | "violation";
}

export interface Violation {
  date: string;
  result: number;
  netResult: number;
  percentOfGoal: number;
  type: "warning" | "violation";
}

export interface AnalysisMetrics {
  daysOperated: number;
  dailyResults: DailyResult[];
  totalResult: number;
  totalCosts: number;
  totalNetResult: number;
  goalAmount: number;
}

export interface ValidationResult {
  minimumDays: boolean;
  totalGoalReached: boolean;
  dailyLimitRespected: boolean;
  approved: boolean;
}

export interface OperationsAnalysis {
  metrics: AnalysisMetrics;
  validation: ValidationResult;
  violations: Violation[];
  warnings: Violation[];
}

// Tipagem para as linhas do Excel
type ExcelRow = (string | number | Date | null | undefined)[];

/**
 * Calcula o custo de uma operação baseado no ativo e quantidade
 */
export function calculateTradingCost(asset: string, quantity: number): number {
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
export function calculateRiskLevel(
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

/**
 * Analisa um arquivo Excel de operações e calcula as métricas
 */
export function analyzeOperationsFile(
  buffer: ArrayBuffer,
  planGoal: number
): OperationsAnalysis {
  const dailyLimit = planGoal * 0.3; // 30% da meta

  // Ler arquivo Excel
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
    throw new Error(
      "Formato de arquivo inválido. Não foi possível encontrar os headers esperados."
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

      // Quantidade é o maior valor entre compra e venda
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
        console.warn("Erro ao converter data:", dateValue);
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

  return {
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
}
/**
 * Formata um valor monetário em reais
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata um percentual
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Retorna a cor apropriada para um resultado
 */
export function getResultColor(value: number): string {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-zinc-400";
}

/**
 * Valida se um arquivo é um Excel válido
 */
export function validateExcelFile(file: File): boolean {
  const validExtensions = [".xlsx", ".xls"];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  return validExtensions.includes(fileExtension);
}
