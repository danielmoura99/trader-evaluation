"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";
import { BROKER_CONFIG } from "@/utils/broker-config";
import { activatePaidAccount } from "../_actions";

interface PlatformActivationProps {
  paidAccount: {
    id: string;
    client: {
      name: string;
      email: string;
      cpf: string;
      birthDate: Date;
    };
    platform: string;
  };
}

export function PlatformActivation({ paidAccount }: PlatformActivationProps) {
  const { toast } = useToast();

  const handleActivation = async () => {
    try {
      const [firstName, ...lastNameParts] = paidAccount.client.name.split(" ");
      const lastName = lastNameParts.join(" ");

      const payload = {
        request: "prop_trading_user_subscription",
        email: paidAccount.client.email,
        documentType: 1,
        document: paidAccount.client.cpf.replace(/\D/g, ""),
        firstName,
        lastName,
        dateOfBirth: paidAccount.client.birthDate.toISOString().split("T")[0],
        subscriptionPlanId: getSubscriptionPlanId(paidAccount.platform),
        testAccount: BROKER_CONFIG.paidAccount, // Nova conta para remunerada
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/create-account", payload);

      if (response.data.success) {
        await activatePaidAccount(paidAccount.id);
        toast({
          title: "Sucesso",
          description: "Plataforma liberada com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro na ativação:", error);
      toast({
        title: "Erro",
        description: "Falha ao liberar plataforma",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleActivation}
      variant="outline"
      size="sm"
      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
    >
      Liberar Plataforma
    </Button>
  );
}
