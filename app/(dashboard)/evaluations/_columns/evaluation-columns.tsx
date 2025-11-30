import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "plan",
    header: "Plano",
  },
  {
    accessorKey: "traderStatus",
    header: "Situação",
    cell: ({ row }) => {
      return (
        <span className="text-blue-500 font-medium">
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
    accessorKey: "endDate",
    header: "Data Fim",
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      if (!date) return "-";

      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "daysLeft",
    header: "Dias a Vencer",
    cell: ({ row }) => {
      const endDate = row.original.endDate;
      if (!endDate) return "-";

      const daysLeft = differenceInDays(new Date(endDate), new Date());
      return (
        <span className={daysLeft <= 5 ? "text-red-500" : "text-green-500"}>
          {daysLeft + 1} dias
        </span>
      );
    },
  },
  {
    accessorKey: "platformStartDate",
    header: "Data Plataforma",
    cell: ({ row }) => {
      const date = row.getValue("platformStartDate");
      if (!date) return "-";

      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "platformDaysLeft",
    header: "Dias a Vencer Plataforma",
    cell: ({ row }) => {
      const platformStartDate = row.original.platformStartDate;
      if (!platformStartDate) return "-";

      // Calcular data de vencimento da plataforma (30 dias desde platformStartDate)
      const platformEndDate = new Date(platformStartDate);
      platformEndDate.setDate(platformEndDate.getDate() + 30);

      const daysLeft = differenceInDays(platformEndDate, new Date());

      // Cores baseadas nos dias restantes
      const color =
        daysLeft <= 0
          ? "text-red-600 font-bold"
          : daysLeft <= 3
            ? "text-red-500 font-medium"
            : daysLeft <= 7
              ? "text-yellow-500"
              : "text-green-500";

      const text =
        daysLeft <= 0
          ? `Vencido (${Math.abs(daysLeft)} dias)`
          : `${daysLeft + 1} dias`;

      return <span className={color}>{text}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <Button
          onClick={() => window.openFinishEvaluation(client)}
          variant="outline"
          size="sm"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
        >
          <Square className="h-4 w-4 mr-2" />
          Encerrar Avaliação
        </Button>
      );
    },
  },
];
