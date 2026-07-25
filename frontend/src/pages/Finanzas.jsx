import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── helpers ──────────────────────────────────────────────────────────────────

function mesActual() {
  const now   = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const fin    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { inicio, fin }
}

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${d}/${m}/${y}`
}

// ─── constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['proyecto', 'mantenimiento', 'hosting', 'soporte']

const TIPO_LABEL = {
  proyecto:      'Proyecto',
  mantenimiento: 'Mantenimiento',
  hosting:       'Hosting',
  soporte:       'Soporte',
}

const TIPO_BADGE = {
  proyecto:      'bg-purple-50 text-purple-700 ring-purple-100',
  mantenimiento: 'bg-blue-50 text-blue-700 ring-blue-100',
  hosting:       'bg-amber-50 text-amber-700 ring-amber-100',
  soporte:       'bg-teal-50 text-teal-700 ring-teal-100',
}

const TIPO_DOT = {
  proyecto:      'bg-purple-400',
  mantenimiento: 'bg-blue-400',
  hosting:       'bg-amber-400',
  soporte:       'bg-teal-400',
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ text, wide }) {
  return (
    <span className="group relative inline-flex items-center">
      <svg
        className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors shrink-0"
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${wide ? 'w-64' : 'w-52'} rounded-xl bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 text-center shadow-lg`}>
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}

// ─── TipoBadge ────────────────────────────────────────────────────────────────

function TipoBadge({ tipo }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TIPO_BADGE[tipo] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIPO_DOT[tipo] ?? 'bg-gray-300'}`} />
      {TIPO_LABEL[tipo] ?? tipo}
    </span>
  )
}

// ─── modal nuevo cobro ────────────────────────────────────────────────────────

function ModalNuevoCobro({ clientes, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    client_id:   '',
    tipo:        'proyecto',
    descripcion: '',
    monto:       '',
    fecha_cobro: new Date().toISOString().split('T')[0],
    pagado:      false,
  })
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.client_id)   { setError('Seleccioná un cliente.');    return }
    if (!form.monto)       { setError('Ingresá el monto.');         return }
    if (!form.fecha_cobro) { setError('Ingresá la fecha de cobro.'); return }

    setGuardando(true)
    const { data, error: err } = await supabase.from('payments')
      .insert({
        client_id:   form.client_id,
        tipo:        form.tipo,
        descripcion: form.descripcion || null,
        monto:       Number(form.monto),
        fecha_cobro: form.fecha_cobro,
        pagado:      form.pagado,
      })
      .select('*, clients(nombre)')
      .single()

    if (err) { setError(err.message); setGuardando(false); return }
    onGuardar(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Nuevo cobro</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Cliente */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Seleccioná un cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <Tooltip text="Proyecto: pago único. Mantenimiento: cuota mensual. Hosting: renovación anual. Soporte: horas de trabajo puntual." wide />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button key={t} type="button" onClick={() => set('tipo', t)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    form.tipo === t
                      ? `${TIPO_BADGE[t]} border-transparent ring-1 ring-inset ${TIPO_BADGE[t]?.split(' ').find(c => c.startsWith('ring-'))}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <Tooltip text='Detalle del cobro. Ej: "Mantenimiento mayo 2025", "Proyecto sitio web – cuota 2 de 3", "Hosting 2025".' wide />
            </div>
            <input type="text" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
              placeholder='Ej: Mantenimiento mayo 2025'
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input type="number" min="0" step="1" placeholder="0" value={form.monto}
                onChange={(e) => set('monto', e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <Tooltip text="Fecha del cobro o emisión de la factura." />
            </div>
            <input type="date" value={form.fecha_cobro} onChange={(e) => set('fecha_cobro', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Ya pagado */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pagado} onChange={(e) => set('pagado', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-sm text-gray-700">Ya está cobrado</span>
            <Tooltip text="Activá si el dinero ya fue recibido. Si no, quedará como pendiente." />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Finanzas() {
  const [payments,      setPayments]      = useState([])
  const [clientes,      setClientes]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [modalAbierto,  setModalAbierto]  = useState(false)
  const [eliminando,    setEliminando]    = useState(null)
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroTipo,    setFiltroTipo]    = useState('')
  const [filtroPagado,  setFiltroPagado]  = useState('')

  useEffect(() => {
    async function fetchData() {
      const [{ data: pays, error: e1 }, { data: clis, error: e2 }] = await Promise.all([
        supabase.from('payments')
          .select('*, clients(nombre)')
          .order('fecha_cobro', { ascending: false }),
        supabase.from('clients')
          .select('id, nombre')
          .order('nombre'),
      ])
      if (e1 || e2) { setError((e1 || e2).message) }
      else { setPayments(pays); setClientes(clis) }
      setLoading(false)
    }
    fetchData()
  }, [])

  const { inicio, fin } = mesActual()

  const delMes        = payments.filter((p) => p.fecha_cobro >= inicio && p.fecha_cobro <= fin)
  const facturadoMes  = delMes.reduce((s, p) => s + (p.monto ?? 0), 0)
  const cobradoMes    = delMes.filter((p) => p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)
  const pendienteTotal= payments.filter((p) => !p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)

  const paymentsFiltrados = payments.filter((p) => {
    if (filtroCliente && p.client_id !== filtroCliente) return false
    if (filtroTipo    && p.tipo      !== filtroTipo)    return false
    if (filtroPagado === 'pagado'   && !p.pagado)       return false
    if (filtroPagado === 'pendiente' && p.pagado)       return false
    return true
  })

  async function togglePagado(payment) {
    const nuevo = !payment.pagado
    setPayments((prev) => prev.map((p) => p.id === payment.id ? { ...p, pagado: nuevo } : p))
    const { error: err } = await supabase.from('payments').update({ pagado: nuevo }).eq('id', payment.id)
    if (err) setPayments((prev) => prev.map((p) => p.id === payment.id ? { ...p, pagado: payment.pagado } : p))
  }

  async function eliminar(id) {
    setEliminando(id)
    const { error: err } = await supabase.from('payments').delete().eq('id', id)
    if (!err) setPayments((prev) => prev.filter((p) => p.id !== id))
    setEliminando(null)
  }

  function onGuardar(nuevo) { setPayments((prev) => [nuevo, ...prev]); setModalAbierto(false) }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Finanzas</h1>
      <p className="text-sm text-gray-400">Cargando datos…</p>
    </div>
  )

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Finanzas</h1>
      <p className="text-sm text-red-500">Error: {error}</p>
    </div>
  )

  return (
    <>
      <div className="space-y-8">

        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Finanzas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Vista global de todos los cobros</p>
          </div>
          <button onClick={() => setModalAbierto(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nuevo cobro
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label:   'Facturado este mes',
              value:   formatARS(facturadoMes),
              tooltip: 'Total de todos los cobros del mes actual (pagados o no).',
              accent:  'border-blue-100',
            },
            {
              label:   'Cobrado este mes',
              value:   formatARS(cobradoMes),
              tooltip: 'Total marcado como cobrado con fecha en el mes actual.',
              accent:  'border-green-100',
            },
            {
              label:   'Pendiente total',
              value:   formatARS(pendienteTotal),
              tooltip: 'Todo lo registrado que aún no fue marcado como cobrado, sin importar el mes.',
              accent:  pendienteTotal > 0 ? 'border-amber-200' : 'border-gray-200',
            },
          ].map(({ label, value, tooltip, accent }) => (
            <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 ${accent}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <Tooltip text={tooltip} />
              </div>
              <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option value="">Todos los clientes</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          </select>
          <select value={filtroPagado} onChange={(e) => setFiltroPagado(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
            <option value="">Todos los estados</option>
            <option value="cobrado">Cobrados</option>
            <option value="pendiente">Pendientes</option>
          </select>
          {(filtroCliente || filtroTipo || filtroPagado) && (
            <button onClick={() => { setFiltroCliente(''); setFiltroTipo(''); setFiltroPagado('') }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2 transition-colors">
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400 self-center">
            {paymentsFiltrados.length} cobro{paymentsFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  {[
                    { label: 'Cliente',     tooltip: null },
                    { label: 'Tipo',        tooltip: 'Proyecto: pago único. Mantenimiento: cuota mensual. Hosting: renovación. Soporte: horas.' },
                    { label: 'Descripción', tooltip: 'Detalle del cobro para identificarlo fácilmente.' },
                    { label: 'Monto',       tooltip: null },
                    { label: 'Fecha',       tooltip: 'Fecha de cobro o emisión.' },
                    { label: 'Estado',      tooltip: 'Si el cobro fue recibido o está pendiente de pago.' },
                    { label: '',            tooltip: null },
                  ].map(({ label, tooltip }, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {label && (
                        <div className="flex items-center gap-1">
                          {label}
                          {tooltip && <Tooltip text={tooltip} wide={tooltip.length > 60} />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                      No hay cobros que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paymentsFiltrados.map((p) => (
                    <tr key={p.id} className={`transition-colors ${p.pagado ? 'hover:bg-gray-50' : 'bg-amber-50/30 hover:bg-amber-50/50'}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {p.clients?.nombre ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <TipoBadge tipo={p.tipo} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[240px] truncate" title={p.descripcion}>
                        {p.descripcion ?? <span className="text-gray-300 italic text-xs">Sin descripción</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-gray-800 whitespace-nowrap">
                        {formatARS(p.monto)}
                        {p.horas != null && (
                          <span className="ml-1 text-xs font-normal text-gray-400">{p.horas}h</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatFecha(p.fecha_cobro)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePagado(p)}
                          title={p.pagado ? 'Marcar como pendiente' : 'Marcar como cobrado'}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                            p.pagado
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {p.pagado ? (
                            <>
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                              Cobrado
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                              </svg>
                              Cobrar
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => eliminar(p.id)} disabled={eliminando === p.id}
                          title="Eliminar cobro"
                          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
                          {eliminando === p.id
                            ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                            : <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd"/></svg>
                          }
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalAbierto && (
        <ModalNuevoCobro
          clientes={clientes}
          onGuardar={onGuardar}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </>
  )
}
