// components/platform-buttons.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const brokerApi = axios.create({
  baseURL: "https://api-broker3-dev.nelogica.com.br/",
  headers: {
    Origin: "localhost:3000",
  },
});

interface Client {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date;
}

interface PlatformButtonsProps {
  client: Client;
  onStartEvaluation: (id: string) => void;
}

export function PlatformButtons({
  client,
  onStartEvaluation,
}: PlatformButtonsProps) {
  const { toast } = useToast();

  const createBrokerAccount = async () => {
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
        dateOfBirth: client.birthDate.toISOString().split("T")[0],
        subscriptionPlanId: 5251,
        testAccount: "3030",
        authenticationCode: process.env.NEXT_PUBLIC_BROKER_TOKEN,
      };

      const response = await brokerApi.post("request.php", payload);

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Conta criada na corretora",
        });
        if (client.id) onStartEvaluation(client.id);
      }
    } catch (error) {
      console.error("Erro na integração:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar conta na corretora",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={createBrokerAccount}
      variant="outline"
      size="sm"
      className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"
    >
      <Play className="h-4 w-4 mr-2" />
      Liberar Plataforma teste
    </Button>
  );
}
