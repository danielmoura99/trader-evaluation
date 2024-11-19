import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const finishEvaluationSchema = z.object({
  status: z.enum(["Aprovado", "Reprovado"]),
});

type FinishEvaluationForm = z.infer<typeof finishEvaluationSchema>;

interface FinishEvaluationFormProps {
  onSubmit: (data: FinishEvaluationForm) => void;
  onCancel: () => void;
}

export function FinishEvaluationForm({
  onSubmit,
  onCancel,
}: FinishEvaluationFormProps) {
  const form = useForm<FinishEvaluationForm>({
    resolver: zodResolver(finishEvaluationSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status Final</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Finalizar</Button>
        </div>
      </form>
    </Form>
  );
}
