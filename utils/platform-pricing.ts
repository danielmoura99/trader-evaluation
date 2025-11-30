// utils/platform-pricing.ts
// Utilitário para gerenciar preços das plataformas

/**
 * Preços das plataformas em centavos
 * Facilita cálculos e evita problemas com ponto flutuante
 */
export const PLATFORM_PRICES = {
  "Profit One": 9850, // R$ 98,50
  "Profit Pro": 22600, // R$ 226,00
  "Profit Teste": 1000, // R$ 10,00 (para testes)
} as const;

/**
 * Tipos para type safety
 */
export type PlatformType = keyof typeof PLATFORM_PRICES;

/**
 * Obter preço de uma plataforma
 * @param platform Nome da plataforma
 * @returns Preço em centavos ou null se plataforma não encontrada
 */
export function getPlatformPrice(platform: string): number | null {
  if (platform in PLATFORM_PRICES) {
    return PLATFORM_PRICES[platform as PlatformType];
  }
  return null;
}

/**
 * Formatar valor em centavos para exibição
 * @param centavos Valor em centavos
 * @returns String formatada (ex: "R$ 98,50")
 */
export function formatCurrency(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Verificar se uma plataforma é válida
 * @param platform Nome da plataforma
 * @returns true se a plataforma existe
 */
export function isValidPlatform(platform: string): platform is PlatformType {
  return platform in PLATFORM_PRICES;
}

/**
 * Obter lista de todas as plataformas disponíveis
 * @returns Array com nomes das plataformas
 */
export function getAvailablePlatforms(): PlatformType[] {
  return Object.keys(PLATFORM_PRICES) as PlatformType[];
}
