import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
//import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

interface Client {
  id: string;
  name: string;
  cpf: string;
  plan: string;
  platform: string;
}

interface AnalysisResult {
  client: Client;
  metrics: {
    daysOperated: number;
    dailyResults: Array<{
      date: string;
      operations: number;
      result: number;
      costs: number;
      netResult: number;
      percentOfGoal: number;
      riskLevel: "safe" | "warning" | "violation";
      adjusted?: boolean;
    }>;
    totalResult: number;
    totalCosts: number;
    totalNetResult: number;
    goalAmount: number;
  };
  validation: {
    minimumDays: boolean;
    totalGoalReached: boolean;
    dailyLimitRespected: boolean;
    approved: boolean;
  };
  violations: Array<{
    date: string;
    result: number;
    netResult: number;
    percentOfGoal: number;
    type: "warning" | "violation";
  }>;
  warnings: Array<{
    date: string;
    result: number;
    netResult: number;
    percentOfGoal: number;
    type: "warning" | "violation";
  }>;
}

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  const { client, metrics, validation, violations, warnings } = result;
  const [analysisScenario, setAnalysisScenario] = useState<1 | 2 | 3>(1);

  // Calcular métricas baseadas no cenário selecionado
  const scenarioMetrics = useMemo(() => {
    const thirtyPercentLimit = metrics.goalAmount * 0.3; // 30% da meta
    const thirtyFivePercentLimit = metrics.goalAmount * 0.35; // 35% da meta

    let adjustedResults = [...metrics.dailyResults];
    let totalNetResult = 0;
    let daysConsidered = 0;
    let adjustmentInfo = "";

    switch (analysisScenario) {
      case 1:
        // Cenário 1: Análise completa (original)
        totalNetResult = metrics.totalNetResult;
        daysConsidered = metrics.daysOperated;
        adjustmentInfo = "Todos os dias incluídos na análise";
        break;

      case 2:
        // Cenário 2: Limitar dias >30% ao máximo de 30%
        adjustedResults = metrics.dailyResults.map((day) => {
          const absNetResult = Math.abs(day.netResult);
          if (absNetResult > thirtyPercentLimit) {
            // Limitar ao máximo de 30% da meta, mantendo o sinal
            const limitedResult =
              day.netResult >= 0 ? thirtyPercentLimit : -thirtyPercentLimit;
            return { ...day, netResult: limitedResult, adjusted: true };
          }
          return { ...day, adjusted: false };
        });

        totalNetResult = adjustedResults.reduce(
          (sum, day) => sum + day.netResult,
          0
        );
        daysConsidered = adjustedResults.length;
        adjustmentInfo = `Dias >30% limitados a R$ ${thirtyPercentLimit.toFixed(0)}`;
        break;

      case 3:
        // Cenário 3: Remover completamente dias >35%
        adjustedResults = metrics.dailyResults
          .filter((day) => {
            const absNetResult = Math.abs(day.netResult);
            return absNetResult <= thirtyFivePercentLimit;
          })
          .map((day) => ({ ...day, adjusted: false }));

        totalNetResult = adjustedResults.reduce(
          (sum, day) => sum + day.netResult,
          0
        );
        daysConsidered = adjustedResults.length;
        const removedDays = metrics.daysOperated - daysConsidered;
        adjustmentInfo = `${removedDays} dia(s) >35% removido(s) da análise`;
        break;
    }

    // Recalcular validações baseadas no cenário
    const adjustedValidation = {
      minimumDays: daysConsidered >= 10,
      totalGoalReached: totalNetResult >= metrics.goalAmount,
      dailyLimitRespected: validation.dailyLimitRespected, // Mantém a validação original
      approved:
        daysConsidered >= 10 &&
        totalNetResult >= metrics.goalAmount &&
        validation.dailyLimitRespected,
    };

    return {
      adjustedResults,
      totalNetResult,
      daysConsidered,
      adjustmentInfo,
      validation: adjustedValidation,
    };
  }, [analysisScenario, metrics, validation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getResultColor = (value: number) => {
    if (value > 0) return "text-green-400";
    if (value < 0) return "text-red-400";
    return "text-zinc-400";
  };

  const downloadReport = () => {
    // Gerar relatório em PDF
    const reportContent = generateReportContent();
    downloadPDF(
      reportContent,
      `Relatorio_${client.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const generateReportContent = () => {
    const reportData = {
      client,
      metrics,
      validation,
      violations,
      warnings,
      generatedAt: new Date().toLocaleString("pt-BR"),
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório de Análise - ${client.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .result { font-size: 24px; font-weight: bold; color: ${validation.approved ? "#22c55e" : "#ef4444"}; }
        .section { margin-bottom: 25px; }
        .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .metric { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .safe { background-color: #dcfce7; }
        .warning { background-color: #fef3c7; }
        .violation { background-color: #fecaca; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Análise de Operações</h1>
        <h2>Traders House</h2>
        <div class="result">${validation.approved ? "APROVADO" : "REPROVADO"}</div>
        <p><strong>Cliente:</strong> ${client.name}</p>
        <p><strong>CPF:</strong> ${client.cpf}</p>
        <p><strong>Plano:</strong> ${client.plan}</p>
        <p><strong>Data:</strong> ${reportData.generatedAt}</p>
    </div>

    <div class="section">
        <h3>Resumo das Métricas</h3>
        <div class="metrics">
            <div class="metric">
                <strong>Dias Operados:</strong> ${metrics.daysOperated}<br>
                <small>Mínimo necessário: 10 dias</small>
            </div>
            <div class="metric">
                <strong>Resultado Bruto:</strong> ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalResult)}<br>
                <small>Antes dos custos</small>
            </div>
            <div class="metric">
                <strong>Custos Totais:</strong> ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalCosts)}<br>
                <small>WIN + WDO</small>
            </div>
            <div class="metric">
                <strong>Resultado Líquido:</strong> ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalNetResult)}<br>
                <small>Meta: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.goalAmount)}</small>
            </div>
            <div class="metric">
                <strong>% da Meta:</strong> ${((metrics.totalNetResult / metrics.goalAmount) * 100).toFixed(1)}%<br>
                <small>Necessário: 100%</small>
            </div>
            <div class="metric">
                <strong>Violações:</strong> ${violations.length}<br>
                <small>>35% da meta (elimina)</small>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>Status das Validações</h3>
        <ul>
            <li><strong>Mínimo 10 dias:</strong> ${validation.minimumDays ? "✅ Aprovado" : "❌ Reprovado"} (${metrics.daysOperated} dias)</li>
            <li><strong>Meta atingida:</strong> ${validation.totalGoalReached ? "✅ Aprovado" : "❌ Reprovado"} (${((metrics.totalNetResult / metrics.goalAmount) * 100).toFixed(1)}%)</li>
            <li><strong>Limite diário:</strong> ${validation.dailyLimitRespected ? "✅ Aprovado" : "❌ Reprovado"} (${violations.length} violação${violations.length !== 1 ? "ões" : ""})</li>
        </ul>
    </div>

    ${
      warnings.length > 0
        ? `
    <div class="section">
        <h3>Dias de Atenção (30-35% da meta)</h3>
        <table class="table">
            <tr><th>Data</th><th>Resultado Líquido</th><th>% da Meta</th></tr>
            ${warnings
              .map(
                (w) => `
            <tr class="warning">
                <td>${new Date(w.date).toLocaleDateString("pt-BR")}</td>
                <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.netResult)}</td>
                <td>${Math.abs(w.percentOfGoal).toFixed(1)}%</td>
            </tr>
            `
              )
              .join("")}
        </table>
    </div>
    `
        : ""
    }

    ${
      violations.length > 0
        ? `
    <div class="section">
        <h3>Violações Eliminatórias (>35% da meta)</h3>
        <table class="table">
            <tr><th>Data</th><th>Resultado Líquido</th><th>% da Meta</th></tr>
            ${violations
              .map(
                (v) => `
            <tr class="violation">
                <td>${new Date(v.date).toLocaleDateString("pt-BR")}</td>
                <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v.netResult)}</td>
                <td>${Math.abs(v.percentOfGoal).toFixed(1)}%</td>
            </tr>
            `
              )
              .join("")}
        </table>
    </div>
    `
        : ""
    }

    <div class="section">
        <h3>Resultados Diários</h3>
        <table class="table">
            <tr>
                <th>Data</th>
                <th>Operações</th>
                <th>Resultado Bruto</th>
                <th>Custos</th>
                <th>Resultado Líquido</th>
                <th>% da Meta</th>
                <th>Status</th>
            </tr>
            ${metrics.dailyResults
              .map(
                (day) => `
            <tr class="${day.riskLevel === "violation" ? "violation" : day.riskLevel === "warning" ? "warning" : "safe"}">
                <td>${new Date(day.date).toLocaleDateString("pt-BR")}</td>
                <td>${day.operations}</td>
                <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(day.result)}</td>
                <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(day.costs)}</td>
                <td>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(day.netResult)}</td>
                <td>${Math.abs(day.percentOfGoal).toFixed(1)}%</td>
                <td>${day.riskLevel === "violation" ? "❌" : day.riskLevel === "warning" ? "⚠️" : "✅"}</td>
            </tr>
            `
              )
              .join("")}
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Análise de Operações - Traders House</p>
        <p>Data de geração: ${reportData.generatedAt}</p>
    </div>
</body>
</html>
    `;
  };

  const downloadPDF = (htmlContent: string, filename: string) => {
    // Criar um blob com o HTML
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Criar link temporário para download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(".pdf", ".html"); // Download como HTML por simplicidade
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cenário */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Cenários de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label
                className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                  analysisScenario === 1
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={1}
                  checked={analysisScenario === 1}
                  onChange={() => setAnalysisScenario(1)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      analysisScenario === 1
                        ? "border-blue-500 bg-blue-500"
                        : "border-zinc-500"
                    }`}
                  >
                    {analysisScenario === 1 && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-zinc-100">
                    Cenário 1: Análise Completa
                  </span>
                </div>
                <p className="text-sm text-zinc-400">
                  Inclui todos os dias e resultados na análise (atual)
                </p>
              </label>

              <label
                className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                  analysisScenario === 2
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={2}
                  checked={analysisScenario === 2}
                  onChange={() => setAnalysisScenario(2)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      analysisScenario === 2
                        ? "border-yellow-500 bg-yellow-500"
                        : "border-zinc-500"
                    }`}
                  >
                    {analysisScenario === 2 && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-zinc-100">
                    Cenário 2: Limite 30%
                  </span>
                </div>
                <p className="text-sm text-zinc-400">
                  Dias {">"}30% limitados ao máximo permitido (R${" "}
                  {(metrics.goalAmount * 0.3).toFixed(0)})
                </p>
              </label>

              <label
                className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                  analysisScenario === 3
                    ? "border-red-500 bg-red-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={3}
                  checked={analysisScenario === 3}
                  onChange={() => setAnalysisScenario(3)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      analysisScenario === 3
                        ? "border-red-500 bg-red-500"
                        : "border-zinc-500"
                    }`}
                  >
                    {analysisScenario === 3 && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-zinc-100">
                    Cenário 3: Remover {">"}35%
                  </span>
                </div>
                <p className="text-sm text-zinc-400">
                  Remove completamente dias {">"}35% da meta da análise
                </p>
              </label>
            </div>

            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-300">
                <strong>Ajuste aplicado:</strong>{" "}
                {scenarioMetrics.adjustmentInfo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header com resultado final */}
      <Card
        className={`border-2 ${
          scenarioMetrics.validation.approved
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-full ${
                  scenarioMetrics.validation.approved
                    ? "bg-green-500/10"
                    : "bg-red-500/10"
                }`}
              >
                {scenarioMetrics.validation.approved ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">
                  {scenarioMetrics.validation.approved
                    ? "APROVADO"
                    : "REPROVADO"}
                </h2>
                <p className="text-zinc-400">
                  Análise concluída para {client.name} - Cenário{" "}
                  {analysisScenario}
                </p>
              </div>
            </div>

            <Button
              onClick={downloadReport}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-zinc-400">Dias Considerados</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {scenarioMetrics.daysConsidered}
                </p>
                <p className="text-xs text-zinc-500">
                  {analysisScenario === 3 &&
                  scenarioMetrics.daysConsidered !== metrics.daysOperated
                    ? `Original: ${metrics.daysOperated} dias`
                    : "Mínimo: 10 dias"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-sm text-zinc-400">Resultado Bruto</p>
                <p
                  className={`text-2xl font-bold ${getResultColor(metrics.totalResult)}`}
                >
                  {formatCurrency(metrics.totalResult)}
                </p>
                <p className="text-xs text-zinc-500">Antes dos custos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-zinc-400">Custos Totais</p>
                <p className="text-2xl font-bold text-red-400">
                  -{formatCurrency(metrics.totalCosts)}
                </p>
                <p className="text-xs text-zinc-500">WIN + WDO</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-zinc-400">
                  Resultado Líquido {analysisScenario !== 1 ? "(Ajustado)" : ""}
                </p>
                <p
                  className={`text-2xl font-bold ${getResultColor(scenarioMetrics.totalNetResult)}`}
                >
                  {formatCurrency(scenarioMetrics.totalNetResult)}
                </p>
                <p className="text-xs text-zinc-500">
                  {analysisScenario !== 1 &&
                  scenarioMetrics.totalNetResult !== metrics.totalNetResult
                    ? `Original: ${formatCurrency(metrics.totalNetResult)}`
                    : `Meta: ${formatCurrency(metrics.goalAmount)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-zinc-400">% da Meta</p>
                <p
                  className={`text-2xl font-bold ${getResultColor(scenarioMetrics.totalNetResult)}`}
                >
                  {formatPercent(
                    (scenarioMetrics.totalNetResult / metrics.goalAmount) * 100
                  )}
                </p>
                <p className="text-xs text-zinc-500">Necessário: 100%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-zinc-400">Violações</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {violations.length}
                </p>
                <p className="text-xs text-zinc-500">
                  {">"}35% da meta (elimina)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-zinc-400">Avisos</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {warnings.length}
                </p>
                <p className="text-xs text-zinc-500">
                  30-35% da meta (atenção)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das validações */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Status das Validações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {scenarioMetrics.validation.minimumDays ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-zinc-200">Mínimo de 10 dias operados</span>
            </div>
            <Badge
              variant={
                scenarioMetrics.validation.minimumDays
                  ? "default"
                  : "destructive"
              }
            >
              {scenarioMetrics.daysConsidered} dias
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {scenarioMetrics.validation.totalGoalReached ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-zinc-200">
                Meta total atingida (resultado líquido)
              </span>
            </div>
            <Badge
              variant={
                scenarioMetrics.validation.totalGoalReached
                  ? "default"
                  : "destructive"
              }
            >
              {formatPercent(
                (scenarioMetrics.totalNetResult / metrics.goalAmount) * 100
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {validation.dailyLimitRespected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-zinc-200">
                Limite diário respeitado ({">"}35% elimina)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  validation.dailyLimitRespected ? "default" : "destructive"
                }
              >
                {violations.length} violação(ões)
              </Badge>
              {warnings.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-500"
                >
                  {warnings.length} aviso(s)
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violações (se houver) */}
      {violations.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Violações Eliminatórias ({">"}35% da meta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.map((violation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                >
                  <div>
                    <p className="text-zinc-200 font-medium">
                      {format(
                        new Date(violation.date),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Resultado bruto: {formatCurrency(violation.result)} |
                      Resultado líquido: {formatCurrency(violation.netResult)}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {formatPercent(Math.abs(violation.percentOfGoal))} da meta
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-200">
                <strong>Limite eliminatório:</strong> Mais que{" "}
                {formatCurrency(metrics.goalAmount * 0.35)} por dia (35% da
                meta)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos (se houver) */}
      {warnings.length > 0 && (
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Dias de Atenção (30-35% da meta)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20"
                >
                  <div>
                    <p className="text-zinc-200 font-medium">
                      {format(
                        new Date(warning.date),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                      )}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Resultado bruto: {formatCurrency(warning.result)} |
                      Resultado líquido: {formatCurrency(warning.netResult)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-yellow-500 text-yellow-500"
                  >
                    {formatPercent(Math.abs(warning.percentOfGoal))} da meta
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-200">
                <strong>Zona de atenção:</strong> Entre{" "}
                {formatCurrency(metrics.goalAmount * 0.3)} e{" "}
                {formatCurrency(metrics.goalAmount * 0.35)} por dia (30-35% da
                meta). Não elimina, mas deve ser monitorado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados diários */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Resultados Diários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {scenarioMetrics.adjustedResults.map((day, index) => {
                const getBgColor = (riskLevel: string, adjusted?: boolean) => {
                  if (adjusted)
                    return "bg-blue-500/10 border border-blue-500/20";
                  switch (riskLevel) {
                    case "violation":
                      return "bg-red-500/10 border border-red-500/20";
                    case "warning":
                      return "bg-yellow-500/10 border border-yellow-500/20";
                    default:
                      return "bg-zinc-800/50";
                  }
                };

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${getBgColor(day.riskLevel, day.adjusted)}`}
                  >
                    <div>
                      <p className="text-zinc-200 font-medium">
                        {format(new Date(day.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {day.operations} operação(ões) | Custos:{" "}
                        {formatCurrency(day.costs)}
                        {day.adjusted && (
                          <span className="ml-2 text-blue-400">• Ajustado</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">
                        Bruto: {formatCurrency(day.result)}
                      </p>
                      <p
                        className={`font-medium ${getResultColor(day.netResult)}`}
                      >
                        Líquido: {formatCurrency(day.netResult)}
                      </p>
                      <div className="flex items-center justify-end space-x-1">
                        <p className="text-sm text-zinc-400">
                          {formatPercent(Math.abs(day.percentOfGoal))} da meta
                        </p>
                        {day.adjusted && (
                          <span className="text-blue-400 text-xs">🔧</span>
                        )}
                        {day.riskLevel === "violation" && !day.adjusted && (
                          <span className="text-red-400 text-xs">❌</span>
                        )}
                        {day.riskLevel === "warning" && !day.adjusted && (
                          <span className="text-yellow-400 text-xs">⚠️</span>
                        )}
                        {day.riskLevel === "safe" && (
                          <span className="text-green-400 text-xs">✅</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
