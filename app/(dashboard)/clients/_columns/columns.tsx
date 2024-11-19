import { ColumnDef } from "@tanstack/react-table";
import { Client } from "@/app/types";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

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
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "email",
    header: "E-mail",
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
    accessorKey: "traderStatus",
    header: "Situação",
  },
  {
    accessorKey: "startDate",
    header: "Data Início",
    cell: ({ row }) => {
      const date = row.getValue("startDate");
      return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
    },
  },
  {
    accessorKey: "endDate",
    header: "Data Fim",
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
    },
  },
  {
    accessorKey: "birthDate",
    header: "Data Nascimento",
    cell: ({ row }) => {
      const date = row.getValue("birthDate");
      return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
    },
  },
  {
    accessorKey: "address",
    header: "Endereço",
  },
  {
    accessorKey: "zipCode",
    header: "CEP",
  },
  {
    accessorKey: "observation",
    header: "Observação",
  },
  {
    accessorKey: "cancellationDate",
    header: "Data Cancelamento",
    cell: ({ row }) => {
      const date = row.getValue("cancellationDate");
      return date ? format(new Date(date as string), "dd/MM/yyyy") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(client.id!)}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.editClient(client)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => window.deleteClient(client.id!)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
