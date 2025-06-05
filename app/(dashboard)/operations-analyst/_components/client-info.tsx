import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Building } from "lucide-react";

interface Client {
  id: string;
  name: string;
  cpf: string;
  plan: string;
  platform: string;
}

interface ClientInfoProps {
  client: Client;
}

export function ClientInfo({ client }: ClientInfoProps) {
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "TC - 50K":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "TC - 100K":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "TC - 250K":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "TC - 500K":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">{client.name}</h3>
              <p className="text-sm text-zinc-400">
                CPF: {formatCPF(client.cpf)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="flex items-center text-sm text-zinc-400 mb-1">
                <Building className="h-4 w-4 mr-1" />
                {client.platform}
              </div>
              <Badge
                variant="outline"
                className={`${getPlanColor(client.plan)} font-medium`}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                {client.plan}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
