import { useEffect, useRef, useState } from 'react'
import { Chart, ArcElement, DoughnutController, Tooltip as CJTooltip, Legend, CategoryScale, LinearScale, BarElement, BarController } from 'chart.js'
import EmptyState from '../components/EmptyState'
import {
  fetchContactadosParaAutoTransicion, marcarLeadsSinRespuesta,
  countLeadsTotales, countLeadsDesde, countLeadsEnEstados,
  countLeadsCerradosEnRango, fetchUltimosLeads, fetchEstadosCounts,
} from '../services/leadsService'
import { fetchMontosFacturadosEnRango, fetchMontosPendientes } from '../services/paymentsService'
import { FiUsers, FiPlusCircle, FiBarChart2, FiCheckCircle, FiDollarSign, FiClock } from 'react-icons/fi'

Chart.register(ArcElement, DoughnutController, CJTooltip, Legend, CategoryScale, LinearScale, BarElement, BarController)

function hoyISO()      { return new Date().toISOString().split('T')[0] }
function inicioMesISO(){ const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1).toISOString() }
function finMesISO()   { const n = new Date(); return new Date(n.getFullYear(), n.getMonth()+1, 0, 23, 59, 59).toISOString() }
function formatARS(n)  { return new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n ?? 0) }

const ESTADO_MAP = {
  nuevo:         { label: 'Nuevo',         cls: 'bg-light-primary' },
  contactado:    { label: 'Contactado',    cls: 'bg-light-warning' },
  sin_respuesta: { label: 'Sin respuesta', cls: 'bg-light-danger' },
  interesado:    { label: 'Interesado',    cls: 'bg-light-success' },
  en_espera:     { label: 'En espera',     cls: 'bg-light-info' },
  demo_enviado:  { label: 'Demo enviado',  cls: 'bg-light-secondary' },
  negociando:    { label: 'Negociando',    cls: 'bg-light-warning' },
  cerrado:       { label: 'Cerrado',       cls: 'bg-light-success' },
  descartado:    { label: 'Descartado',    cls: 'bg-light-secondary' },
}

function EstadoBadge({ estado }) {
  const { label, cls } = ESTADO_MAP[estado] ?? { label: estado, cls: 'bg-light-secondary' }
  return <span className={`badge ${cls}`}>{label}</span>
}

// Card estilo Duralux short-info-card
function MetricCard({ icon, label, value, loading, progressN = 1 }) {
  return (
    <div className="card stretch stretch-full short-info-card">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div className="d-flex gap-4 align-items-center">
            <div className="avatar-text avatar-lg bg-gray-200 icon">
              {icon}
            </div>
            <div>
              {loading
                ? <div className="placeholder-glow mb-1"><span className="placeholder col-8" style={{ height: 28, display: 'block' }} /></div>
                : <div className="fs-4 fw-bold text-dark">{value}</div>
              }
              <h3 className="fs-13 fw-semibold text-truncate-1-line text-muted mb-0">{label}</h3>
            </div>
          </div>
        </div>
        <div className="progress mt-2 ht-3">
          <div className={`progress-bar progress-${progressN}`} role="progressbar" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  )
}

// ── Componente de gráfico de dona ─────────────────────────────────────────────
const ESTADO_COLORS = {
  nuevo:         '#0a0a0a',
  contactado:    '#ca8a04',
  sin_respuesta: '#dc2626',
  interesado:    '#16a34a',
  en_espera:     '#3ec9d6',
  demo_enviado:  '#a3a3a3',
  negociando:    '#ca8a04',
  cerrado:       '#20c997',
  descartado:    '#dcdcdc',
}

function DonutChart({ data }) {
  const ref = useRef(null)
  const inst = useRef(null)

  useEffect(() => {
    if (!ref.current || !data?.length) return
    if (inst.current) inst.current.destroy()
    const ctx = ref.current.getContext('2d')
    inst.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => ESTADO_MAP[d.estado]?.label ?? d.estado),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: data.map(d => ESTADO_COLORS[d.estado] ?? '#a3a3a3'),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 4,
        }],
      },
      options: {
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}`,
            },
          },
        },
      },
    })
    return () => inst.current?.destroy()
  }, [data])

  if (!data?.length) return null

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="d-flex align-items-center gap-4">
      <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
        <canvas ref={ref} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span className="fw-bold" style={{ fontSize: 26, color: '#0a0a0a' }}>{total}</span>
          <span className="text-muted" style={{ fontSize: 11 }}>leads</span>
        </div>
      </div>
      <div className="d-flex flex-column gap-1 flex-grow-1" style={{ overflow: 'hidden' }}>
        {data.sort((a,b) => b.count - a.count).map(d => {
          const pct = Math.round((d.count / total) * 100)
          return (
            <div key={d.estado} className="d-flex align-items-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_COLORS[d.estado] ?? '#ccc', flexShrink: 0 }} />
              <span className="text-truncate" style={{ fontSize: 12, color: '#0a0a0a', flex: 1 }}>
                {ESTADO_MAP[d.estado]?.label ?? d.estado}
              </span>
              <span className="fw-semibold" style={{ fontSize: 12, color: '#0a0a0a' }}>{d.count}</span>
              <span className="text-muted" style={{ fontSize: 11, minWidth: 30 }}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null)
  const [ultimosLeads, setUltimosLeads] = useState([])
  const [estadosCounts, setEstadosCounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoMovidos, setAutoMovidos] = useState(0)

  useEffect(() => {
    async function autoTransicion() {
      const contactados = await fetchContactadosParaAutoTransicion()
      if (!contactados.length) return
      const limite = Date.now() - 72 * 3600 * 1000
      const stale = contactados.filter(l => { const f = l.fecha_ultimo_movimiento ?? l.created_at; return f && new Date(f).getTime() < limite })
      if (stale.length > 0) { await marcarLeadsSinRespuesta(stale.map(l => l.id)); setAutoMovidos(stale.length) }
    }
    autoTransicion()
  }, [])

  useEffect(() => {
    async function fetchAll() {
      const hoy = hoyISO(), inicioMes = inicioMesISO(), finMes = finMesISO()
      const [resTotales, resHoy, resPipeline, resCerrados, resMRR, resPendiente] = await Promise.all([
        countLeadsTotales(),
        countLeadsDesde(`${hoy}T00:00:00`),
        countLeadsEnEstados(['contactado','demo_enviado','negociando']),
        countLeadsCerradosEnRango(inicioMes, finMes),
        fetchMontosFacturadosEnRango(hoy.slice(0,7)+'-01', finMes.split('T')[0]),
        fetchMontosPendientes(),
      ])
      const [leads, estadosRaw] = await Promise.all([fetchUltimosLeads(5), fetchEstadosCounts()])
      const mrr      = (resMRR.data      ?? []).reduce((s,p) => s + (p.monto ?? 0), 0)
      const pendiente = (resPendiente.data ?? []).reduce((s,p) => s + (p.monto ?? 0), 0)
      setMetricas({ totales: resTotales.count ?? 0, hoy: resHoy.count ?? 0, pipeline: resPipeline.count ?? 0, cerrados: resCerrados.count ?? 0, mrr, pendiente })
      setUltimosLeads(leads)
      setEstadosCounts(estadosRaw)
      setLoading(false)
    }
    fetchAll()
  }, [])

  const cards = [
    { icon: <FiUsers size={20} />,       label: 'Leads totales',      value: metricas?.totales,                              progressN: 1 },
    { icon: <FiPlusCircle size={20} />,  label: 'Leads nuevos hoy',   value: metricas?.hoy,                                  progressN: 2 },
    { icon: <FiBarChart2 size={20} />,   label: 'En pipeline',        value: metricas?.pipeline,                             progressN: 3 },
    { icon: <FiCheckCircle size={20} />, label: 'Cerrados este mes',  value: metricas?.cerrados,                             progressN: 4 },
    { icon: <FiDollarSign size={20} />,  label: 'Facturado este mes', value: metricas ? formatARS(metricas.mrr) : null,      progressN: 1 },
    { icon: <FiClock size={20} />,       label: 'Pendiente de cobro', value: metricas ? formatARS(metricas.pendiente) : null, progressN: 2 },
  ]

  return (
    <div>
      {autoMovidos > 0 && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between gap-2 mb-4">
          <span className="small">
            <strong>{autoMovidos} lead{autoMovidos !== 1 ? 's' : ''}</strong> pasaron a <strong>Sin respuesta</strong> por mas de 72hs.
          </span>
          <button className="btn-close btn-sm" onClick={() => setAutoMovidos(0)} />
        </div>
      )}

      {/* Metric cards */}
      <div className="row g-3 mb-4">
        {cards.map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-xl-4">
            <MetricCard
              icon={card.icon}
              label={card.label}
              value={card.value ?? '—'}
              loading={loading || card.value === null || card.value === undefined}
              progressN={card.progressN}
            />
          </div>
        ))}
      </div>

      {/* Gráfico distribución por estado */}
      {!loading && estadosCounts.length > 0 && (
        <div className="card mb-4">
          <div className="card-header py-3 d-flex align-items-center justify-content-between">
            <h6 className="card-title fw-bold mb-0">Distribución por estado</h6>
            <span className="text-muted small">Todos los leads</span>
          </div>
          <div className="card-body">
            <DonutChart data={estadosCounts} />
          </div>
        </div>
      )}

      {/* Tabla ultimos leads */}
      <div className="card function-table">
        <div className="card-header py-3">
          <h6 className="card-title fw-bold mb-0">Ultimos leads agregados</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover dataTable mb-0">
              <thead>
                <tr>
                  {['Nombre','Rubro','Ciudad','Estado'].map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(null).map((_, i) => (
                    <tr key={i}>{Array(4).fill(null).map((__,j) => (
                      <td key={j}><div className="placeholder-glow"><span className="placeholder col-8" /></div></td>
                    ))}</tr>
                  ))
                ) : ultimosLeads.length === 0 ? (
                  <EmptyState icon="leads" title="Sin leads aun" description="Los ultimos leads agregados apareceran aqui." colSpan={4} />
                ) : (
                  ultimosLeads.map(lead => (
                    <tr key={lead.id} className="single-item chat-single-item">
                      <td>
                        <div className="hstack gap-3">
                          <div className="avatar-text user-avatar-text avatar-md text-white fw-bold" style={{ fontSize: 13 }}>
                            {(lead.nombre ?? '?')[0].toUpperCase()}
                          </div>
                          <span className="text-truncate-1-line fw-medium" style={{ color: '#0a0a0a' }}>
                            {lead.nombre ?? <span className="text-muted fst-italic">Sin nombre</span>}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted">{lead.rubro ?? '—'}</td>
                      <td className="text-muted">{lead.ciudad ?? '—'}</td>
                      <td><EstadoBadge estado={lead.estado} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
