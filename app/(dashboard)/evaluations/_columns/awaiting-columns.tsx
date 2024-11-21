import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "plan",
    header: "Plano",
  },
  {
    accessorKey: "platform",
    header: "Plataforma",
  },
  {
    accessorKey: "traderStatus",
    header: "Situação",
    cell: ({ row }) => {
      return (
        <span className="text-yellow-500 font-medium">
          {row.original.traderStatus}
        </span>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: "Data Início",
    cell: ({ row }) => {
      const date = row.getValue("startDate");
      if (!date) return "-";

      // Ajusta o fuso horário
      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "observation",
    header: "Observação",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <Button
          onClick={() => window.startEvaluation(client.id!)}
          variant="outline"
          size="sm"
          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
        >
          <Play className="h-4 w-4 mr-2" />
          Liberar Plataforma
        </Button>
      );
    },
  },
];
