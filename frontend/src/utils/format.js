/* src/utils/format.js — helpers compartidos de formato */

/** Formatea un número como pesos argentinos: $ 7.500 */
export function formatPrecio(n) {
  if (n == null) return '—'
  return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** Formatea fecha ISO a dd/mm/yyyy HH:MM */
export function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFechaHora(iso) {
  return formatFecha(iso)
}

/** Variación de precio formateada con signo */
export function formatVariacion(pct) {
  if (pct == null) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${Number(pct).toFixed(1)} %`
}
