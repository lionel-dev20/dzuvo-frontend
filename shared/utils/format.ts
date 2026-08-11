/** Date lisible en français : « 12 mars 2026 ». */
export function formatDate(input: string | Date, locale = 'fr-FR'): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

export function formatNumber(value: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatCurrency(value: number, currency = 'EUR', locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

/**
 * Prix de la boutique : « 64,99 $ ». Convention canadienne-française, symbole
 * après le montant, deux décimales toujours affichées.
 */
export function formatPrice(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} $`
}

/** Arrondi monétaire : évite les 19,999999 999 des additions en virgule flottante. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Transforme un titre en slug d'URL : « Design & UX » → « design-ux ». */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(value: string, max = 160): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`
}
