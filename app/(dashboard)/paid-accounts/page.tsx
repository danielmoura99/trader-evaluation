// app/(dashboard)/paid-accounts/page.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import {
  getWaitingAccounts,
  getActiveAccounts,
  updatePaidAccount,
} from "./_actions";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaidAccount } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditPaidAccountForm } from "./_components/edit-paid-account-form";

declare global {
  interface Window {
    activatePaidAccount: (id: string) => Promise<void>;
    editPaidAccount: (
      account: PaidAccount & {
        client: {
          name: string;
          email: string;
          cpf: string;
          phone: string;
          birthDate: Date;
          startDate: Date | null;
          observation: string | null;
        };
      }
    ) => void;
  }
}

function PaidAccountsContent() {
  const [waitingAccounts, setWaitingAccounts] = useState<
    (PaidAccount & {
      client: {
        name: string;
        email: string;
        cpf: string;
        phone: string;
        birthDate: Date;
        startDate: Date | null;
        observation: string | null;
      };
    })[]
  >([]);
  const [activeAccounts, setActiveAccounts] = useState<
    (PaidAccount & {
      client: {
        name: string;
        email: string;
        cpf: string;
        phone: string;
        birthDate: Date;
        startDate: Date | null;
        observation: string | null;
      };
    })[]
  >([]);
  const [editingAccount, setEditingAccount] = useState<
    | (PaidAccount & {
        client: {
          name: string;
          email: string;
          cpf: string;
          phone: string;
          birthDate: Date;
          startDate: Date | null;
          observation: string | null;
        };
      })
    | null
  >(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      const [waiting, active] = await Promise.all([
        getWaitingAccounts(),
        getActiveAccounts(),
      ]);

      setWaitingAccounts(
        waiting as (PaidAccount & {
          client: {
            name: string;
            email: string;
            cpf: string;
            phone: string;
            birthDate: Date;
            startDate: Date | null;
            observation: string | null;
          };
        })[]
      );

      setActiveAccounts(
        active as (PaidAccount & {
          client: {
            name: string;
            email: string;
            cpf: string;
            phone: string;
            birthDate: Date;
            startDate: Date | null;
            observation: string | null;
          };
        })[]
      );
    } catch {
      toast({
        title: "Erro ao carregar contas",
        description:
          "Ocorreu um erro ao carregar a lista de contas remuneradas.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.editPaidAccount = (account) => {
        setEditingAccount(account);
        setEditModalOpen(true);
      };
    }
  }, []);

  // ✅ NOVO: Handler expandido para todos os campos
  const handleEditSubmit = async (data: {
    // Dados da conta remunerada
    platform: string;
    plan: string;
    status: string;
    startDate?: Date | null;
    endDate?: Date | null;

    // Dados do cliente
    clientName: string;
    clientEmail: string;
    clientStartDate?: Date | null;
    clientObservation?: string;
  }) => {
    try {
      if (editingAccount) {
        await updatePaidAccount(editingAccount.id, data);
        setEditModalOpen(false);
        fetchAccounts();
        toast({
          title: "✅ Sucesso",
          description: "Conta e dados do cliente atualizados com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "❌ Erro",
        description: "Ocorreu um erro ao atualizar os dados",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Contas Remuneradas
        </h1>
      </div>

      {/* ✅ Modal de edição expandido */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 text-xl">
              ✏️ Editar Conta Remunerada
            </DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <EditPaidAccountForm
              initialData={{
                // Dados da conta remunerada
                platform: editingAccount.platform,
                plan: editingAccount.plan,
                status: editingAccount.status,
                startDate: editingAccount.startDate,
                endDate: editingAccount.endDate,

                // Dados do cliente
                clientName: editingAccount.client.name,
                clientEmail: editingAccount.client.email,
                clientStartDate: editingAccount.client.startDate,
                clientObservation: editingAccount.client.observation,
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ TABELA 1: Contas Aguardando */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-zinc-200">
          🟡 Aguardando Liberação ({waitingAccounts.length})
        </h2>
        <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          <DataTable
            columns={columns}
            data={waitingAccounts}
            searchColumn="client.name"
          />
        </div>
      </div>

      {/* ✅ TABELA 2: Contas Ativas e Aguardando Pagamento */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-zinc-200">
          🟢 Contas Ativas ({activeAccounts.length})
        </h2>
        <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          <DataTable
            columns={columns}
            data={activeAccounts}
            searchColumn="client.name"
          />
        </div>
      </div>
    </div>
  );
}

export default function PaidAccountsPage() {
  return (
    <div className="w-full">
      <PaidAccountsContent />
    </div>
  );
}
