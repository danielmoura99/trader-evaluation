"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Play, Square, Edit, Trash2 } from "lucide-react";
import { getSubscriptionPlanId } from "@/utils/plataform-helper";
import { BROKER_CONFIG } from "@/utils/broker-config";
import {
  activateMgcClient,
  cancelMgcClient,
  deleteMgcClient,
} from "../_actions";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelMgcForm } from "./cancel-mgc-form";

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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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

  const handleCancelAccount = async (data: {
    reason: "Cancelado" | "Reprovado";
  }) => {
    try {
      // Chamada da API para cancelar a plataforma
      const payload = {
        document: client.cpf.replace(/\D/g, ""),
        subscriptionPlanId: getSubscriptionPlanId(client.platform),
        testAccount: BROKER_CONFIG.mgcAccount,
        authenticationCode: BROKER_CONFIG.authenticationCode,
      };

      const response = await axios.post("/api/broker/cancel-account", payload);

      if (response.data.success) {
        // Cancelamento na plataforma foi bem-sucedido, agora atualizar o banco de dados
        await cancelMgcClient(client.id, data.reason);

        setCancelDialogOpen(false);

        toast({
          title: "Sucesso",
          description: `Conta ${data.reason.toLowerCase()} com sucesso`,
        });

        // Recarregar a página para atualizar a lista
        window.location.reload();
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

  const handleDeleteClient = async () => {
    // Confirmação antes de excluir
    if (
      !confirm(
        `Tem certeza que deseja excluir o cliente ${client.name}? Esta ação não pode ser desfeita.`
      )
    )
      return;

    try {
      await deleteMgcClient(client.id);
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });

      // Recarregar a página para atualizar a tabela
      window.location.reload();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        title: "Erro",
        description: "Falha ao excluir o cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
            onClick={() => setCancelDialogOpen(true)}
            variant="outline"
            size="sm"
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
          >
            <Square className="h-4 w-4 mr-2" />
            Cancelar Plataforma
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

        <Button
          onClick={handleDeleteClient}
          variant="outline"
          size="sm"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      {/* Dialog para confirmação de cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Cancelar Plataforma
            </DialogTitle>
          </DialogHeader>
          <CancelMgcForm
            client={client}
            onSubmit={handleCancelAccount}
            onCancel={() => setCancelDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
