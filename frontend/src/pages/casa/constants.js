export function mesKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function mesLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function prevMes(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return mesKey(d)
}

export function nextMes(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m, 1)
  return mesKey(d)
}

export function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export function formatUSD(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export function numInput(val, set) {
  return (e) => set(e.target.value === '' ? '' : e.target.value)
}

export const GASTOS_FIJOS_DEFAULT = [
  'BBVA', 'Seguro Auto/casa', 'ICBC', 'Naranja Tarjeta',
  'Inmobiliaria', 'Contador', 'Maternal', 'Monotributo',
  'Préstamo TERE', 'Servicios', 'Patente',
]

export const INGRESOS_DEFAULT = [
  'HOLAHELLO', 'iP Hoteles', 'Jero Montagna', 'App GYM',
  'Megacompras', 'Peak', 'Cheeky', 'Leandro', 'FRAMAR',
  'CHEIL ARGENTINA', 'Quatro Performance', 'SIGLO 21',
]
