export const ESTADOS = ['nuevo', 'contactado', 'sin_respuesta', 'interesado', 'en_espera', 'demo_enviado', 'negociando', 'cerrado', 'descartado']

export const PAGE_SIZE = 20

export const ORDEN_OPTIONS = [
  { key: 'score',      label: 'Score' },
  { key: 'movimiento', label: 'Ultimo movimiento' },
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

export const ESTADO_BADGE = {
  nuevo:         'bg-light-primary',
  contactado:    'bg-light-warning',
  sin_respuesta: 'bg-light-danger',
  interesado:    'bg-light-success',
  en_espera:     'bg-light-info',
  demo_enviado:  'bg-light-secondary',
  negociando:    'bg-light-warning',
  cerrado:       'bg-light-success',
  descartado:    'bg-light-secondary',
}

// kept for backward compat (not used after Bootstrap migration)
export const ESTADO_STYLES = ESTADO_BADGE

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
  { key: 'telefono',  label: 'Telefono' },
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
      variantes: [
        `Hola! Soy Sebastian. Tengo una solucion digital que ya estan usando varios negocios como el de ustedes, y queria ver si les podia ser util tambien. Este es ${negocio}?`,
        `Buenas! Mi nombre es Sebastian. Desarrollo soluciones digitales para negocios y varios ya la estan usando. Puedo hablar con alguien de ${negocio}?`,
        `Hola, como estan? Soy Sebastian. Trabajo con negocios locales ofreciendoles herramientas digitales de gestion. Este es el contacto de ${negocio}?`,
        `Buen dia! Soy Sebastian. Tengo una solucion digital que ya usan varios negocios similares. Hablo con alguien de ${negocio}?`,
        `Hola! Sebastian aca. Estoy trabajando con negocios locales con herramientas de gestion digital. Este es ${negocio}?`,
      ],
    },
    {
      key: 'seguimiento',
      label: 'Seguimiento',
      emoji: '🔄',
      msg: `Hola! Soy Sebastian, te escribi hace unos dias sobre ${negocio}. Pudiste ver lo que te mande?`,
    },
    {
      key: 'propuesta',
      label: 'Propuesta web',
      emoji: '💻',
      msg: `Hola! Soy Sebastian, me especializo en paginas web y sistemas de gestion para negocios. Queria mostrarte algo para ${negocio}, tenes un momento?`,
    },
    {
      key: 'cierre',
      label: 'Cierre / trial',
      emoji: '🚀',
      msg: `Hola! Soy Sebastian. Queria saber si tuviste oportunidad de revisar la propuesta para ${negocio}. Podemos arrancar con una prueba sin costo para que lo veas funcionando`,
    },
  ]
}
