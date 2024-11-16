import { z } from "zod";

export const TraderStatus = {
  WAITING: "Aguardando Inicio",
  IN_PROGRESS: "Em Curso",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
} as const;

// Exporte o tipo TraderStatusType
export type TraderStatusType = (typeof TraderStatus)[keyof typeof TraderStatus];

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  phone: z.string().min(1, "Telefone é obrigatório"),
  birthDate: z.date(),
  address: z.string().min(1, "Endereço é obrigatório"),
  zipCode: z.string().min(8, "CEP inválido").max(9),
  email: z.string().email("E-mail inválido"),
  platform: z.string().min(1, "Plataforma é obrigatória"),
  plan: z.string().min(1, "Plano é obrigatório"),
  traderStatus: z.enum([
    TraderStatus.WAITING,
    TraderStatus.IN_PROGRESS,
    TraderStatus.APPROVED,
    TraderStatus.REJECTED,
  ]),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  observation: z.string().optional().nullable(),
  cancellationDate: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Client = z.infer<typeof clientSchema>;
