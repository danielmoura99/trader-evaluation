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
import { EvaluationSelector } from "./_components/evaluation-selector";

interface Client {
  id: string;
  name: string;
  cpf: string;
  plan: string;
  platform: string;
}

// ✅ NOVA INTERFACE: Para múltiplas avaliações
interface Evaluation {
  id: string;
  name: string;
  cpf: string;
  plan: string;
  platform: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  source: "evaluation" | "mgc" | "paid";
  displayName: string;
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
  // Formatos processados (TC - XXX)
  "TC - 50K": 1000,
  "TC - 100K": 1900,
  "TC - 250K": 4200,
  "TC - 500K": 9000,
  "TC DIRETO - 5": 1000,
  "TC DIRETO - 10": 2200,
  "TC DIRETO - 20": 3800,
  "TC DIRETO - 25": 5200,
  "TC - MGT": 3000,
  // Formatos originais do banco (Trader XXX) - para retrocompatibilidade
  "Trader 50K": 1000,
  "Trader 100K": 1900,
  "Trader 250K": 4200,
  "Trader 500K": 9000,
} as const;

export default function OperationsAnalystPage() {
  const [cpf, setCpf] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  // ✅ NOVOS ESTADOS: Para sistema de múltiplas avaliações
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [showEvaluationSelector, setShowEvaluationSelector] = useState(false);

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
        // ✅ LÓGICA ATUALIZADA: Verificar se há múltiplas avaliações
        if (data.multiple) {
          // MÚLTIPLAS AVALIAÇÕES: Mostrar dialog de seleção
          setEvaluations(data.evaluations);
          setShowEvaluationSelector(true);
          toast({
            title: "Múltiplas avaliações encontradas",
            description: `${data.evaluations.length} avaliação(ões) encontrada(s). Selecione uma para continuar.`,
          });
        } else {
          // ÚNICA AVALIAÇÃO: Continuar com lógica original
          if (data.client) {
            // API retornando formato antigo (compatibilidade)
            setClient(data.client);
            toast({
              title: "Cliente encontrado",
              description: `${data.client.name} - ${data.client.plan}`,
            });
          } else if (data.evaluations && data.evaluations.length > 0) {
            // API retornando formato novo com 1 avaliação
            const evaluation = data.evaluations[0];
            setClient({
              id: evaluation.id,
              name: evaluation.name,
              cpf: evaluation.cpf,
              plan: evaluation.plan,
              platform: evaluation.platform,
            });
            toast({
              title: "Cliente encontrado",
              description: `${evaluation.name} - ${evaluation.plan}`,
            });
          }
        }
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
        title: "Erro na busca",
        description: "Ocorreu um erro ao buscar o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [cpf, toast]);

  // ✅ NOVA FUNÇÃO: Handler para seleção de avaliação
  const handleEvaluationSelect = (evaluation: Evaluation) => {
    setClient({
      id: evaluation.id,
      name: evaluation.name,
      cpf: evaluation.cpf,
      plan: evaluation.plan,
      platform: evaluation.platform,
    });
    setShowEvaluationSelector(false);
    setEvaluations([]); // Limpar avaliações
    toast({
      title: "Avaliação selecionada",
      description: `${evaluation.name} - ${evaluation.plan}`,
    });
  };

  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
  }, []);

  // ✅ FUNÇÃO RESET ATUALIZADA: Limpar novos estados
  const resetAnalysis = () => {
    setClient(null);
    setAnalysisResult(null);
    setCpf("");
    setEvaluations([]);
    setShowEvaluationSelector(false);
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  return (
    <div className="w-full max-w-none p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">
            Análista de Operações
          </h1>
          <p className="text-zinc-400 mt-1">
            Análise avançada de performance de traders
          </p>
        </div>
        {analysisResult && (
          <Button
            onClick={resetAnalysis}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 w-full sm:w-auto"
          >
            Nova Análise
          </Button>
        )}
      </div>

      {/* ✅ DIALOG de Seleção de Avaliações */}
      {showEvaluationSelector && (
        <EvaluationSelector
          isOpen={showEvaluationSelector}
          evaluations={evaluations}
          onSelect={handleEvaluationSelect}
          onClose={() => {
            setShowEvaluationSelector(false);
            setEvaluations([]);
          }}
        />
      )}

      {/* Resultados da Análise */}
      {analysisResult ? (
        <AnalysisResults result={analysisResult} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Busca de Cliente */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Buscar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-zinc-200">
                  CPF do Cliente
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 flex-1"
                  />
                  <Button
                    onClick={searchClient}
                    disabled={isSearching || cpf.length < 14}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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
                    PLAN_GOALS[client.plan as keyof typeof PLAN_GOALS] ||
                    (() => {
                      console.warn(
                        `[Operations Analyst] Plano não encontrado: "${client.plan}". Usando meta padrão de 1000.`
                      );
                      return 1000;
                    })()
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {Object.entries(PLAN_GOALS).map(([plan, goal]) => (
                  <div
                    key={plan}
                    className={`p-3 rounded-lg border ${
                      client?.plan === plan
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700"
                    }`}
                  >
                    <p className="text-xs md:text-sm font-medium text-zinc-200 truncate">
                      {plan}
                    </p>
                    <p className="text-sm md:text-lg font-bold text-zinc-100">
                      R$ {goal.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-400">Meta total</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações Gerais */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-zinc-200 font-medium">Busca Inteligente</p>
                  <p className="text-sm text-zinc-400">
                    Localiza automaticamente o cliente em todas as bases de
                    dados
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-zinc-200 font-medium">Upload Simples</p>
                  <p className="text-sm text-zinc-400">
                    Faça upload do arquivo CSV das operações do trader
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-zinc-200 font-medium">Análise Completa</p>
                  <p className="text-sm text-zinc-400">
                    3 cenários de validação com relatórios detalhados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
