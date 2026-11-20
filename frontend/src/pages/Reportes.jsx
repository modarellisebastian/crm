import { useEffect, useState } from 'react'
import { fetchLeadsParaReportes } from '../services/leadsService'
import { fetchLeadIdsConCliente } from '../services/clientsService'

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d',  label: '7 días' },
  { key: '30d', label: '30 días' },
]

const ESTADOS_FUNNEL = [
  { id: 'nuevo',         label: 'Nuevo',        color: '#0a0a0a' },
  { id: 'contactado',    label: 'Contactado',   color: '#ca8a04' },
  { id: 'sin_respuesta', label: 'Sin respuesta',color: '#dc2626' },
  { id: 'interesado',    label: 'Interesado',   color: '#16a34a' },
  { id: 'en_espera',     label: 'En espera',    color: '#3ec9d6' },
  { id: 'demo_enviado',  label: 'Demo enviado', color: '#6f42c1' },
  { id: 'negociando',    label: 'Negociando',   color: '#ca8a04' },
  { id: 'cerrado',       label: 'Cerrado',      color: '#20c997' },
  { id: 'descartado',    label: 'Descartado',   color: '#a3a3a3' },
]

function getPeriodStart(p) {
  if (p === 'hoy') { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
  return new Date(Date.now() - (p === '7d' ? 7 : 30) * 86400000)
}

function fmtFecha(iso) { const [, m, d] = iso.split('-'); return `${d}/${m}` }

// Card de métrica estilo Duralux
function StatCard({ label, value, note, progressN = 1, loading }) {
  return (
    <div className="card stretch stretch-full short-info-card h-100">
      <div className="card-body">
        <div className="mb-3">
          {loading
            ? <div className="placeholder-glow mb-1"><span className="placeholder col-6" style={{ height: 32, display: 'block' }} /></div>
            : <div className="fs-3 fw-bold text-dark">{value}</div>
          }
          <p className="fs-13 fw-semibold text-muted mb-0">{label}</p>
          {note && <p style={{ fontSize: 11 }} className="text-muted mb-0">{note}</p>}
        </div>
        <div className="progress ht-3">
          <div className={`progress-bar progress-${progressN}`} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  )
}

// Tasa card (número grande a la derecha)
function RateCard({ label, note, value, color, loading }) {
  return (
    <div className="card h-100">
      <div className="card-body d-flex align-items-center justify-content-between gap-3">
        <div>
          <p className="fw-semibold mb-1" style={{ fontSize: 13, color: '#0a0a0a' }}>{label}</p>
          {note && <p className="text-muted mb-0" style={{ fontSize: 12 }}>{note}</p>}
        </div>
        {loading
          ? <div className="placeholder-glow"><span className="placeholder" style={{ width: 60, height: 36, display: 'block' }} /></div>
          : <span className="fw-bold" style={{ fontSize: 28, color, lineHeight: 1 }}>{value}</span>
        }
      </div>
    </div>
  )
}

export default function Reportes() {
  const [periodo, setPeriodo]               = useState('7d')
  const [leads, setLeads]                   = useState([])
  const [clienteLeadIds, setClienteLeadIds] = useState(new Set())
  const [loading, setLoading]               = useState(true)
  const [filtroCiudadEstado, setFiltroCiudadEstado] = useState('')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [{ data }, { data: clientes }] = await Promise.all([
        fetchLeadsParaReportes(),
        fetchLeadIdsConCliente(),
      ])
      setLeads(data ?? [])
      setClienteLeadIds(new Set((clientes ?? []).map((c) => c.lead_id)))
      setLoading(false)
    }
    fetchData()
  }, [])

  // ── Métricas del período ──────────────────────────────────────────────────
  const desde = getPeriodStart(periodo)
  const scrapeados      = leads.filter((l) => new Date(l.created_at) >= desde).length
  const trabajados      = leads.filter((l) => l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde).length
  const enProceso       = leads.filter((l) => ['interesado','en_espera','demo_enviado','negociando'].includes(l.estado) && l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde).length
  const cerradosPeriodo = leads.filter((l) => l.estado === 'cerrado' && l.fecha_ultimo_movimiento && new Date(l.fecha_ultimo_movimiento) >= desde).length

  // ── Globales ──────────────────────────────────────────────────────────────
  const totalLeads   = leads.length
  const estadoCounts = {}
  for (const l of leads) estadoCounts[l.estado] = (estadoCounts[l.estado] ?? 0) + 1

  const activos      = leads.filter((l) => l.estado !== 'descartado').length
  const avanzaron    = leads.filter((l) => !['nuevo','descartado'].includes(l.estado)).length
  const tasaAvance   = activos > 0 ? Math.round((avanzaron / activos) * 100) : 0

  const contactados   = (estadoCounts['contactado'] ?? 0) + (estadoCounts['sin_respuesta'] ?? 0)
  const respondieron  = leads.filter((l) => ['interesado','en_espera','demo_enviado','negociando','cerrado'].includes(l.estado)).length
  const tasaRespuesta = contactados + respondieron > 0 ? Math.round((respondieron / (contactados + respondieron)) * 100) : 0

  const totalCerrados  = estadoCounts['cerrado'] ?? 0
  const convertidos    = leads.filter((l) => l.estado === 'cerrado' && clienteLeadIds.has(l.id)).length
  const enTrial        = totalCerrados - convertidos
  const tasaConversion = totalCerrados > 0 ? Math.round((convertidos / totalCerrados) * 100) : 0

  // ── Canal ─────────────────────────────────────────────────────────────────
  const conWA  = leads.filter((l) => l.whatsapp).length
  const conIG  = leads.filter((l) => l.instagram).length
  const conWeb = leads.filter((l) => l.tiene_web).length

  // ── Top ciudades ──────────────────────────────────────────────────────────
  const leadsCiudad = filtroCiudadEstado ? leads.filter((l) => l.estado === filtroCiudadEstado) : leads
  const ciudadCounts = {}
  for (const l of leadsCiudad) { if (l.ciudad) ciudadCounts[l.ciudad] = (ciudadCounts[l.ciudad] ?? 0) + 1 }
  const topCiudades = Object.entries(ciudadCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxCiudad   = topCiudades[0]?.[1] ?? 1

  // ── Scraping por día ──────────────────────────────────────────────────────
  const porDia = Array.from({ length: 14 }, (_, i) => {
    const key = new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0]
    return { fecha: key, cantidad: 0 }
  })
  const diaMap = Object.fromEntries(porDia.map((d) => [d.fecha, d]))
  for (const l of leads) { const key = l.created_at?.split('T')[0]; if (key && diaMap[key]) diaMap[key].cantidad++ }
  const maxDia = Math.max(...porDia.map((d) => d.cantidad), 1)

  return (
    <div className="d-flex flex-column gap-4">

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h4 className="fw-semibold mb-0">Reportes</h4>
          <span className="text-muted small">{loading ? 'Cargando...' : `${totalLeads} leads en total`}</span>
        </div>
        <div className="btn-group" role="group">
          {PERIODOS.map((p) => (
            <button key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`btn btn-sm ${periodo === p.key ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ fontSize: 12 }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actividad del período */}
      <div>
        <p className="text-muted fw-semibold text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: '.5px' }}>
          Actividad del período
        </p>
        <div className="row g-3">
          {[
            { label: 'Scrapeados',  value: scrapeados,      note: 'nuevos en el período',           progressN: 1 },
            { label: 'Trabajados',  value: trabajados,      note: 'con algún movimiento',           progressN: 2 },
            { label: 'En proceso',  value: enProceso,       note: 'interesado · demo · negociando', progressN: 3 },
            { label: 'Cerrados',    value: cerradosPeriodo, note: 'por último movimiento',          progressN: 4 },
          ].map((c) => (
            <div key={c.label} className="col-6 col-lg-3">
              <StatCard {...c} loading={loading} />
            </div>
          ))}
        </div>
      </div>

      {/* Tasas globales */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <RateCard label="Tasa de avance" note='activos que pasaron de "nuevo"' value={`${tasaAvance}%`} color="#0a0a0a" loading={loading} />
        </div>
        <div className="col-12 col-md-4">
          <RateCard label="Tasa de respuesta" note="de los contactados, respondieron" value={`${tasaRespuesta}%`} color="#ca8a04" loading={loading} />
        </div>
        <div className="col-12 col-md-4">
          <RateCard label="Trial → Cliente" note={loading ? '…' : `${convertidos} de ${totalCerrados} cerrados`} value={`${tasaConversion}%`} color="#16a34a" loading={loading} />
        </div>
      </div>

      {/* Embudo + Canal */}
      <div className="row g-4">

        {/* Embudo */}
        <div className="col-12 col-lg-8">
          <div className="card h-100">
            <div className="card-header py-3 d-flex align-items-center justify-content-between">
              <h6 className="card-title fw-bold mb-0">Distribución por estado</h6>
              {!loading && <span className="text-muted small">{totalLeads} total · {activos} activos</span>}
            </div>
            <div className="card-body">
              <div className="d-flex flex-column gap-3">
                {ESTADOS_FUNNEL.map((e) => {
                  const count = estadoCounts[e.id] ?? 0
                  const pct   = totalLeads > 0 ? (count / totalLeads) * 100 : 0
                  return (
                    <div key={e.id}>
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted text-end" style={{ fontSize: 13, minWidth: 110 }}>{e.label}</span>
                        <div className="flex-grow-1 rounded" style={{ background: '#f5f5f5', height: 14, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: e.color, borderRadius: 4, transition: 'width .4s' }} />
                        </div>
                        <span className="fw-semibold" style={{ fontSize: 13, color: '#0a0a0a', minWidth: 24, textAlign: 'right' }}>
                          {loading ? '…' : count}
                        </span>
                        <span className="text-muted" style={{ fontSize: 12, minWidth: 36, textAlign: 'right' }}>
                          {!loading && totalLeads ? `${Math.round(pct)}%` : ''}
                        </span>
                      </div>

                      {/* Desglose cerrados */}
                      {e.id === 'cerrado' && !loading && totalCerrados > 0 && (
                        <div className="ms-5 ps-2 mt-2 d-flex flex-column gap-2" style={{ borderLeft: '2px solid #f5f5f5' }}>
                          {[
                            { label: 'En trial', count: enTrial,    pct: (enTrial / totalCerrados) * 100,    color: '#ca8a04' },
                            { label: '→ Cliente',count: convertidos, pct: (convertidos / totalCerrados) * 100, color: '#16a34a' },
                          ].map(({ label, count: c, pct: p, color }) => (
                            <div key={label} className="d-flex align-items-center gap-3">
                              <span className="text-muted text-end" style={{ fontSize: 12, minWidth: 75 }}>{label}</span>
                              <div className="flex-grow-1 rounded" style={{ background: '#f5f5f5', height: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 4 }} />
                              </div>
                              <span className="fw-semibold" style={{ fontSize: 12, color: '#0a0a0a', minWidth: 24, textAlign: 'right' }}>{c}</span>
                              <span className="text-muted" style={{ fontSize: 11, minWidth: 36, textAlign: 'right' }}>{Math.round(p)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canal */}
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-header py-3">
              <h6 className="card-title fw-bold mb-0">Canal de contacto</h6>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {[
                { label: 'WhatsApp',   value: conWA,  color: '#16a34a' },
                { label: 'Instagram',  value: conIG,  color: '#e1306c' },
                { label: 'Web propia', value: conWeb, color: '#0a0a0a' },
              ].map((c) => (
                <div key={c.label}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ fontSize: 13, color: '#0a0a0a' }}>{c.label}</span>
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      {loading ? '…' : `${c.value} · ${totalLeads > 0 ? Math.round((c.value / totalLeads) * 100) : 0}%`}
                    </span>
                  </div>
                  <div style={{ background: '#f5f5f5', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: totalLeads > 0 ? `${(c.value / totalLeads) * 100}%` : '0%', height: '100%', background: c.color, borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top ciudades */}
      <div className="card">
        <div className="card-header py-3 d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <h6 className="card-title fw-bold mb-0">Top ciudades</h6>
          <div className="d-flex flex-wrap gap-1">
            <button
              onClick={() => setFiltroCiudadEstado('')}
              className={`btn btn-sm ${filtroCiudadEstado === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ fontSize: 11 }}>
              Todos
            </button>
            {ESTADOS_FUNNEL.map((e) => {
              const n = estadoCounts[e.id] ?? 0
              if (!n) return null
              return (
                <button key={e.id}
                  onClick={() => setFiltroCiudadEstado(filtroCiudadEstado === e.id ? '' : e.id)}
                  className={`btn btn-sm ${filtroCiudadEstado === e.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 11 }}>
                  {e.label} <span className="opacity-75">({n})</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="placeholder-glow"><span className="placeholder col-12" style={{ height: 80, display: 'block' }} /></div>
          ) : topCiudades.length === 0 ? (
            <p className="text-muted small">No hay leads con ese filtro.</p>
          ) : (
            <div className="row g-3">
              {topCiudades.map(([ciudad, count]) => (
                <div key={ciudad} className="col-12 col-lg-6">
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted text-end" style={{ fontSize: 13, minWidth: 130 }}>{ciudad}</span>
                    <div className="flex-grow-1 rounded" style={{ background: '#f5f5f5', height: 14, overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxCiudad) * 100}%`, height: '100%', background: '#0a0a0a', borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <span className="fw-semibold" style={{ fontSize: 13, color: '#0a0a0a', minWidth: 24, textAlign: 'right' }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leads scrapeados por día */}
      <div className="card">
        <div className="card-header py-3">
          <h6 className="card-title fw-bold mb-0">Leads scrapeados por día — últimos 14 días</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="placeholder-glow"><span className="placeholder col-12" style={{ height: 80, display: 'block' }} /></div>
          ) : (
            <div className="d-flex align-items-end gap-1" style={{ height: 100 }}>
              {porDia.map((d) => (
                <div key={d.fecha} className="d-flex flex-column align-items-center gap-1 flex-grow-1" style={{ position: 'relative' }}>
                  {d.cantidad > 0 && (
                    <span className="text-muted" style={{ fontSize: 10, position: 'absolute', top: -18 }}>{d.cantidad}</span>
                  )}
                  <div style={{
                    width: '100%',
                    height: `${(d.cantidad / maxDia) * 72}px`,
                    minHeight: d.cantidad > 0 ? 4 : 0,
                    background: '#0a0a0a',
                    borderRadius: '3px 3px 0 0',
                    opacity: d.cantidad > 0 ? 1 : 0,
                    transition: 'height .3s',
                    marginTop: 'auto',
                  }} />
                  <span className="text-muted" style={{ fontSize: 10 }}>{fmtFecha(d.fecha)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
