// app/(dashboard)/paid-accounts/page.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { getPaidAccounts, updatePaidAccount } from "./_actions";
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
          birthDate: Date;
          startDate: Date | null; // ✅ Incluindo startDate do cliente
        };
      }
    ) => void;
  }
}

function PaidAccountsContent() {
  const [accounts, setAccounts] = useState<
    (PaidAccount & {
      client: {
        name: string;
        email: string;
        cpf: string;
        birthDate: Date;
        startDate: Date | null; // ✅ Incluindo startDate do cliente
      };
    })[]
  >([]);
  const [editingAccount, setEditingAccount] = useState<
    | (PaidAccount & {
        client: {
          name: string;
          email: string;
          cpf: string;
          birthDate: Date;
          startDate: Date | null;
        };
      })
    | null
  >(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getPaidAccounts();
      setAccounts(
        data as (PaidAccount & {
          client: {
            name: string;
            email: string;
            cpf: string;
            birthDate: Date;
            startDate: Date | null;
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
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
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <DataTable
          columns={columns}
          data={accounts}
          searchColumn="client.name"
        />
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
