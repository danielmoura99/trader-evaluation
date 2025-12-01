// app/(dashboard)/platform-renewals/_components/stats-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  status: string;
  count: number;
  totalAmount: number;
}

interface StatsCardsProps {
  stats: Stats[];
  totalRenewals: number;
}

export function StatsCards({ stats, totalRenewals }: StatsCardsProps) {
  const totalPaid = stats.find((s) => s.status === "paid");
  const totalCompleted = stats.find((s) => s.status === "completed");
  const totalPending = stats.find((s) => s.status === "pending");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Pagos (Aguardando Ação)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">
            {totalPaid?.count || 0}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Renovações Completas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompleted?.count || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Aguardando Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPending?.count || 0}</div>
          <p className="text-xs text-muted-foreground">PIX pendente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Total de Renovações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRenewals}</div>
          <p className="text-xs text-muted-foreground">Últimas 100</p>
        </CardContent>
      </Card>
    </div>
  );
}
