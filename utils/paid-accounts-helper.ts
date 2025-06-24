// utils/paid-accounts-helper.ts
// Utilitários para cálculos de vencimento de contas remuneradas

/**
 * Calcula quantos dias faltam para uma conta vencer
 * @param activationDate Data de ativação da conta
 * @param validityDays Período de validade em dias (padrão: 30)
 * @returns Número de dias até vencer (negativo se vencido)
 */
export function calculateDaysToExpire(
  activationDate: Date | string,
  validityDays: number = 30
): number {
  const activation = new Date(activationDate);
  const expiration = new Date(activation);
  expiration.setDate(activation.getDate() + validityDays);

  // Data atual (sem horário para comparação precisa)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiration.setHours(0, 0, 0, 0);

  // Calcular diferença em dias
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a classe CSS apropriada baseada nos dias restantes
 * @param daysToExpire Dias até vencer
 * @returns Classe CSS para coloração
 */
export function getDaysToExpireColor(daysToExpire: number): string {
  if (daysToExpire < 0) {
    return "text-red-500 font-bold"; // Vencido
  } else if (daysToExpire === 0) {
    return "text-red-500 font-bold"; // Vence hoje
  } else if (daysToExpire <= 3) {
    return "text-red-500 font-medium"; // Crítico (1-3 dias)
  } else if (daysToExpire <= 7) {
    return "text-yellow-500 font-medium"; // Atenção (4-7 dias)
  } else {
    return "text-green-500"; // Normal (8+ dias)
  }
}

/**
 * Formata a exibição dos dias para vencer
 * @param daysToExpire Dias até vencer
 * @returns String formatada para exibição
 */
export function formatDaysToExpire(daysToExpire: number): string {
  if (daysToExpire < 0) {
    const days = Math.abs(daysToExpire);
    return `Vencido há ${days} dia${days !== 1 ? "s" : ""}`;
  } else if (daysToExpire === 0) {
    return "Vence hoje";
  } else {
    return `${daysToExpire} dia${daysToExpire !== 1 ? "s" : ""}`;
  }
}

/**
 * Retorna a data de vencimento de uma conta
 * @param activationDate Data de ativação
 * @param validityDays Período de validade (padrão: 30)
 * @returns Data de vencimento
 */
export function getExpirationDate(
  activationDate: Date | string,
  validityDays: number = 30
): Date {
  const activation = new Date(activationDate);
  const expiration = new Date(activation);
  expiration.setDate(activation.getDate() + validityDays);
  return expiration;
}
