/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
//import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MgcClientButtons } from "../_components/mgc-client-buttons";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "cpf",
    header: "CPF",
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
    accessorKey: "startDate",
    header: "Data Ativação",
    cell: ({ row }) => {
      const date = row.getValue("startDate");
      if (!date) return "-";
      return format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    accessorKey: "endDate",
    header: "Data Cancelamento",
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      if (!date) return "-";
      return format(new Date(date as string), "dd/MM/yyyy", { locale: ptBR });
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <MgcClientButtons client={row.original} />;
    },
  },
];
