"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Search, FileText, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OperationsUpload } from "./_components/operations-upload";
import { AnalysisResults } from "./_components/analysis-results";
import { ClientInfo } from "./_components/client-info";

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

const PLAN_GOALS = {
  "TC - 50K": 1000,
  "TC - 100K": 2000,
  "TC - 250K": 4200,
  "TC - 500K": 9000,
} as const;

export default function OperationsAnalystPage() {
  const [cpf, setCpf] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const { toast } = useToast();

  const searchClient = useCallback(async () => {
    if (!cpf || cpf.length < 11) {
      toast({
        title: "CPF inválido",
        description: "Digite um CPF válido para buscar o cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/operations-analyst/client?cpf=${cpf.replace(/\D/g, "")}`
      );
      const data = await response.json();

      if (data.success) {
        setClient(data.client);
        toast({
          title: "Cliente encontrado",
          description: `${data.client.name} - ${data.client.plan}`,
        });
      } else {
        setClient(null);
        toast({
          title: "Cliente não encontrado",
          description: "Nenhum cliente encontrado com este CPF.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao buscar cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [cpf, toast]);

  const handleAnalysisComplete = useCallback(
    (result: AnalysisResult) => {
      setAnalysisResult(result);
      toast({
        title: "Análise concluída",
        description: `Resultado: ${result.validation.approved ? "APROVADO" : "REPROVADO"}`,
        variant: result.validation.approved ? "default" : "destructive",
      });
    },
    [toast]
  );

  const resetAnalysis = useCallback(() => {
    setCpf("");
    setClient(null);
    setAnalysisResult(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            Analista de Operações
          </h1>
          <p className="text-zinc-400 mt-1">
            Analise as operações de um cliente e verifique se atingiu as metas
            estabelecidas
          </p>
        </div>

        {analysisResult && (
          <Button
            onClick={resetAnalysis}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            <FileText className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        )}
      </div>

      {!analysisResult ? (
        <div className="grid gap-6">
          {/* Busca de Cliente */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Buscar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="cpf" className="text-zinc-200">
                    CPF do Cliente
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                    disabled={isSearching}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={searchClient}
                    disabled={isSearching || !cpf}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSearching ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>

              {client && <ClientInfo client={client} />}
            </CardContent>
          </Card>

          {/* Upload de Operações */}
          {client && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload das Operações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OperationsUpload
                  client={client}
                  planGoal={
                    PLAN_GOALS[client.plan as keyof typeof PLAN_GOALS] || 0
                  }
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </CardContent>
            </Card>
          )}

          {/* Resumo das Metas */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Metas por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(PLAN_GOALS).map(([plan, goal]) => (
                  <div
                    key={plan}
                    className={`p-4 rounded-lg border ${
                      client?.plan === plan
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-zinc-800/50 border-zinc-700"
                    }`}
                  >
                    <div className="font-medium text-zinc-200">{plan}</div>
                    <div className="text-lg font-bold text-green-400">
                      R$ {goal.toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
                <h4 className="font-medium text-zinc-200 mb-2">
                  Regras de Aprovação:
                </h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Mínimo de 10 dias de operação</li>
                  <li>
                    • <span className="text-green-400">≤30% da meta:</span>{" "}
                    Seguro ✅
                  </li>
                  <li>
                    • <span className="text-yellow-400">30-35% da meta:</span>{" "}
                    Atenção ⚠️ (não elimina)
                  </li>
                  <li>
                    • <span className="text-red-400">{">"}35% da meta:</span>{" "}
                    Violação ❌ (elimina)
                  </li>
                  <li>
                    • Resultado total líquido deve ser maior ou igual à meta
                  </li>
                  <li className="mt-2 pt-2 border-t border-zinc-700">
                    <strong className="text-zinc-300">
                      Custos de operação:
                    </strong>
                  </li>
                  <li>• WIN (qualquer vencimento): R$ 1,36 por contrato</li>
                  <li>• WDO (qualquer vencimento): R$ 2,78 por contrato</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Resultados da Análise */
        <AnalysisResults result={analysisResult} />
      )}
    </div>
  );
}
