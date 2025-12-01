// app/(dashboard)/platform-renewals/_components/filters.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersProps {
  statusFilter: string;
  renewalTypeFilter: string;
  onStatusChange: (value: string) => void;
  onRenewalTypeChange: (value: string) => void;
}

export function Filters({
  statusFilter,
  renewalTypeFilter,
  onStatusChange,
  onRenewalTypeChange,
}: FiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="paid">Pagos (Aguardando)</SelectItem>
            <SelectItem value="completed">Completos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="failed">Falhados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={renewalTypeFilter} onValueChange={onRenewalTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="evaluation">Avaliação</SelectItem>
            <SelectItem value="paid_account">Conta Aprovada</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
