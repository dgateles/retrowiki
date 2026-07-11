/**
 * Concordância de número em pt-BR, sem a gambiarra "(s)/(ões)".
 *
 *   plural(1, "tópico", "tópicos")  → "tópico"
 *   plural(4, "tópico", "tópicos")  → "tópicos"
 */
export function plural(n: number, singular: string, pluralForm: string): string {
  return Math.abs(n) === 1 ? singular : pluralForm;
}

/**
 * Número + substantivo já concordados.
 *
 *   count(1, "tópico", "tópicos") → "1 tópico"
 *   count(4, "tópico", "tópicos") → "4 tópicos"
 */
export function count(n: number, singular: string, pluralForm: string): string {
  return `${n} ${plural(n, singular, pluralForm)}`;
}
