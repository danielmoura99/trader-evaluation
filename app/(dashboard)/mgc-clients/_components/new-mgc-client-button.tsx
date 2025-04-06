/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewMgcClientForm } from "./new-mgc-client-form";
import { useToast } from "@/hooks/use-toast";
import { createMgcClient } from "../_actions";

export function NewMgcClientButton() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      await createMgcClient(data);
      setOpen(false);
      toast({
        title: "Cliente MGC criado",
        description: "O cliente foi adicionado com sucesso.",
      });

      // Recarregar a página para mostrar o novo cliente
      window.location.reload();
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar criar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-400 hover:bg-green-500">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente MGT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Novo Cliente MGT</DialogTitle>
        </DialogHeader>
        <NewMgcClientForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
