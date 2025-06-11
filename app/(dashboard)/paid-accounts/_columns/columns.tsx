// app/(dashboard)/paid-accounts/_columns/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { PaidAccount } from "@/app/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaidAccountButtons } from "../_components/paid-platform-button";

export const columns: ColumnDef<
  PaidAccount & {
    client: {
      name: string;
      email: string;
      cpf: string;
      birthDate: Date;
      startDate: Date | null; // ✅ ADICIONADO: Data de início do cliente
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
  // ✅ NOVA COLUNA: Data de Início (do formulário do cliente)
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
    id: "actions",
    cell: ({ row }) => {
      return <PaidAccountButtons account={row.original} />;
    },
  },
];
