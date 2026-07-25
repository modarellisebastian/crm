import { useEffect, useState } from 'react'
import { fetchLeadsParaReportes } from '../services/leadsService'
import { fetchLeadIdsConCliente } from '../services/clientsService'

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d',  label: '7 días' },
  { key: '30d', label: '30 días' },
]

const ESTADOS_FUNNEL = [
  { id: 'nuevo',         label: 'Nuevo',         color: 'bg-blue-400'   },
  { id: 'contactado',    label: 'Contactado',     color: 'bg-yellow-400' },
  { id: 'sin_respuesta', label: 'Sin respuesta',  color: 'bg-red-400'    },
  { id: 'interesado',    label: 'Interesado',     color: 'bg-teal-400'   },
  { id: 'en_espera',     label: 'En espera',      color: 'bg-indigo-400' },
  { id: 'demo_enviado',  label: 'Demo enviado',   color: 'bg-purple-400' },
  { id: 'negociando',    label: 'Negociando',     color: 'bg-orange-400' },
  { id: 'cerrado',       label: 'Cerrado',        color: 'bg-green-500'  },
  { id: 'descartado',    label: 'Descartado',     color: 'bg-gray-300'   },
]

function getPeriodStart(p) {
  if (p === 'hoy') {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  return new Date(Date.now() - (p === '7d' ? 7 : 30) * 86400000)
}

function fmtFecha(iso) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function StatCard({ label, value, color, note, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {loading
        ? <div className="mt-2 h-8 w-12 animate-pulse rounded bg-gray-100" />
        : <p className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      }
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </div>
  )
}

export default function Reportes() {
  const [periodo, setPeriodo]         = useState('7d')
  const [leads, setLeads]             = useState([])
  const [clienteLeadIds, setClienteLeadIds] = useState(new Set())
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      const [{ data }, { data: clientes }] = await Promise.all([
        fetchLeadsParaReportes(),
        fetchLeadIdsConCliente(),
      ])
      setLeads(data ?? [])
      setClienteLeadIds(new Set((clientes ?? []).map((c) => c.lead_id)))
      setLoading(false)
    }
    fetchLeads()
  }, [])

  // ── Métricas del período ─────────────────────────────────────────────────────
  const desde = getPeriodStart(periodo)

  const scrapeados     = leads.filter((l) => new Date(l.created_at) >= desde).length
  const trabajados     = leads.filter((l) => l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde).length
  const enProceso      = leads.filter((l) =>
    ['interesado', 'en_espera', 'demo_enviado', 'negociando'].includes(l.estado) &&
    l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde
  ).length
  const cerradosPeriodo = leads.filter((l) =>
    l.estado === 'cerrado' &&
    l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde
  ).length

  // ── Embudo (todos los leads) ──────────────────────────────────────────────────
  const totalLeads  = leads.length
  const estadoCounts = {}
  for (const l of leads) estadoCounts[l.estado] = (estadoCounts[l.estado] ?? 0) + 1

  // Tasa de avance: activos que pasaron de "nuevo"
  const activos      = leads.filter((l) => l.estado !== 'descartado').length
  const avanzaron    = leads.filter((l) => !['nuevo', 'descartado'].includes(l.estado)).length
  const tasaAvance   = activos > 0 ? Math.round((avanzaron / activos) * 100) : 0

  // Tasa de respuesta: entre los contactados, cuántos respondieron
  const contactados  = (estadoCounts['contactado'] ?? 0) + (estadoCounts['sin_respuesta'] ?? 0)
  const respondieron = leads.filter((l) =>
    ['interesado', 'en_espera', 'demo_enviado', 'negociando', 'cerrado'].includes(l.estado)
  ).length
  const tasaRespuesta = contactados + respondieron > 0
    ? Math.round((respondieron / (contactados + respondieron)) * 100)
    : 0

  // Conversión cerrado → cliente
  const totalCerrados   = estadoCounts['cerrado'] ?? 0
  const convertidos     = leads.filter((l) => l.estado === 'cerrado' && clienteLeadIds.has(l.id)).length
  const enTrial         = totalCerrados - convertidos
  const tasaConversion  = totalCerrados > 0 ? Math.round((convertidos / totalCerrados) * 100) : 0

  // ── Prioridad (activos) ───────────────────────────────────────────────────────
  const prioridad = { alta: 0, media: 0, baja: 0 }
  for (const l of leads) {
    if (l.estado !== 'descartado' && l.prioridad) prioridad[l.prioridad]++
  }

  // ── Canal de contacto ────────────────────────────────────────────────────────
  const conWA  = leads.filter((l) => l.whatsapp).length
  const conIG  = leads.filter((l) => l.instagram).length
  const conWeb = leads.filter((l) => l.tiene_web).length

  // ── Top ciudades ─────────────────────────────────────────────────────────────
  const [filtroCiudadEstado, setFiltroCiudadEstado] = useState('')

  const leadsCiudad = filtroCiudadEstado
    ? leads.filter((l) => l.estado === filtroCiudadEstado)
    : leads
  const ciudadCounts = {}
  for (const l of leadsCiudad) {
    if (l.ciudad) ciudadCounts[l.ciudad] = (ciudadCounts[l.ciudad] ?? 0) + 1
  }
  const topCiudades = Object.entries(ciudadCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxCiudad   = topCiudades[0]?.[1] ?? 1

  // ── Scraping por día (últimos 14 días) ────────────────────────────────────────
  const porDia = Array.from({ length: 14 }, (_, i) => {
    const key = new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0]
    return { fecha: key, cantidad: 0 }
  })
  const diaMap = Object.fromEntries(porDia.map((d) => [d.fecha, d]))
  for (const l of leads) {
    const key = l.created_at?.split('T')[0]
    if (key && diaMap[key]) diaMap[key].cantidad++
  }
  const maxDia = Math.max(...porDia.map((d) => d.cantidad), 1)

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                periodo === p.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actividad del período */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Actividad del período</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Scrapeados"  value={scrapeados}      color="text-blue-600"   note="nuevos en el período"              loading={loading} />
          <StatCard label="Trabajados"  value={trabajados}      color="text-yellow-600" note="con algún movimiento"              loading={loading} />
          <StatCard label="En proceso"  value={enProceso}       color="text-teal-600"   note="interesado · demo · negociando"   loading={loading} />
          <StatCard label="Cerrados"    value={cerradosPeriodo} color="text-green-600"  note="por último movimiento"             loading={loading} />
        </div>
      </div>

      {/* Tasas globales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tasa de avance</p>
            <p className="text-xs text-gray-400 mt-0.5">activos que pasaron de "nuevo"</p>
          </div>
          {loading
            ? <div className="h-10 w-16 animate-pulse rounded bg-gray-100" />
            : <p className="text-3xl font-bold tabular-nums text-indigo-600">{tasaAvance}%</p>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tasa de respuesta</p>
            <p className="text-xs text-gray-400 mt-0.5">de los contactados, respondieron</p>
          </div>
          {loading
            ? <div className="h-10 w-16 animate-pulse rounded bg-gray-100" />
            : <p className="text-3xl font-bold tabular-nums text-orange-500">{tasaRespuesta}%</p>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trial → Cliente</p>
            <p className="text-xs text-gray-400 mt-0.5">{loading ? '…' : `${convertidos} de ${totalCerrados} cerrados`}</p>
          </div>
          {loading
            ? <div className="h-10 w-16 animate-pulse rounded bg-gray-100" />
            : <p className="text-3xl font-bold tabular-nums text-green-600">{tasaConversion}%</p>
          }
        </div>
      </div>

      {/* Embudo + Prioridad y Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Embudo */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Distribución — todos los leads
            </p>
            {!loading && (
              <span className="text-xs text-gray-400">{totalLeads} total · {activos} activos</span>
            )}
          </div>
          <div className="space-y-2.5">
            {ESTADOS_FUNNEL.map((e) => {
              const count = estadoCounts[e.id] ?? 0
              const pct   = totalLeads > 0 ? (count / totalLeads) * 100 : 0
              return (
                <div key={e.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-gray-600 text-right">{e.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${e.color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-7 text-sm font-semibold text-gray-700 tabular-nums text-right">
                      {loading ? '…' : count}
                    </span>
                    <span className="w-9 text-xs text-gray-400 tabular-nums text-right">
                      {!loading && totalLeads ? `${Math.round(pct)}%` : ''}
                    </span>
                  </div>

                  {/* Desglose de cerrados: en trial vs convertidos */}
                  {e.id === 'cerrado' && !loading && totalCerrados > 0 && (
                    <div className="ml-[7.5rem] mt-1.5 pl-3 border-l-2 border-gray-200 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs text-gray-400 text-right">En trial</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-300 transition-all"
                            style={{ width: totalCerrados > 0 ? `${(enTrial / totalCerrados) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="w-7 text-xs font-medium text-gray-500 tabular-nums text-right">{enTrial}</span>
                        <span className="w-9" />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs text-gray-400 text-right">→ Cliente</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: totalCerrados > 0 ? `${(convertidos / totalCerrados) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="w-7 text-xs font-semibold text-green-700 tabular-nums text-right">{convertidos}</span>
                        <span className="w-9 text-xs text-green-600 tabular-nums text-right">
                          {tasaConversion}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Prioridad + Canal */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Prioridad — activos
            </p>
            <div className="space-y-2">
              {[
                { key: 'alta',  label: 'Alta',  textCls: 'text-green-700',  bgCls: 'bg-green-50'  },
                { key: 'media', label: 'Media', textCls: 'text-yellow-700', bgCls: 'bg-yellow-50' },
                { key: 'baja',  label: 'Baja',  textCls: 'text-gray-600',   bgCls: 'bg-gray-50'   },
              ].map((p) => (
                <div key={p.key} className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${p.bgCls}`}>
                  <span className={`text-sm font-medium ${p.textCls}`}>{p.label}</span>
                  <span className={`text-2xl font-bold tabular-nums ${p.textCls}`}>
                    {loading ? '…' : prioridad[p.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Canal de contacto
            </p>
            <div className="space-y-3">
              {[
                { label: 'WhatsApp',   value: conWA,  barColor: 'bg-green-400' },
                { label: 'Instagram',  value: conIG,  barColor: 'bg-pink-400'  },
                { label: 'Web propia', value: conWeb, barColor: 'bg-blue-400'  },
              ].map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{c.label}</span>
                    <span className="text-gray-500 font-medium tabular-nums">
                      {loading ? '…' : `${c.value} · ${totalLeads > 0 ? Math.round((c.value / totalLeads) * 100) : 0}%`}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.barColor}`}
                      style={{ width: totalLeads > 0 ? `${(c.value / totalLeads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top ciudades */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Top ciudades
            </p>
            {/* Chips de estado */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFiltroCiudadEstado('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filtroCiudadEstado === ''
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                }`}
              >
                Todos
              </button>
              {ESTADOS_FUNNEL.map((e) => {
                const n = (estadoCounts[e.id] ?? 0)
                if (n === 0) return null
                const activeColors = {
                  nuevo:         'bg-blue-600 text-white border-blue-600',
                  contactado:    'bg-yellow-500 text-white border-yellow-500',
                  sin_respuesta: 'bg-red-500 text-white border-red-500',
                  interesado:    'bg-teal-600 text-white border-teal-600',
                  en_espera:     'bg-indigo-600 text-white border-indigo-600',
                  demo_enviado:  'bg-purple-600 text-white border-purple-600',
                  negociando:    'bg-orange-500 text-white border-orange-500',
                  cerrado:       'bg-green-600 text-white border-green-600',
                  descartado:    'bg-gray-500 text-white border-gray-500',
                }
                const isActive = filtroCiudadEstado === e.id
                return (
                  <button
                    key={e.id}
                    onClick={() => setFiltroCiudadEstado(isActive ? '' : e.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isActive
                        ? activeColors[e.id]
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {e.label} <span className="opacity-70">({n})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {topCiudades.length === 0 ? (
            <p className="text-sm text-gray-400">No hay leads con ese estado.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2.5">
              {topCiudades.map(([ciudad, count]) => (
                <div key={ciudad} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-gray-600 text-right truncate">{ciudad}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all"
                      style={{ width: `${(count / maxCiudad) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-semibold text-gray-700 tabular-nums text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scraping por día */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Leads scrapeados por día — últimos 14 días
        </p>
        {loading ? (
          <div className="h-24 animate-pulse rounded bg-gray-100" />
        ) : (
          <div className="flex items-end gap-1.5 h-24">
            {porDia.map((d) => (
              <div key={d.fecha} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {d.cantidad || ''}
                </span>
                <div
                  className="w-full rounded-t bg-blue-400 transition-all"
                  style={{ height: `${(d.cantidad / maxDia) * 64}px`, minHeight: d.cantidad > 0 ? '4px' : '0px' }}
                />
                <span className="text-[10px] text-gray-400 tabular-nums">{fmtFecha(d.fecha)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
