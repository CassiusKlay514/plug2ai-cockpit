// Utilitaires de formatage français
export function formatEur(n, { decimals = 0 } = {}) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n))
}

export function formatEurShort(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  const v = Number(n)
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')} k€`
  return `${v.toFixed(0)} €`
}

export function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('fr-FR').format(Number(n))
}

export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateShort(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit',
  })
}
