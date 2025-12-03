// app/(dashboard)/paid-accounts/_components/edit-paid-account-form.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaidAccountStatus } from "@/app/types";
import { Textarea } from "@/components/ui/textarea";

// ✅ Schema expandido para incluir todos os campos editáveis
const editPaidAccountSchema = z.object({
  // Dados da conta remunerada
  platform: z.string().min(1, "Plataforma é obrigatória"),
  plan: z.string().min(1, "Plano é obrigatório"),
  status: z.enum(["Aguardando", "Ativo", "Cancelado", "Aguardando Pagamento"]),

  // Datas da conta remunerada
  startDate: z.date().nullable().optional(), // Data de ativação na plataforma
  endDate: z.date().nullable().optional(), // Data de cancelamento

  // Dados do cliente (campos editáveis)
  clientName: z.string().min(1, "Nome é obrigatório"),
  clientEmail: z.string().email("E-mail inválido"),
  clientStartDate: z.date().nullable().optional(), // Data de início escolhida pelo cliente
  clientObservation: z.string().optional(),
});

type EditPaidAccountForm = z.infer<typeof editPaidAccountSchema>;

interface EditPaidAccountFormProps {
  initialData: {
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
    clientObservation?: string | null;
  };
  onSubmit: (data: EditPaidAccountForm) => void;
  onCancel: () => void;
}

export function EditPaidAccountForm({
  initialData,
  onSubmit,
  onCancel,
}: EditPaidAccountFormProps) {
  const form = useForm<EditPaidAccountForm>({
    resolver: zodResolver(editPaidAccountSchema),
    defaultValues: {
      platform: initialData.platform,
      plan: initialData.plan,
      status: initialData.status as
        | "Aguardando"
        | "Ativo"
        | "Cancelado"
        | "Aguardando Pagamento",
      startDate: initialData.startDate,
      endDate: initialData.endDate,
      clientName: initialData.clientName,
      clientEmail: initialData.clientEmail,
      clientStartDate: initialData.clientStartDate,
      clientObservation: initialData.clientObservation || "",
    },
  });

  const watchedStatus = form.watch("status");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ✅ SEÇÃO: Dados do Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">
            📋 Informações do Cliente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail do Cliente</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@exemplo.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="clientStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início (escolhida pelo cliente)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* ✅ NOVO: Campo Observação */}
          <FormField
            control={form.control}
            name="clientObservation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Observações sobre o cliente..."
                    className="min-h-[80px] resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ✅ SEÇÃO: Dados da Conta Remunerada */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">
            💰 Configurações da Conta Remunerada
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plataforma</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a plataforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Profit One">Profit One</SelectItem>
                      <SelectItem value="Profit Pro">Profit Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TC - MGT">TC - MGT</SelectItem>
                      <SelectItem value="TC - 50K">TC - 50K</SelectItem>
                      <SelectItem value="TC - 100K">TC - 100K</SelectItem>
                      <SelectItem value="TC - 250K">TC - 250K</SelectItem>
                      <SelectItem value="TC - 500K">TC - 500K</SelectItem>
                      <SelectItem value="TC DIRETO - 5">
                        TC DIRETO - 5
                      </SelectItem>
                      <SelectItem value="TC DIRETO - 10">
                        TC DIRETO - 10
                      </SelectItem>
                      <SelectItem value="TC DIRETO - 20">
                        TC DIRETO - 20
                      </SelectItem>
                      <SelectItem value="TC DIRETO - 25">
                        TC DIRETO - 25
                      </SelectItem>
                      <SelectItem value="Trader Estrategista">
                        Trader Estrategista
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Conta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PaidAccountStatus.WAITING}>
                      🟡 Aguardando
                    </SelectItem>
                    <SelectItem value={PaidAccountStatus.ACTIVE}>
                      🟢 Ativo
                    </SelectItem>
                    <SelectItem value={PaidAccountStatus.AWAITING_PAYMENT}>
                      ⏳ Aguardando Pagamento
                    </SelectItem>
                    <SelectItem value={PaidAccountStatus.CANCELLED}>
                      🔴 Cancelado
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ✅ SEÇÃO: Datas da Conta (condicionais baseadas no status) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-200">
            📅 Datas da Conta Remunerada
          </h3>

          {/* Data de Ativação - apenas se status for Ativo */}
          {watchedStatus === PaidAccountStatus.ACTIVE && (
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Ativação na Plataforma</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Data de Cancelamento - apenas se status for Cancelado */}
          {watchedStatus === PaidAccountStatus.CANCELLED && (
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Cancelamento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? new Date(field.value).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ✅ Botões de Ação */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-700">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            💾 Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
