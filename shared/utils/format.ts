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
