//app/(dashboard)/mgc-clients/_components/cancel-mgc-form.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const cancelMgcSchema = z.object({
  reason: z.enum(["Cancelado", "Reprovado"]),
});

type CancelMgcForm = z.infer<typeof cancelMgcSchema>;

interface CancelMgcFormProps {
  client: {
    id: string;
    cpf: string;
    platform: string;
    name: string;
  };
  onSubmit: (data: CancelMgcForm) => void;
  onCancel: () => void;
}

export function CancelMgcForm({
  client,
  onSubmit,
  onCancel,
}: CancelMgcFormProps) {
  const form = useForm<CancelMgcForm>({
    resolver: zodResolver(cancelMgcSchema),
    defaultValues: {
      reason: "Cancelado", // Valor padrão
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <h4 className="font-medium text-lg text-zinc-100">
            Cancelar plataforma para: {client.name}
          </h4>
          <p className="text-zinc-400 text-sm mt-1">
            Selecione o motivo do cancelamento da plataforma. Se escolher
            Reprovado, o cliente será adicionado à página de contatos reprovados
            para follow-up.
          </p>
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo do Cancelamento</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cancelado">
                    Cancelado (Encerramento normal)
                  </SelectItem>
                  <SelectItem value="Reprovado">
                    Reprovado (Adicionar para contato)
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Voltar
          </Button>
          <Button type="submit" variant="destructive">
            Confirmar Cancelamento
          </Button>
        </div>
      </form>
    </Form>
  );
}
