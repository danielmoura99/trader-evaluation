import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
//import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface OperationsUploadProps {
  client: Client;
  planGoal: number;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function OperationsUpload({
  client,
  planGoal,
  onAnalysisComplete,
}: OperationsUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Verificar se é um arquivo Excel
      const validExtensions = [".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, envie um arquivo Excel (.xlsx ou .xls).",
          variant: "destructive",
        });
        return;
      }

      setFileName(file.name);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientId", client.id);
        formData.append("planGoal", planGoal.toString());

        const response = await fetch("/api/operations-analyst/analyze", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          onAnalysisComplete(result.analysis);
        } else {
          throw new Error(result.error || "Erro ao processar arquivo");
        }
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        toast({
          title: "Erro no upload",
          description:
            error instanceof Error
              ? error.message
              : "Erro ao processar arquivo",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        // Reset do input
        event.target.value = "";
      }
    },
    [client.id, planGoal, onAnalysisComplete, toast]
  );

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-zinc-600 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <div>
                <p className="text-zinc-300 font-medium">
                  Processando arquivo...
                </p>
                <p className="text-sm text-zinc-500">{fileName}</p>
              </div>
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-12 w-12 text-zinc-400" />
              <div>
                <p className="text-zinc-300 font-medium">
                  Envie o arquivo de operações
                </p>
                <p className="text-sm text-zinc-500">
                  Arquivos Excel (.xlsx, .xls) são aceitos
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="operations-upload"
                  disabled={isUploading}
                />
                <label htmlFor="operations-upload">
                  <Button
                    variant="outline"
                    disabled={isUploading}
                    className="cursor-pointer bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Informações importantes */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-amber-200 font-medium mb-1">
              Formato esperado do arquivo:
            </p>
            <ul className="text-amber-100/80 space-y-1">
              <li>• Relatório de operações em formato Excel</li>
              <li>
                • Deve conter colunas: Data de Abertura e Resultado da Operação
              </li>
              <li>
                • Meta para {client.plan}:{" "}
                <span className="font-medium">
                  R$ {planGoal.toLocaleString("pt-BR")}
                </span>
              </li>
              <li>
                • Limite diário:{" "}
                <span className="font-medium">
                  R$ {(planGoal * 0.3).toFixed(0)}
                </span>{" "}
                (30% da meta)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
