import { z } from "zod";

export const TraderStatus = {
  WAITING: "Aguardando Inicio",
  IN_PROGRESS: "Em Curso",
  APPROVED: "Aprovado",
  REJECTED: "Reprovado",
  DIRECT: "Direto",
  AWAITING_PAYMENT: "Aguardando Pagamento",
} as const;

// Adicionar novo status para PaidAccount
export const PaidAccountStatus = {
  WAITING: "Aguardando",
  ACTIVE: "Ativo",
  CANCELLED: "Cancelado",
  AWAITING_PAYMENT: "Aguardando Pagamento",
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
    PaidAccountStatus.AWAITING_PAYMENT,
  ]),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  client: z
    .object({
      name: z.string(),
      email: z.string(),
      cpf: z.string(),
      birthDate: z.date(),
      startDate: z.date().nullable(), // ✅ ADICIONADO: Data de início do cliente (do formulário)
    })
    .optional(),
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
    TraderStatus.DIRECT,
    TraderStatus.AWAITING_PAYMENT,
  ]),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  platformStartDate: z.date().optional().nullable(),
  observation: z.string().optional().default(""),
  cancellationDate: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  contacts: z.array(contactSchema).optional(),
  //paidAccount: paidAccountSchema.optional(),
});

export type Client = z.infer<typeof clientSchema>;

// ✅ Função helper para verificar se um status conta para estatísticas de aprovação
export function isEvaluationStatus(status: TraderStatusType): boolean {
  return status === TraderStatus.APPROVED || status === TraderStatus.REJECTED;
}

// ✅ Função helper para verificar se é um plano direto
export function isDirectPlan(planName: string): boolean {
  return planName.includes("DIRETO");
}

// ✅ Função para processar nome do plano
export function processPlanName(description: string): string {
  // Exemplos:
  // "Trader DIRETO 5 - Profit One | THP" → "TC DIRETO - 5"
  // "Trader DIRETO 10 - Profit One | THP" → "TC DIRETO - 10"
  // "Trader 100K - Profit One | THP" → "TC - 100K"
  // "Black 1M | THP" → "Black 1M"
  // "Avaliação Black 1M | THP" → "Black 1M"

  console.log("[processPlanName] Descrição original:", description);

  const isDirect = description.toLowerCase().includes("direto");
  const isMGT = description.toLowerCase().includes("mgt");

  let processedPlan: string;

  if (isDirect) {
    // ✅ Para planos DIRETO: extrair número simples (5, 10, 20, 25)
    const directMatch = description.match(/DIRETO\s+(\d+)/i);
    const planValue = directMatch ? directMatch[1] : "5"; // Default para 5
    processedPlan = `TC DIRETO - ${planValue}`;
  } else if (isMGT) {
    processedPlan = `TC - MGT`;
  } else {
    // ✅ Primeiro: tentar extrair planos especiais (Black, Platinum, etc.)
    // Formato: "Black 1M | THP", "Platinum 500K | THP", "Avaliação Black 1M | THP"
    // ⚠️ NÃO captura "Trader 500K" (que deve virar "TC - 500K")
    const specialPlanMatch = description.match(
      /^(?:Avaliação\s+)?(Black|Platinum|Gold|Silver|Diamond)\s+\d+[MK]/i
    );

    if (specialPlanMatch) {
      // ✅ Plano especial encontrado - usar o nome sem o prefixo "Avaliação"
      processedPlan = specialPlanMatch[0].replace(/^Avaliação\s+/i, "").trim();
    } else {
      // ✅ Para planos normais: extrair valor com K (100K, 250K, etc.)
      const normalMatch = description.match(/(\d+K)/i);
      const planValue = normalMatch ? normalMatch[1].toUpperCase() : "50K"; // Default
      processedPlan = `TC - ${planValue}`;
    }
  }

  console.log("[processPlanName] Plano processado:", processedPlan);

  return processedPlan;
}

// ✅ Função para extrair plataforma do nome
export function extractPlatform(description: string): string {
  if (description.toLowerCase().includes("profit pro")) {
    return "Profit Pro";
  } else if (description.toLowerCase().includes("profit one")) {
    return "Profit One";
  }
  return "Profit One"; // Default
}
