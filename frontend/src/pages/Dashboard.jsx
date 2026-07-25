import { useEffect, useState } from 'react'
import {
  fetchContactadosParaAutoTransicion,
  marcarLeadsSinRespuesta,
  countLeadsTotales,
  countLeadsDesde,
  countLeadsEnEstados,
  countLeadsCerradosEnRango,
  fetchUltimosLeads,
} from '../services/leadsService'
import { fetchMontosFacturadosEnRango, fetchMontosPendientes } from '../services/paymentsService'

// ─── helpers ──────────────────────────────────────────────────────────────────

function hoyISO() {
  return new Date().toISOString().split('T')[0]
}

function inicioMesISO() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

function finMesISO() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
}

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n ?? 0)
}

// ─── estado por etiqueta ──────────────────────────────────────────────────────

const ESTADO_LABEL = {
  nuevo:        { label: 'Nuevo',        cls: 'bg-blue-50 text-blue-700 ring-blue-100' },
  contactado:   { label: 'Contactado',   cls: 'bg-yellow-50 text-yellow-700 ring-yellow-100' },
  demo_enviado: { label: 'Demo enviado', cls: 'bg-purple-50 text-purple-700 ring-purple-100' },
  negociando:   { label: 'Negociando',   cls: 'bg-orange-50 text-orange-700 ring-orange-100' },
  cerrado:      { label: 'Cerrado',      cls: 'bg-green-50 text-green-700 ring-green-100' },
  descartado:   { label: 'Descartado',   cls: 'bg-gray-100 text-gray-500 ring-gray-200' },
}

function EstadoBadge({ estado }) {
  const { label, cls } = ESTADO_LABEL[estado] ?? { label: estado, cls: 'bg-gray-100 text-gray-500 ring-gray-200' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  )
}

// ─── card de métrica ──────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4 items-start">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-2xl font-bold text-gray-800 tabular-nums leading-none">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-gray-400">{sub}</p>
        )}
      </div>
    </div>
  )
}

// ─── íconos ───────────────────────────────────────────────────────────────────

const Icons = {
  leads: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  new: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pipeline: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  check: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mrr: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
    </svg>
  ),
  pending: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [metricas, setMetricas] = useState(null)
  const [ultimosLeads, setUltimosLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoMovidos, setAutoMovidos] = useState(0)

  useEffect(() => {
    // Auto-transición: contactado → sin_respuesta después de 72hs
    async function autoTransicion() {
      const contactados = await fetchContactadosParaAutoTransicion()

      if (!contactados.length) return

      const limite = Date.now() - 72 * 3600 * 1000
      const stale = contactados.filter((l) => {
        const fecha = l.fecha_ultimo_movimiento ?? l.created_at
        return fecha && new Date(fecha).getTime() < limite
      })

      if (stale.length > 0) {
        await marcarLeadsSinRespuesta(stale.map((l) => l.id))
        setAutoMovidos(stale.length)
      }
    }
    autoTransicion()
  }, [])

  useEffect(() => {
    async function fetchAll() {
      const hoy = hoyISO()
      const inicioMes = inicioMesISO()
      const finMes = finMesISO()

      const [
        resTotales,
        resHoy,
        resPipeline,
        resCerrados,
        resMRR,
        resPendiente,
      ] = await Promise.all([
        countLeadsTotales(),
        countLeadsDesde(`${hoy}T00:00:00`),
        countLeadsEnEstados(['contactado', 'demo_enviado', 'negociando']),
        countLeadsCerradosEnRango(inicioMes, finMes),
        fetchMontosFacturadosEnRango(hoy.slice(0, 7) + '-01', finMes.split('T')[0]),
        fetchMontosPendientes(),
      ])

      const ultimosLeads = await fetchUltimosLeads(5)

      const mrr = (resMRR.data ?? []).reduce((s, p) => s + (p.monto ?? 0), 0)  // ahora = facturado este mes
      const pendiente = (resPendiente.data ?? []).reduce((s, p) => s + (p.monto ?? 0), 0)

      setMetricas({
        totales:   resTotales.count   ?? 0,
        hoy:       resHoy.count       ?? 0,
        pipeline:  resPipeline.count  ?? 0,
        cerrados:  resCerrados.count  ?? 0,
        mrr,
        pendiente,
      })
      setUltimosLeads(ultimosLeads)
      setLoading(false)
    }

    fetchAll()
  }, [])

  const cards = metricas ? [
    { icon: Icons.leads,    label: 'Leads totales',       value: metricas.totales  },
    { icon: Icons.new,      label: 'Leads nuevos hoy',    value: metricas.hoy      },
    { icon: Icons.pipeline, label: 'En pipeline',         value: metricas.pipeline },
    { icon: Icons.check,    label: 'Cerrados este mes',   value: metricas.cerrados },
    { icon: Icons.mrr,      label: 'Facturado este mes',  value: formatARS(metricas.mrr),      isCurrency: true },
    { icon: Icons.pending,  label: 'Pendiente de cobro',  value: formatARS(metricas.pendiente), isCurrency: true },
  ] : Array(6).fill(null)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {autoMovidos > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V8.75a.75.75 0 00-1.5 0v4.5zm.75-6.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">
              <span className="font-semibold">{autoMovidos} lead{autoMovidos !== 1 ? 's' : ''}</span>
              {' '}pasaron a <span className="font-semibold">Sin respuesta</span> por más de 72hs sin movimiento.
            </p>
          </div>
          <button onClick={() => setAutoMovidos(0)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) =>
          card ? (
            <MetricCard
              key={card.label}
              icon={card.icon}
              label={card.label}
              value={card.value}
              loading={loading}
            />
          ) : (
            <MetricCard key={i} label="" value="" loading={true} />
          )
        )}
      </div>

      {/* Últimos leads */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Últimos leads agregados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Nombre', 'Rubro', 'Ciudad', 'Estado'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(4).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: `${60 + (i + j) * 7}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : ultimosLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    No hay leads registrados aún.
                  </td>
                </tr>
              ) : (
                ultimosLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                      {lead.nombre ?? <span className="text-gray-400 italic">Sin nombre</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {lead.rubro ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {lead.ciudad ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={lead.estado} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
