// app/(dashboard)/platform-renewals/_columns/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export type Renewal = {
  id: string;
  renewalType: string;
  paymentId: string;
  amount: number;
  platform: string;
  status: string;
  renewalDate: Date | null;
  pixCode: string | null;
  pixExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  entity: {
    platform?: string;
    plan?: string;
    traderStatus?: string;
    status?: string;
    platformStartDate?: Date | null;
    startDate?: Date | null;
    lastRenewalDate?: Date | null;
  };
};

function getStatusBadge(status: string) {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    completed: "default",
    paid: "secondary",
    pending: "outline",
    failed: "destructive",
  };

  const labels: Record<string, string> = {
    completed: "Completo",
    paid: "Pago",
    pending: "Pendente",
    failed: "Falhou",
  };

  return (
    <Badge variant={variants[status] || "outline"}>
      {labels[status] || status}
    </Badge>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const columns: ColumnDef<Renewal>[] = [
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row }) => (
      <div className="text-xs">{formatDate(row.original.createdAt)}</div>
    ),
  },
  {
    accessorKey: "customer.name",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.customer.name}</div>
    ),
  },
  {
    accessorKey: "customer.email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-xs">{row.original.customer.email}</div>
    ),
  },
  {
    accessorKey: "platform",
    header: "Plataforma",
  },
  {
    accessorKey: "renewalType",
    header: "Tipo",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.renewalType === "evaluation" ? "Avaliação" : "Direto"}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => (
      <div className="font-medium">{formatCurrency(row.original.amount)}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "paymentId",
    header: "Order ID",
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.original.paymentId}</div>
    ),
  },
  {
    accessorKey: "entity.lastRenewalDate",
    header: "Última Renovação",
    cell: ({ row }) => (
      <div className="text-xs">
        {formatDate(row.original.entity.lastRenewalDate)}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const renewal = row.original;

      if (renewal.status !== "paid") {
        return null;
      }

      return (
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            if (typeof window !== "undefined" && window.completeRenewal) {
              window.completeRenewal(renewal.id);
            }
          }}
        >
          <Check className="h-4 w-4 mr-1" />
          Concluir
        </Button>
      );
    },
  },
];
