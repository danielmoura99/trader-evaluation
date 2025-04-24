/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns } from "./_columns/columns";
import { getMgcClients, updateMgcClient } from "./_actions";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditMgcClientForm } from "./_components/edit-mgc-client-form";
import { NewMgcClientButton } from "./_components/new-mgc-client-button";

declare global {
  interface Window {
    activateMgcClient: (id: string) => Promise<void>;
    editMgcClient: (client: any) => void;
    deleteMgcClient?: (id: string) => Promise<void>;
  }
}

function MgcClientsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      const data = await getMgcClients();
      setClients(data);
    } catch {
      toast({
        title: "Erro ao carregar clientes",
        description: "Ocorreu um erro ao carregar a lista de clientes MGT.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.editMgcClient = (client) => {
        setEditingClient(client);
        setEditModalOpen(true);
      };
    }
  }, []);

  const handleEditSubmit = async (data: {
    platform: string;
    plan: string;
    observation?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    status: string;
  }) => {
    try {
      if (editingClient) {
        await updateMgcClient(editingClient.id, data);
        setEditModalOpen(false);
        fetchClients();
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o cliente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">Clientes MGT</h1>
        <NewMgcClientButton />
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              Editar Cliente MGT
            </DialogTitle>
          </DialogHeader>
          {editingClient && (
            <EditMgcClientForm
              initialData={{
                platform: editingClient.platform,
                plan: editingClient.plan,
                observation: editingClient.observation || "",
                startDate: editingClient.startDate
                  ? new Date(editingClient.startDate)
                  : null,
                endDate: editingClient.endDate
                  ? new Date(editingClient.endDate)
                  : null,
                status: editingClient.status || "Aguardando",
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
        <DataTable columns={columns} data={clients} searchColumn="name" />
      </div>
    </div>
  );
}

export default function MgcClientsPage() {
  return (
    <div className="w-full">
      <MgcClientsContent />
    </div>
  );
}
