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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Schema de validação para o formulário de novo cliente MGC
const newMgcClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido"),
  birthDate: z
    .date({
      required_error: "Data de nascimento é obrigatória",
      invalid_type_error: "Data de nascimento inválida",
    })
    .refine((date) => !isNaN(date.getTime()), {
      message: "Data de nascimento inválida",
    }),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  platform: z.string().min(1, "Plataforma é obrigatória"),
  plan: z.string().min(1, "Plano é obrigatório"),
  observation: z.string().optional(),
});

type NewMgcClientForm = z.infer<typeof newMgcClientSchema>;

interface NewMgcClientFormProps {
  onSubmit: (data: NewMgcClientForm) => void;
  onCancel: () => void;
}

export function NewMgcClientForm({
  onSubmit,
  onCancel,
}: NewMgcClientFormProps) {
  const form = useForm<NewMgcClientForm>({
    resolver: zodResolver(newMgcClientSchema),
    defaultValues: {
      name: "",
      cpf: "",
      phone: "",
      email: "",
      birthDate: new Date(),
      address: "",
      zipCode: "",
      platform: "Profit One",
      plan: "TC - MGC",
      observation: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-zinc-200">
            Informações Básicas
          </h3>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={(() => {
                        try {
                          // Verifica se o valor é uma data válida
                          if (
                            field.value instanceof Date &&
                            !isNaN(field.value.getTime())
                          ) {
                            return field.value.toISOString().split("T")[0];
                          }
                          return "";
                        } catch (error) {
                          console.error("Erro ao formatar data:", error);
                          return "";
                        }
                      })()}
                      onChange={(e) => {
                        try {
                          const date = new Date(e.target.value);
                          // Verifica se a data é válida antes de atualizar
                          if (!isNaN(date.getTime())) {
                            field.onChange(date);
                          } else {
                            // Se a data for inválida, exibe um erro
                            form.setError("birthDate", {
                              type: "manual",
                              message: "Data inválida",
                            });
                          }
                        } catch (error) {
                          console.error("Erro ao processar data:", error);
                          form.setError("birthDate", {
                            type: "manual",
                            message: "Formato de data inválido",
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-zinc-200">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Informações da Plataforma */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-zinc-200">
            Informações da Plataforma
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
            name="observation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Observações adicionais sobre o cliente"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
