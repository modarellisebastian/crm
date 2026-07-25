export const ESTADOS = ['nuevo', 'contactado', 'sin_respuesta', 'interesado', 'en_espera', 'demo_enviado', 'negociando', 'cerrado', 'descartado']

export const PAGE_SIZE = 20

export const ORDEN_OPTIONS = [
  { key: 'score',      label: 'Score' },
  { key: 'movimiento', label: 'Último movimiento' },
  { key: 'creado',     label: 'Fecha scraping' },
]

export function sortLeads(arr, orden) {
  const comparar = {
    score:      (a, b) => (b.score ?? 0) - (a.score ?? 0) || new Date(b.created_at) - new Date(a.created_at),
    movimiento: (a, b) => new Date(b.fecha_ultimo_movimiento ?? b.created_at) - new Date(a.fecha_ultimo_movimiento ?? a.created_at),
    creado:     (a, b) => new Date(b.created_at) - new Date(a.created_at),
  }[orden] ?? ((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const activos     = arr.filter((l) => l.estado !== 'descartado').sort(comparar)
  const descartados = arr.filter((l) => l.estado === 'descartado').sort(comparar)
  return [...activos, ...descartados]
}

export const ESTADO_STYLES = {
  nuevo:          'bg-blue-100 text-blue-700',
  contactado:     'bg-yellow-100 text-yellow-700',
  sin_respuesta:  'bg-red-100 text-red-600',
  interesado:     'bg-teal-100 text-teal-700',
  en_espera:      'bg-indigo-100 text-indigo-700',
  demo_enviado:   'bg-purple-100 text-purple-700',
  negociando:     'bg-orange-100 text-orange-700',
  cerrado:        'bg-green-100 text-green-700',
  descartado:     'bg-gray-100 text-gray-500',
}

export const ESTADO_LABELS = {
  nuevo:          'Nuevo',
  contactado:     'Contactado',
  sin_respuesta:  'Sin respuesta',
  interesado:     'Interesado',
  en_espera:      'En espera',
  demo_enviado:   'Demo enviado',
  negociando:     'Negociando',
  cerrado:        'Cerrado',
  descartado:     'Descartado',
}

export const CAMPOS_TEXTO = [
  { key: 'nombre',    label: 'Nombre' },
  { key: 'rubro',     label: 'Rubro' },
  { key: 'ciudad',    label: 'Ciudad' },
  { key: 'url_web',   label: 'URL web' },
  { key: 'telefono',  label: 'Teléfono' },
  { key: 'whatsapp',  label: 'WhatsApp' },
  { key: 'email',     label: 'Email' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook' },
]

export const WA_TEMPLATES = (nombre) => [
  {
    key: 'primer_contacto',
    label: 'Primer contacto',
    emoji: '👋',
    // variantes: se elige una al azar al hacer click para evitar bloqueos de WA
    variantes: [
      `Hola! Soy Sebastián. Tengo una app para administrar gimnasios que ya están usando varios gyms en Argentina, y quería ver si les podía ser útil a ustedes también. ¿Este es ${nombre ?? 'el gimnasio'}?`,
      `Buenas! Mi nombre es Sebastián. Desarrollé una app de gestión para gimnasios y varios gyms del país ya la están usando. ¿Puedo hablar con alguien de ${nombre ?? 'el gimnasio'}?`,
      `Hola, cómo están? Soy Sebastián. Trabajo con gimnasios de Argentina ofreciéndoles una app de administración. ¿Este es el contacto de ${nombre ?? 'el gimnasio'}?`,
      `Buen día! Soy Sebastián. Tengo una solución digital para gimnasios que ya usan varios en todo el país. ¿Hablo con alguien de ${nombre ?? 'el gimnasio'}?`,
      `Hola! Sebastián acá. Estoy trabajando con gimnasios de todo el país con una app de gestión y administración. ¿Este es ${nombre ?? 'el gimnasio'}?`,
    ],
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    emoji: '🔄',
    msg: `Hola! Soy Sebastián, te escribí hace unos días sobre ${nombre ?? 'el gimnasio'}. ¿Pudiste ver lo que te mandé?`,
  },
  {
    key: 'propuesta',
    label: 'Propuesta web',
    emoji: '💻',
    msg: `Hola! Soy Sebastián, me especializo en páginas web para gimnasios. Quería mostrarte algo para ${nombre ?? 'el gimnasio'}, ¿tenés un momento?`,
  },
  {
    key: 'cierre',
    label: 'Cierre / trial',
    emoji: '🚀',
    msg: `Hola! Soy Sebastián. Quería saber si tuviste oportunidad de revisar la propuesta para ${nombre ?? 'el gimnasio'}. Podemos arrancar con una prueba sin costo para que lo veas funcionando 🙌`,
  },
]
