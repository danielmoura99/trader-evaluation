// app/(dashboard)/operations-analyst/_components/evaluation-selector.tsx
// Adicionando responsividade e scroll area para múltiplas avaliações

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Building } from "lucide-react";

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

interface EvaluationSelectorProps {
  isOpen: boolean;
  evaluations: Evaluation[];
  onSelect: (evaluation: Evaluation) => void;
  onClose: () => void;
}

export function EvaluationSelector({
  isOpen,
  evaluations,
  onSelect,
  onClose,
}: EvaluationSelectorProps) {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case "evaluation":
        return <Badge variant="default">Avaliação</Badge>;
      case "mgc":
        return <Badge variant="secondary">MGC</Badge>;
      case "paid":
        return <Badge variant="outline">Remunerada</Badge>;
      default:
        return <Badge variant="outline">Outros</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativo":
      case "aprovado":
        return "text-green-500";
      case "aguardando":
      case "aguardando inicio":
      case "em curso":
        return "text-yellow-500";
      case "reprovado":
      case "cancelado":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-4 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Múltiplas Avaliações Encontradas</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Este cliente possui {evaluations.length} avaliação(ões). Selecione
            qual deseja analisar:
          </p>

          <ScrollArea className="h-[400px] w-full rounded-md border border-zinc-800 p-4">
            <div className="space-y-3">
              {evaluations.map((evaluation) => (
                <div
                  key={`${evaluation.source}-${evaluation.id}`}
                  className="p-3 md:p-4 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center space-x-2">
                      {getSourceBadge(evaluation.source)}
                      <span className="font-medium text-zinc-100 text-sm md:text-base truncate">
                        {evaluation.displayName}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${getStatusColor(evaluation.status)} flex-shrink-0`}
                    >
                      {evaluation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-sm text-zinc-400 mb-4">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{evaluation.platform}</span>
                    </div>
                    {evaluation.startDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          Início:{" "}
                          {new Date(evaluation.startDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onSelect(evaluation)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Selecionar para Análise
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
