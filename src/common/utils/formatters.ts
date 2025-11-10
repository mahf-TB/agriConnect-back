// Formatte une date en ISO string lisible
export function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

// Arrondit un nombre à 2 décimales
export function formatDecimal(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  return Number(parseFloat(value.toString()).toFixed(2));
}

// Met la première lettre d’un mot en majuscule
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}