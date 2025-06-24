// app/(dashboard)/paid-accounts/_columns/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { PaidAccount } from "@/app/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaidAccountButtons } from "../_components/paid-platform-button";
import {
  calculateDaysToExpire,
  getDaysToExpireColor,
  formatDaysToExpire,
} from "@/utils/paid-accounts-helper";

export const columns: ColumnDef<
  PaidAccount & {
    client: {
      name: string;
      email: string;
      cpf: string;
      birthDate: Date;
      startDate: Date | null;
      observation: string | null;
    };
  }
>[] = [
  {
    accessorKey: "client.name",
    header: "Nome",
  },
  {
    accessorKey: "platform",
    header: "Plataforma",
  },
  {
    accessorKey: "plan",
    header: "Plano",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const color =
        status === "Ativo"
          ? "text-green-500"
          : status === "Aguardando"
            ? "text-yellow-500"
            : "text-red-500";

      return <span className={`font-medium ${color}`}>{status}</span>;
    },
  },
  {
    accessorKey: "client.startDate",
    header: "Data de Início",
    cell: ({ row }) => {
      const date = row.original.client.startDate;
      if (!date) return "-";

      // ✅ CORRIGIDO: Ajustar timezone para evitar "um dia antes"
      const dateObj = new Date(date);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "startDate",
    header: "Data Ativação",
    cell: ({ row }) => {
      const date = row.getValue("startDate");
      if (!date) return "-";

      // ✅ CORRIGIDO: Ajustar timezone
      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "endDate",
    header: "Data Cancelamento",
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      if (!date) return "-";

      // ✅ CORRIGIDO: Ajustar timezone
      const dateObj = new Date(date as string);
      const offset = dateObj.getTimezoneOffset();
      const adjustedDate = new Date(dateObj.getTime() + offset * 60 * 1000);

      return format(adjustedDate, "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "client.observation",
    header: "Observação",
    cell: ({ row }) => {
      const observation = row.original.client.observation;
      if (!observation) return "-";

      // Truncar observação longa para exibição na tabela
      const truncated =
        observation.length > 50
          ? `${observation.substring(0, 50)}...`
          : observation;

      return (
        <span
          className="text-zinc-300 cursor-help"
          title={observation} // Tooltip com texto completo
        >
          {truncated}
        </span>
      );
    },
  },
  {
    accessorKey: "daysToExpire",
    header: "Dias a Vencer",
    cell: ({ row }) => {
      const startDate = row.original.startDate; // Data de ativação
      const status = row.original.status;

      // Só calcular para contas ativas
      if (status !== "Ativo" || !startDate) {
        return <span className="text-zinc-500">-</span>;
      }

      // Usar utilitários para cálculos
      const daysToExpire = calculateDaysToExpire(startDate, 30);
      const colorClass = getDaysToExpireColor(daysToExpire);
      const formattedText = formatDaysToExpire(daysToExpire);

      return <span className={colorClass}>{formattedText}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <PaidAccountButtons account={row.original} />;
    },
  },
];
