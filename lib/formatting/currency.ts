export function formatCurrency(amount: number, currency = 'PKR'): string {
  return new Intl.NumberFormat(getFormattingLocale(), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCurrencyAmount(amount: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(getFormattingLocale(), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function getFormattingLocale(): string {
  return typeof document !== 'undefined' && document.documentElement.lang === 'ur' ? 'ur-PK' : 'en-PK';
}
