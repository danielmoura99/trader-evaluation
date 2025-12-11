// app/(dashboard)/cancelled-accounts/_columns/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { PaidAccount } from "@/app/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

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
      return <span className="font-medium text-red-500">{status}</span>;
    },
  },
  {
    accessorKey: "client.startDate",
    header: "Data de Início",
    cell: ({ row }) => {
      const date = row.original.client.startDate;
      if (!date) return "-";

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

      const truncated =
        observation.length > 50
          ? `${observation.substring(0, 50)}...`
          : observation;

      return (
        <span
          className="text-zinc-300 cursor-help"
          title={observation}
        >
          {truncated}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button
          onClick={() => window.editPaidAccount(row.original)}
          variant="outline"
          size="sm"
          className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      );
    },
  },
];
