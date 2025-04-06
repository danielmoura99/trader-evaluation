"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Play, Square, Edit } from "lucide-react";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";
import { BROKER_CONFIG } from "@/utils/broker-config";
import { activateMgcClient, cancelMgcClient } from "../_actions";

interface MgcClientButtonsProps {
  client: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    birthDate: Date;
    platform: string;
    status: string;
  };
}

export function MgcClientButtons({ client }: MgcClientButtonsProps) {
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    try {
      const [firstName, ...lastNameParts] = client.name.split(" ");
      const lastName = lastNameParts.join(" ");

      const payload = {
        request: "prop_trading_user_subscription",
        email: client.email,
        documentType: 1,
        document: client.cpf.replace(/\D/g, ""),
        firstName,
        lastName,
        dateOfBirth:
          client.birthDate instanceof Date
            ? client.birthDate.toISOString().split("T")[0]
            : new Date(client.birthDate).toISOString().split("T")[0],
        subscriptionPlanId: getSubscriptionPlanId(client.platform),
        testAccount: BROKER_CONFIG.mgcAccount,
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/create-account", payload);

      if (response.data.success) {
        await activateMgcClient(client.id);
        toast({
          title: "Sucesso",
          description: "Plataforma liberada com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro na liberação:", error);
      toast({
        title: "Erro",
        description: "Falha ao liberar plataforma",
        variant: "destructive",
      });
    }
  };

  const handleCancelAccount = async () => {
    if (!confirm("Tem certeza que deseja cancelar esta conta?")) return;

    try {
      const payload = {
        document: client.cpf.replace(/\D/g, ""),
        subscriptionPlanId: getSubscriptionPlanId(client.platform),
        testAccount: BROKER_CONFIG.mgcAccount,
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/cancel-account", payload);

      if (response.data.success) {
        await cancelMgcClient(client.id);
        toast({
          title: "Sucesso",
          description: "Conta cancelada com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro no cancelamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar conta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      {client.status === "Aguardando" && (
        <Button
          onClick={handleCreateAccount}
          variant="outline"
          size="sm"
          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
        >
          <Play className="h-4 w-4 mr-2" />
          Liberar Plataforma
        </Button>
      )}

      {client.status === "Ativo" && (
        <Button
          onClick={handleCancelAccount}
          variant="outline"
          size="sm"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
        >
          <Square className="h-4 w-4 mr-2" />
          Cancelar Conta
        </Button>
      )}

      <Button
        onClick={() => window.editMgcClient(client)}
        variant="outline"
        size="sm"
        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
      >
        <Edit className="h-4 w-4 mr-2" />
        Editar
      </Button>
    </div>
  );
}
