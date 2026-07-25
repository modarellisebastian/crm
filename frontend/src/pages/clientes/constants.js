export function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

export function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = (iso.split('T')[0]).split('-')
  return `${d}/${m}/${y}`
}

export function diasHasta(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

export const HOY = new Date().toISOString().split('T')[0]

export const TIPOS_PAGO = ['proyecto', 'mantenimiento', 'hosting', 'soporte']

export const TIPO_LABEL = {
  proyecto:      'Proyecto',
  mantenimiento: 'Mantenimiento',
  hosting:       'Hosting',
  soporte:       'Soporte',
}

export const TIPO_SHORT = {
  proyecto:      'Proy.',
  mantenimiento: 'Mant.',
  hosting:       'Host.',
  soporte:       'Sop.',
}

export const TIPO_BADGE = {
  proyecto:      'bg-purple-50 text-purple-700 ring-purple-100',
  mantenimiento: 'bg-blue-50 text-blue-700 ring-blue-100',
  hosting:       'bg-amber-50 text-amber-700 ring-amber-100',
  soporte:       'bg-teal-50 text-teal-700 ring-teal-100',
}

export const TIPO_DOT = {
  proyecto:      'bg-purple-400',
  mantenimiento: 'bg-blue-400',
  hosting:       'bg-amber-400',
  soporte:       'bg-teal-400',
}

export const SERVICIO_BADGE = {
  recurrente: 'bg-blue-50 text-blue-700 ring-blue-100',
  unico:      'bg-gray-100 text-gray-600 ring-gray-200',
}

export const FRECUENCIA_LABEL = { mensual: '/mes', anual: '/año' }
