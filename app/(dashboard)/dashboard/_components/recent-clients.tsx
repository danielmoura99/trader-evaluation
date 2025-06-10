// app/(dashboard)/dashboard/_components/recent-clients.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TraderStatus } from "@/app/types";

interface RecentClient {
  id: string;
  name: string;
  platform: string;
  plan: string;
  traderStatus: string;
  createdAt: Date;
}

export function RecentClients({ clients }: { clients: RecentClient[] }) {
  // ✅ Função para determinar a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case TraderStatus.WAITING:
        return "bg-yellow-400/10 text-yellow-500";
      case TraderStatus.IN_PROGRESS:
        return "bg-blue-400/10 text-blue-500";
      case TraderStatus.APPROVED:
        return "bg-green-400/10 text-green-500";
      case TraderStatus.REJECTED:
        return "bg-red-400/10 text-red-500";
      case TraderStatus.DIRECT: // ✅ Nova cor para status "Direto"
        return "bg-purple-400/10 text-purple-500";
      default:
        return "bg-zinc-400/10 text-zinc-500";
    }
  };

  // ✅ Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case TraderStatus.DIRECT:
        return "⚡"; // Raio para indicar "direto"
      case TraderStatus.APPROVED:
        return "✅";
      case TraderStatus.REJECTED:
        return "❌";
      case TraderStatus.IN_PROGRESS:
        return "🔄";
      default:
        return "";
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Clientes Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {clients.map((client) => (
            <div key={client.id} className="flex items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-zinc-100">
                  {client.name}
                </p>
                <p className="text-sm text-zinc-400">
                  {client.platform} • {client.plan}
                </p>
                <div className="flex items-center pt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      client.traderStatus
                    )}`}
                  >
                    {/* ✅ Adicionar ícone para status especiais */}
                    {getStatusIcon(client.traderStatus) && (
                      <span className="mr-1">
                        {getStatusIcon(client.traderStatus)}
                      </span>
                    )}
                    {client.traderStatus}
                  </span>
                  <span className="ml-4 text-xs text-zinc-500">
                    {format(new Date(client.createdAt), "dd 'de' MMMM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {/* ✅ Adicionar indicador especial para clientes diretos */}
                {client.traderStatus === TraderStatus.DIRECT && (
                  <p className="text-xs text-purple-400 mt-1">
                    💜 Cliente direto - sem avaliação necessária
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
