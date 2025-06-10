// app/(dashboard)/dashboard/_components/stats-cards.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  Clock,
  PlayCircle,
  CheckCircle2,
  ChartBar,
  PieChart,
  Zap, // ✅ Novo ícone para clientes diretos
} from "lucide-react";

interface PlanApprovalRate {
  plan: string;
  rate: string;
}

interface DirectByPlan {
  plan: string;
  count: number;
}

interface StatsCardsProps {
  totalClients: number;
  awaitingClients: number;
  inEvaluationClients: number;
  completedClients: number;
  directClients: number; // ✅ Nova prop
  approvalRate: string;
  planApprovalRates: PlanApprovalRate[];
  directByPlan: DirectByPlan[]; // ✅ Nova prop
}

export function StatsCards({
  totalClients,
  awaitingClients,
  inEvaluationClients,
  completedClients,
  directClients, // ✅ Novo parâmetro
  approvalRate,
  planApprovalRates,
  directByPlan, // ✅ Novo parâmetro
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Total de Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">{totalClients}</div>
          <p className="text-xs text-zinc-400 mt-1">
            Incluindo avaliativos e diretos
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Aguardando Início
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {awaitingClients}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Aguardando início de avaliação
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Em Avaliação
          </CardTitle>
          <PlayCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {inEvaluationClients}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Avaliações em andamento</p>
        </CardContent>
      </Card>

      {/* ✅ NOVO CARD: Clientes Diretos */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Clientes Diretos
          </CardTitle>
          <Zap className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {directClients}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Sem avaliação, direto para remunerada
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Finalizados
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {completedClients}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Somente avaliações concluídas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Taxa de Aprovação
          </CardTitle>
          <ChartBar className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-100">
            {approvalRate}%
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Baseado em avaliações reais
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Aprovação por Plano
          </CardTitle>
          <PieChart className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {planApprovalRates.slice(0, 5).map((plan) => (
              <div
                key={plan.plan}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-zinc-300">{plan.plan}</span>
                <span className="text-sm font-medium text-zinc-100">
                  {plan.rate}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            ✅ Excluindo planos diretos das estatísticas
          </p>
        </CardContent>
      </Card>

      {/* ✅ NOVO CARD: Breakdown de Clientes Diretos */}
      <Card className="bg-zinc-900 border-zinc-800 md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">
            Clientes Diretos por Plano
          </CardTitle>
          <Zap className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {directByPlan.length > 0 ? (
              directByPlan.slice(0, 4).map((plan) => (
                <div
                  key={plan.plan}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-300">{plan.plan}</span>
                  <span className="text-sm font-medium text-purple-400">
                    {plan.count} clientes
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">
                Nenhum cliente direto ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
