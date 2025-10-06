const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
})

const percentageFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
})

export const formatCurrency = (value) => currencyFormatter.format(value || 0)
export const formatPercent = (value) => percentageFormatter.format(value || 0)

export const formatMonths = (value) => {
  if (!value || !Number.isFinite(value)) return '—'
  const years = Math.floor(value / 12)
  const months = Math.round(value % 12)
  if (years <= 0) return `${months} meses`
  if (months === 0) return `${years} anos`
  return `${years}a ${months}m`
}
