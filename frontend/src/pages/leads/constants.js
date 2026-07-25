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

export const WA_TEMPLATES = (nombre, rubro) => {
  const negocio = nombre ?? (rubro ? `su ${rubro.toLowerCase()}` : 'su negocio')

  return [
    {
      key: 'primer_contacto',
      label: 'Primer contacto',
      emoji: '👋',
      // variantes: se elige una al azar al hacer click para evitar bloqueos de WA
      variantes: [
        `Hola! Soy Sebastián. Tengo una solución digital que ya están usando varios negocios como el de ustedes, y quería ver si les podía ser útil también. ¿Este es ${negocio}?`,
        `Buenas! Mi nombre es Sebastián. Desarrollo soluciones digitales para negocios y varios ya la están usando. ¿Puedo hablar con alguien de ${negocio}?`,
        `Hola, cómo están? Soy Sebastián. Trabajo con negocios locales ofreciéndoles herramientas digitales de gestión. ¿Este es el contacto de ${negocio}?`,
        `Buen día! Soy Sebastián. Tengo una solución digital que ya usan varios negocios similares. ¿Hablo con alguien de ${negocio}?`,
        `Hola! Sebastián acá. Estoy trabajando con negocios locales con herramientas de gestión digital. ¿Este es ${negocio}?`,
      ],
    },
    {
      key: 'seguimiento',
      label: 'Seguimiento',
      emoji: '🔄',
      msg: `Hola! Soy Sebastián, te escribí hace unos días sobre ${negocio}. ¿Pudiste ver lo que te mandé?`,
    },
    {
      key: 'propuesta',
      label: 'Propuesta web',
      emoji: '💻',
      msg: `Hola! Soy Sebastián, me especializo en páginas web y sistemas de gestión para negocios. Quería mostrarte algo para ${negocio}, ¿tenés un momento?`,
    },
    {
      key: 'cierre',
      label: 'Cierre / trial',
      emoji: '🚀',
      msg: `Hola! Soy Sebastián. Quería saber si tuviste oportunidad de revisar la propuesta para ${negocio}. Podemos arrancar con una prueba sin costo para que lo veas funcionando 🙌`,
    },
  ]
}
