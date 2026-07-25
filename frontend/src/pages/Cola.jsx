import { useEffect, useState, useCallback } from 'react'
import { fetchColaDeHoy, marcarLeadContactado, marcarLeadDescartado } from '../services/leadsService'

// ─── Rate limiter (localStorage) ─────────────────────────────────────────────
const LIMITE_POR_HORA = 5
const LS_KEY = 'cola_timestamps'

function getTimestampsRecientes() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    const hace1h = Date.now() - 60 * 60 * 1000
    return arr.filter((t) => t > hace1h)
  } catch {
    return []
  }
}

function registrarEnvio() {
  const recientes = getTimestampsRecientes()
  recientes.push(Date.now())
  localStorage.setItem(LS_KEY, JSON.stringify(recientes))
  return recientes
}

// Minutos hasta que el más viejo de la última hora cumpla 60 min
function minutosHastaProximoSlot(timestamps) {
  if (timestamps.length < LIMITE_POR_HORA) return 0
  const masViejo = Math.min(...timestamps)
  const msRestantes = masViejo + 60 * 60 * 1000 - Date.now()
  return Math.max(1, Math.ceil(msRestantes / 60000))
}

// ─── Mensaje WhatsApp ─────────────────────────────────────────────────────────
// Rubros que dictan clases/actividades — para estos el "¿siguen dando clases de X?"
// suena natural. Para cualquier otro rubro se usa un mensaje genérico más abajo.
const ACTIVIDAD_POR_RUBRO = {
  'Box CrossFit':          'CrossFit',
  'Artes marciales':       'artes marciales',
  'Artes marciales mixtas':'MMA',
  'Muay Thai':             'Muay Thai',
  'Taekwondo':             'taekwondo',
  'Natación':              'natación',
  'Funcional':             'entrenamiento funcional',
  'Pilates':               'Pilates',
  'Yoga':                  'Yoga',
  'Gimnasio':              'musculación',
}

function buildMensaje(lead) {
  const actividad = ACTIVIDAD_POR_RUBRO[lead.rubro]
  if (actividad) {
    return `Hola! Vi el lugar en Google Maps. ¿Siguen dando clases de ${actividad}?`
  }
  return `Hola! Vi ${lead.nombre ?? 'el negocio'} en Google Maps. ¿Siguen atendiendo?`
}

function buildWALink(lead) {
  if (!lead.whatsapp) return null
  return `https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(buildMensaje(lead))}`
}

// ─── Componente RateMeter ─────────────────────────────────────────────────────
function RateMeter({ enviados, onRefresh }) {
  const bloqueado = enviados >= LIMITE_POR_HORA
  const minutos   = bloqueado ? minutosHastaProximoSlot(getTimestampsRecientes()) : 0

  const colores = ['bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200']
  for (let i = 0; i < enviados; i++) {
    colores[i] = enviados >= LIMITE_POR_HORA ? 'bg-red-400' : enviados >= 4 ? 'bg-yellow-400' : 'bg-green-400'
  }

  return (
    <div className={[
      'rounded-2xl border px-5 py-4 flex items-center justify-between gap-4',
      bloqueado ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200',
    ].join(' ')}>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-gray-700">
          {bloqueado
            ? `Límite alcanzado — esperá ${minutos} min`
            : `${enviados} / ${LIMITE_POR_HORA} mensajes en la última hora`}
        </p>
        <div className="flex gap-1.5">
          {colores.map((c, i) => (
            <div key={i} className={`h-2 w-8 rounded-full transition-colors ${c}`} />
          ))}
        </div>
      </div>
      <button
        onClick={onRefresh}
        title="Actualizar lista"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H5.498a.75.75 0 0 0-.75.75v3.498a.75.75 0 0 0 1.5 0v-1.166l.308.31a7 7 0 0 0 11.677-3.138.75.75 0 0 0-1.426-.468ZM5.44 8.574a5.5 5.5 0 0 1 9.201-2.466l.312.311H12.52a.75.75 0 0 0 0 1.5h3.234a.75.75 0 0 0 .75-.75V3.67a.75.75 0 0 0-1.5 0v1.165l-.308-.309a7 7 0 0 0-11.677 3.138.75.75 0 0 0 1.426.468Z" clipRule="evenodd" />
        </svg>
        Actualizar
      </button>
    </div>
  )
}

// ─── Tarjeta de lead ──────────────────────────────────────────────────────────
function LeadCard({ lead, bloqueado, onContactado, onDescartar }) {
  const waLink  = buildWALink(lead)
  const mensaje = buildMensaje(lead)

  const prioColor = {
    alta:  'bg-green-100 text-green-700',
    media: 'bg-yellow-100 text-yellow-700',
    baja:  'bg-gray-100 text-gray-500',
  }[lead.prioridad] ?? 'bg-gray-100 text-gray-500'

  function handleContactar() {
    if (waLink) window.open(waLink, '_blank')
    onContactado(lead.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{lead.nombre}</p>
          <p className="text-xs text-gray-400 truncate">{lead.rubro} · {lead.ciudad}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${prioColor}`}>
            {lead.prioridad}
          </span>
          <span className="text-[11px] text-gray-400 font-mono">{lead.score}pts</span>
        </div>
      </div>

      {/* Contacto */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {lead.whatsapp && (
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-green-500">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            {lead.whatsapp}
          </span>
        )}
        {lead.instagram && (
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-pink-500">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
            @{lead.instagram}
          </span>
        )}
      </div>

      {/* Mensaje preview */}
      <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 italic leading-relaxed">
        "{mensaje}"
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-0.5">
        {waLink ? (
          <button
            onClick={handleContactar}
            disabled={bloqueado}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Contactar por WhatsApp
          </button>
        ) : (
          <div className="flex-1 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium py-2 text-center">
            Sin WhatsApp
          </div>
        )}
        <button
          onClick={() => onDescartar(lead.id)}
          title="Descartar"
          className="px-3 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors text-xs"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C9.327 4.025 10.165 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Cola() {
  const [leads, setLeads]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [enviados, setEnviados]   = useState(() => getTimestampsRecientes().length)
  const [totalHoy, setTotalHoy]   = useState(0)

  const bloqueado = enviados >= LIMITE_POR_HORA

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchColaDeHoy(60)

    if (!error && data) {
      setLeads(data)
      setTotalHoy(data.length)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    // Refrescar contador cada 30 segundos (para que el "próximo slot" se actualice)
    const interval = setInterval(() => {
      setEnviados(getTimestampsRecientes().length)
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchLeads])

  async function handleContactado(leadId) {
    const timestamps = registrarEnvio()
    setEnviados(timestamps.length)

    await marcarLeadContactado(leadId)

    setLeads((prev) => prev.filter((l) => l.id !== leadId))
  }

  async function handleDescartar(leadId) {
    await marcarLeadDescartado(leadId)

    setLeads((prev) => prev.filter((l) => l.id !== leadId))
  }

  const alta  = leads.filter((l) => l.prioridad === 'alta')
  const media = leads.filter((l) => l.prioridad === 'media')

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Cola de hoy</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? 'Cargando...' : `${totalHoy} leads nuevos con WhatsApp — mandá de a ${LIMITE_POR_HORA} por hora`}
        </p>
      </div>

      {/* Rate meter */}
      <RateMeter enviados={enviados} onRefresh={fetchLeads} />

      {/* Tip de mensaje */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 leading-relaxed">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5 text-blue-400">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
        </svg>
        <span>
          El mensaje no menciona ningún sistema ni producto. Si responden "sí", preguntás cómo manejan los cobros y la asistencia. Ahí abrís la conversación.
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">Cargando leads...</p>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-gray-400 text-sm">No hay leads nuevos en cola.</p>
          <p className="text-gray-300 text-xs">Scrapeá más o actualizá la lista.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Alta prioridad */}
          {alta.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Alta prioridad</span>
                <span className="text-xs text-gray-400">{alta.length} leads</span>
              </div>
              {alta.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  bloqueado={bloqueado}
                  onContactado={handleContactado}
                  onDescartar={handleDescartar}
                />
              ))}
            </div>
          )}

          {/* Media prioridad */}
          {media.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Media prioridad</span>
                <span className="text-xs text-gray-400">{media.length} leads</span>
              </div>
              {media.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  bloqueado={bloqueado}
                  onContactado={handleContactado}
                  onDescartar={handleDescartar}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
