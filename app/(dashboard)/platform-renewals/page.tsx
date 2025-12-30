/* eslint-disable react-hooks/exhaustive-deps */
// app/(dashboard)/platform-renewals/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns, Renewal } from "./_columns/columns";
import {
  getPlatformRenewals,
  getRenewalStats,
  completePlatformRenewal,
} from "./_actions";
import { StatsCards } from "./_components/stats-cards";
import { Filters } from "./_components/filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  status: string;
  count: number;
  totalAmount: number;
}

declare global {
  interface Window {
    completeRenewal: (renewalId: string) => Promise<void>;
  }
}

export default function PlatformRenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [renewalTypeFilter, setRenewalTypeFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadRenewals();
  }, [statusFilter, renewalTypeFilter]);

  async function loadRenewals() {
    try {
      setLoading(true);

      const [renewalsData, statsData] = await Promise.all([
        getPlatformRenewals({
          status: statusFilter,
          renewalType: renewalTypeFilter,
        }),
        getRenewalStats(),
      ]);

      setRenewals(renewalsData);
      setStats(statsData);
    } catch (error) {
      console.error("Erro ao carregar renovações:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteRenewal(renewalId: string) {
    try {
      await completePlatformRenewal(renewalId);
      toast({
        title: "Renovação concluída",
        description: "A plataforma foi renovada com sucesso.",
      });
      await loadRenewals();
    } catch (error) {
      console.error("Erro ao concluir renovação:", error);
      toast({
        title: "Erro ao concluir renovação",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.completeRenewal = handleCompleteRenewal;
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            Renovações de Plataforma
          </h1>
          <p className="text-muted-foreground">
            Gestão de renovações via Pagarme
          </p>
        </div>
        <Button onClick={loadRenewals} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <StatsCards stats={stats} totalRenewals={renewals.length} />

      {/* Filtros */}
      <Filters
        statusFilter={statusFilter}
        renewalTypeFilter={renewalTypeFilter}
        onStatusChange={setStatusFilter}
        onRenewalTypeChange={setRenewalTypeFilter}
      />

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Renovações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : renewals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma renovação encontrada
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={renewals}
              searchColumn="customer.name"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
