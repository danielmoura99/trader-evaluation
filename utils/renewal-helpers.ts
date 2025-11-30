// utils/renewal-helpers.ts
// Helpers para formatação e validação de renovações

import { PlatformRenewalStatus } from "@/lib/services/platform-renewal-service";

/**
 * Retorna mensagem amigável baseada no status de renovação
 */
export function getRenewalStatusMessage(
  renewalStatus: PlatformRenewalStatus
): string {
  const { canRenew, daysUntilExpiration } = renewalStatus;

  if (daysUntilExpiration < 0) {
    const daysOverdue = Math.abs(daysUntilExpiration);
    return `Sua plataforma venceu há ${daysOverdue} dia${daysOverdue !== 1 ? "s" : ""}. Renove agora para continuar operando.`;
  }

  if (daysUntilExpiration === 0) {
    return "Sua plataforma vence hoje! Renove agora para não perder acesso.";
  }

  if (canRenew && daysUntilExpiration <= 3) {
    return `Faltam ${daysUntilExpiration} dia${daysUntilExpiration !== 1 ? "s" : ""} para vencer. Renove agora para garantir continuidade.`;
  }

  return `Sua plataforma está ativa. Faltam ${daysUntilExpiration} dias para o vencimento.`;
}

/**
 * Retorna classe CSS baseada no status de renovação
 */
export function getRenewalStatusColor(
  renewalStatus: PlatformRenewalStatus
): {
  badge: string;
  text: string;
  button: string;
} {
  const { daysUntilExpiration } = renewalStatus;

  if (daysUntilExpiration < 0) {
    return {
      badge: "bg-red-100 text-red-800 border-red-200",
      text: "text-red-600 font-bold",
      button: "bg-red-600 hover:bg-red-700",
    };
  }

  if (daysUntilExpiration === 0) {
    return {
      badge: "bg-red-100 text-red-800 border-red-200",
      text: "text-red-600 font-bold",
      button: "bg-red-600 hover:bg-red-700",
    };
  }

  if (daysUntilExpiration <= 3) {
    return {
      badge: "bg-orange-100 text-orange-800 border-orange-200",
      text: "text-orange-600 font-semibold",
      button: "bg-orange-600 hover:bg-orange-700",
    };
  }

  if (daysUntilExpiration <= 7) {
    return {
      badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
      text: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    };
  }

  return {
    badge: "bg-green-100 text-green-800 border-green-200",
    text: "text-green-600",
    button: "bg-green-600 hover:bg-green-700",
  };
}

/**
 * Formatar data de vencimento
 */
export function formatExpirationDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Formatar CPF para envio (sem pontuação)
 */
export function sanitizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Validar CPF (algoritmo simplificado)
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = sanitizeCpf(cpf);
  return cleaned.length === 11 && /^\d{11}$/.test(cleaned);
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Retorna tempo restante do PIX em formato legível
 */
export function getPixTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expirado";
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes}min`;
}

/**
 * Verificar se PIX está expirado
 */
export function isPixExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Formatar status de renovação para exibição
 */
export function formatRenewalStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    completed: "Concluída",
    failed: "Falhou",
    expired: "Expirada",
  };

  return statusMap[status] || status;
}

/**
 * Retorna ícone baseado no tipo de renovação
 */
export function getRenewalTypeIcon(renewalType: "evaluation" | "paid_account"): string {
  return renewalType === "evaluation" ? "📊" : "💰";
}

/**
 * Retorna label do tipo de renovação
 */
export function getRenewalTypeLabel(renewalType: "evaluation" | "paid_account"): string {
  return renewalType === "evaluation" ? "Avaliação" : "Conta Paga";
}
