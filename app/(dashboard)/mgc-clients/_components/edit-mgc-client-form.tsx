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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const editMgcClientSchema = z.object({
  platform: z.string().min(1, "Plataforma é obrigatória"),
  plan: z.string().min(1, "Plano é obrigatório"),
  observation: z.string().optional(),
  startDate: z.date().nullable().optional(),
});

type EditMgcClientForm = z.infer<typeof editMgcClientSchema>;

interface EditMgcClientFormProps {
  initialData: {
    platform: string;
    plan: string;
    observation?: string;
    startDate?: Date | null;
  };
  onSubmit: (data: EditMgcClientForm) => void;
  onCancel: () => void;
}

export function EditMgcClientForm({
  initialData,
  onSubmit,
  onCancel,
}: EditMgcClientFormProps) {
  const form = useForm<EditMgcClientForm>({
    resolver: zodResolver(editMgcClientSchema),
    defaultValues: {
      ...initialData,
      // startDate já deve ser um objeto Date correto passado pelo componente pai
      startDate: initialData.startDate,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plataforma</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Ativação</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    field.value instanceof Date && !isNaN(field.value.getTime())
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      // Criar a data a partir da string (formato YYYY-MM-DD)
                      const dateStr = e.target.value;
                      const [year, month, day] = dateStr.split("-").map(Number);

                      // Criar uma data usando o fuso horário local (sem o problema de UTC)
                      const localDate = new Date(year, month - 1, day);

                      field.onChange(localDate);
                    } else {
                      field.onChange(null);
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
