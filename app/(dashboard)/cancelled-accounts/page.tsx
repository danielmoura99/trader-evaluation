// app/(dashboard)/cancelled-accounts/page.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { getCancelledAccounts, updatePaidAccount } from "../paid-accounts/_actions";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaidAccount } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditPaidAccountForm } from "../paid-accounts/_components/edit-paid-account-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Filter, X } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

declare global {
  interface Window {
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

function CancelledAccountsContent() {
  const [accounts, setAccounts] = useState<
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
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getCancelledAccounts();
      setAccounts(
        data as (PaidAccount & {
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
          "Ocorreu um erro ao carregar a lista de contas canceladas.",
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

  // Filtrar contas por data de cancelamento
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (!account.endDate) return false;

      const cancelDate = new Date(account.endDate);
      cancelDate.setHours(0, 0, 0, 0);

      if (startDateFilter) {
        const startFilter = new Date(startDateFilter);
        startFilter.setHours(0, 0, 0, 0);
        if (cancelDate < startFilter) return false;
      }

      if (endDateFilter) {
        const endFilter = new Date(endDateFilter);
        endFilter.setHours(23, 59, 59, 999);
        if (cancelDate > endFilter) return false;
      }

      return true;
    });
  }, [accounts, startDateFilter, endDateFilter]);

  // Função para exportar para Excel
  const handleExportToExcel = () => {
    if (filteredAccounts.length === 0) {
      toast({
        title: "⚠️ Atenção",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para exportação
    const exportData = filteredAccounts.map((account) => ({
      Nome: account.client.name,
      Telefone: account.client.phone,
      Plataforma: account.platform,
      Plano: account.plan,
      "Data de Cancelamento": account.endDate
        ? format(new Date(account.endDate), "dd/MM/yyyy")
        : "-",
      Observação: account.client.observation || "-",
    }));

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contas Canceladas");

    // Gerar nome do arquivo com data/hora
    const fileName = `contas-canceladas_${format(new Date(), "dd-MM-yyyy_HH-mm")}.xlsx`;

    // Download
    XLSX.writeFile(wb, fileName);

    toast({
      title: "✅ Sucesso",
      description: `${filteredAccounts.length} registro(s) exportado(s) para Excel`,
    });
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
  };

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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">
          Traders Cancelados
        </h1>

        <Button
          onClick={handleExportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Filtros por Data de Cancelamento */}
      <div className="mb-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-300">
            Filtrar por Data de Cancelamento
          </h3>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">De:</label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Até:</label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
            />
          </div>

          {(startDateFilter || endDateFilter) && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}

          <div className="text-sm text-zinc-400 ml-auto">
            {filteredAccounts.length} conta(s) encontrada(s)
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 text-xl">
              ✏️ Editar Conta Cancelada
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

      <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <DataTable
          columns={columns}
          data={filteredAccounts}
          searchColumn="client.name"
        />
      </div>
    </div>
  );
}

export default function CancelledAccountsPage() {
  return (
    <div className="w-full">
      <CancelledAccountsContent />
    </div>
  );
}
