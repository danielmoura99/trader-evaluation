import { z } from "zod";

export const TraderStatus = {
  WAITING: "Aguardando Inicio",
  IN_PROGRESS: "Em Curso",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
} as const;

// Adicionar novo status para PaidAccount
export const PaidAccountStatus = {
  WAITING: "Aguardando",
  ACTIVE: "Ativo",
  CANCELLED: "Cancelado",
} as const;

// Tipo para o Contato
export const contactSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  status: z.enum(["Sem contato", "Contatado", "Não Interessado", "Convertido"]),
  date: z.date(),
  notes: z.string(),
  createdAt: z.date(),
});

export type Contact = z.infer<typeof contactSchema>;
export type TraderStatusType = (typeof TraderStatus)[keyof typeof TraderStatus];
export type PaidAccountStatusType =
  (typeof PaidAccountStatus)[keyof typeof PaidAccountStatus];

// Adicionar schema para PaidAccount
export const paidAccountSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  platform: z.string(),
  plan: z.string(),
  status: z.enum([
    PaidAccountStatus.WAITING,
    PaidAccountStatus.ACTIVE,
    PaidAccountStatus.CANCELLED,
  ]),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaidAccount = z.infer<typeof paidAccountSchema>;

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
  observation: z.string().optional().default(""),
  cancellationDate: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  contacts: z.array(contactSchema).optional(),
  //paidAccount: paidAccountSchema.optional(),
});

export type Client = z.infer<typeof clientSchema>;
