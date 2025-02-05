// _components/paid-account-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Play, Square, Edit } from "lucide-react";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";
import { BROKER_CONFIG } from "@/utils/broker-config";
import { PaidAccount, PaidAccountStatus } from "@/app/types";
import { activatePaidAccount, cancelPaidAccount } from "../_actions";

interface PaidAccountButtonsProps {
  account: PaidAccount & {
    client: {
      name: string;
      email: string;
      cpf: string;
      birthDate: Date;
    };
  };
}

export function PaidAccountButtons({ account }: PaidAccountButtonsProps) {
  const { toast } = useToast();

  const handleCreateAccount = async () => {
    try {
      const [firstName, ...lastNameParts] = account.client.name.split(" ");
      const lastName = lastNameParts.join(" ");

      const payload = {
        request: "prop_trading_user_subscription",
        email: account.client.email,
        documentType: 1,
        document: account.client.cpf.replace(/\D/g, ""),
        firstName,
        lastName,
        dateOfBirth: account.client.birthDate.toISOString().split("T")[0],
        subscriptionPlanId: getSubscriptionPlanId(account.platform),
        testAccount: BROKER_CONFIG.paidAccount,
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/create-account", payload);

      if (response.data.success) {
        await activatePaidAccount(account.id);
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
        document: account.client.cpf.replace(/\D/g, ""),
        subscriptionPlanId: getSubscriptionPlanId(account.platform),
        testAccount: BROKER_CONFIG.paidAccount,
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/cancel-account", payload);

      if (response.data.success) {
        await cancelPaidAccount(account.id);
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
      {account.status === PaidAccountStatus.WAITING && (
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

      {account.status === PaidAccountStatus.ACTIVE && (
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
        onClick={() => window.editPaidAccount(account)}
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
