/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { format, differenceInDays, addDays } from "date-fns";
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
    id: "daysLeft",
    header: "Dias a Vencer",
    cell: ({ row }) => {
      const status = row.original.status;
      // Só calculamos dias restantes para clientes ativos
      if (status !== "Ativo") return "-";

      const startDate = row.original.startDate;
      if (!startDate) return "-";

      // Calcular data de vencimento (startDate + 30 dias)
      const startDateObj = new Date(startDate);
      const expiryDate = addDays(startDateObj, 30);

      // Calcular dias restantes
      const today = new Date();
      const daysLeft = differenceInDays(expiryDate, today);

      // Formatação visual baseada nos dias restantes
      return (
        <span
          className={
            daysLeft <= 5
              ? "text-red-500 font-medium"
              : daysLeft <= 10
                ? "text-yellow-500 font-medium"
                : "text-green-500 font-medium"
          }
        >
          {daysLeft} dias
        </span>
      );
    },
    sortingFn: (rowA, rowB) => {
      // Função de ordenação personalizada para "dias a vencer"
      const getExpiryDays = (row: any) => {
        if (row.original.status !== "Ativo" || !row.original.startDate) {
          return 9999; // Colocar não-ativos no final da ordenação
        }

        const startDate = new Date(row.original.startDate);
        const expiryDate = addDays(startDate, 30);
        return differenceInDays(expiryDate, new Date());
      };

      const daysA = getExpiryDays(rowA);
      const daysB = getExpiryDays(rowB);

      return daysA - daysB; // Ordem crescente (mais próximos de vencer primeiro)
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
