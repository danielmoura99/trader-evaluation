import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    // Implementar download do relatório
    console.log("Download do relatório");
  };

  return (
    <div className="space-y-6">
      {/* Header com resultado final */}
      <Card
        className={`border-2 ${
          validation.approved
            ? "bg-green-500/5 border-green-500/20"
            : "bg-red-500/5 border-red-500/20"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-full ${
                  validation.approved ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                {validation.approved ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">
                  {validation.approved ? "APROVADO" : "REPROVADO"}
                </h2>
                <p className="text-zinc-400">
                  Análise concluída para {client.name}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-zinc-400">Dias Operados</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {metrics.daysOperated}
                </p>
                <p className="text-xs text-zinc-500">Mínimo: 10 dias</p>
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
                <p className="text-sm text-zinc-400">Resultado Líquido</p>
                <p
                  className={`text-2xl font-bold ${getResultColor(metrics.totalNetResult)}`}
                >
                  {formatCurrency(metrics.totalNetResult)}
                </p>
                <p className="text-xs text-zinc-500">
                  Meta: {formatCurrency(metrics.goalAmount)}
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
                  className={`text-2xl font-bold ${getResultColor(metrics.totalNetResult)}`}
                >
                  {formatPercent(
                    (metrics.totalNetResult / metrics.goalAmount) * 100
                  )}
                </p>
                <p className="text-xs text-zinc-500">Necessário: 100%</p>
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
              {validation.minimumDays ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-zinc-200">Mínimo de 10 dias operados</span>
            </div>
            <Badge variant={validation.minimumDays ? "default" : "destructive"}>
              {metrics.daysOperated} dias
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {validation.totalGoalReached ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-zinc-200">
                Meta total atingida (resultado líquido)
              </span>
            </div>
            <Badge
              variant={validation.totalGoalReached ? "default" : "destructive"}
            >
              {formatPercent(
                (metrics.totalNetResult / metrics.goalAmount) * 100
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
              {metrics.dailyResults.map((day, index) => {
                const getBgColor = (riskLevel: string) => {
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
                    className={`flex items-center justify-between p-3 rounded-lg ${getBgColor(day.riskLevel)}`}
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
                        {day.riskLevel === "violation" && (
                          <span className="text-red-400 text-xs">❌</span>
                        )}
                        {day.riskLevel === "warning" && (
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
