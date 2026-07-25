import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── helpers ──────────────────────────────────────────────────────────────────

function mesKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function mesLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

function prevMes(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return mesKey(d)
}

function nextMes(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m, 1)
  return mesKey(d)
}

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function formatUSD(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function numInput(val, set) {
  return (e) => set(e.target.value === '' ? '' : e.target.value)
}

// ─── ModalSaldos ──────────────────────────────────────────────────────────────

function ModalSaldos({ saldos, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    bbva:         saldos?.bbva         ?? '',
    mercadopago:  saldos?.mercadopago  ?? '',
    efectivo:     saldos?.efectivo     ?? '',
    cuenta_dni:   saldos?.cuenta_dni   ?? '',
    dolarapp_usd: saldos?.dolarapp_usd ?? '',
    tipo_cambio:  saldos?.tipo_cambio  ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    const payload = {
      fecha:        new Date().toISOString().split('T')[0],
      bbva:         Number(form.bbva)         || 0,
      mercadopago:  Number(form.mercadopago)  || 0,
      efectivo:     Number(form.efectivo)     || 0,
      cuenta_dni:   Number(form.cuenta_dni)   || 0,
      dolarapp_usd: Number(form.dolarapp_usd) || 0,
      tipo_cambio:  Number(form.tipo_cambio)  || 1500,
    }
    let result
    if (saldos?.id) {
      result = await supabase.from('casa_saldos').update(payload).eq('id', saldos.id).select().single()
    } else {
      result = await supabase.from('casa_saldos').insert(payload).select().single()
    }
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  const campos = [
    { key: 'bbva',         label: 'BBVA',         moneda: 'ARS' },
    { key: 'mercadopago',  label: 'MercadoPago',  moneda: 'ARS' },
    { key: 'efectivo',     label: 'Efectivo',      moneda: 'ARS' },
    { key: 'cuenta_dni',   label: 'Cuenta DNI',    moneda: 'ARS' },
    { key: 'dolarapp_usd', label: 'DolarApp',      moneda: 'USD' },
    { key: 'tipo_cambio',  label: 'Tipo de cambio (1 USD = $)', moneda: null },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Actualizar saldos</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {campos.map(({ key, label, moneda }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-40 text-sm text-gray-600 shrink-0">{label}</label>
              <div className="relative flex-1">
                {moneda && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    {moneda === 'ARS' ? '$' : 'U$D'}
                  </span>
                )}
                <input
                  type="number" min="0" step="any"
                  value={form[key]}
                  onChange={numInput(form[key], (v) => set(key, v))}
                  className={`w-full rounded-lg border border-gray-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${moneda ? 'pl-9 pr-3' : 'px-3'}`}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ModalGasto ───────────────────────────────────────────────────────────────

const GASTOS_FIJOS_DEFAULT = [
  'BBVA', 'Seguro Auto/casa', 'ICBC', 'Naranja Tarjeta',
  'Inmobiliaria', 'Contador', 'Maternal', 'Monotributo',
  'Préstamo TERE', 'Servicios', 'Patente',
]

function ModalGasto({ mes, item, onGuardar, onCerrar }) {
  const editando = Boolean(item)
  const [form, setForm] = useState({
    nombre:          item?.nombre          ?? '',
    monto:           item?.monto           ?? '',
    vencimiento_dia: item?.vencimiento_dia ?? '',
    pagado:          item?.pagado          ?? false,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre) { setError('Ingresá el nombre.'); return }
    if (!form.monto)  { setError('Ingresá el monto.');  return }
    setGuardando(true)
    const payload = {
      nombre:          form.nombre,
      monto:           Number(form.monto),
      vencimiento_dia: form.vencimiento_dia ? Number(form.vencimiento_dia) : null,
      pagado:          form.pagado,
    }
    let result
    if (editando) {
      result = await supabase.from('casa_gastos_fijos').update(payload).eq('id', item.id).select().single()
    } else {
      result = await supabase.from('casa_gastos_fijos').insert({ mes, ...payload }).select().single()
    }
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{editando ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input list="gastos-list" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej: Inmobiliaria"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <datalist id="gastos-list">
              {GASTOS_FIJOS_DEFAULT.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input type="number" min="0" step="1" value={form.monto}
                  onChange={(e) => set('monto', e.target.value)} placeholder="0"
                  className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Vence día</label>
              <input type="number" min="1" max="31" value={form.vencimiento_dia}
                onChange={(e) => set('vencimiento_dia', e.target.value)} placeholder="—"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.pagado} onChange={(e) => set('pagado', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-sm text-gray-700">Ya pagado</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ModalIngreso ─────────────────────────────────────────────────────────────

const INGRESOS_DEFAULT = [
  'HOLAHELLO', 'iP Hoteles', 'Jero Montagna', 'App GYM',
  'Megacompras', 'Peak', 'Cheeky', 'Leandro', 'FRAMAR',
  'CHEIL ARGENTINA', 'Quatro Performance', 'SIGLO 21',
]

function ModalIngreso({ mes, item, onGuardar, onCerrar }) {
  const editando = Boolean(item)
  const [form, setForm] = useState({
    nombre:  item?.nombre  ?? '',
    tipo:    item?.tipo    ?? 'freelance',
    moneda:  item?.moneda  ?? 'ars',
    monto:   item?.monto   ?? '',
    cobrado: item?.cobrado ?? false,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); setError(null) }

  function handleTipo(tipo) {
    setForm((f) => ({
      ...f, tipo,
      moneda: tipo === 'sueldo_usd' ? 'usd' : 'ars',
      nombre: tipo === 'sueldo_usd' ? 'Sueldo DolarApp' : f.nombre,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre) { setError('Ingresá el nombre.'); return }
    if (!form.monto)  { setError('Ingresá el monto.');  return }
    setGuardando(true)
    const payload = {
      nombre:  form.nombre,
      tipo:    form.tipo,
      moneda:  form.moneda,
      monto:   Number(form.monto),
      cobrado: form.cobrado,
    }
    let result
    if (editando) {
      result = await supabase.from('casa_ingresos').update(payload).eq('id', item.id).select().single()
    } else {
      result = await supabase.from('casa_ingresos').insert({ mes, ...payload }).select().single()
    }
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{editando ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'freelance',  label: 'Freelance (ARS)' },
              { val: 'sueldo_usd', label: 'Sueldo (USD)' },
            ].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => handleTipo(val)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  form.tipo === val
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Nombre / Cliente</label>
            <input list="ingresos-list" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej: HOLAHELLO"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <datalist id="ingresos-list">
              {INGRESOS_DEFAULT.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          {/* Monto */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Monto {form.moneda === 'usd' ? '(USD)' : '(ARS)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {form.moneda === 'usd' ? 'U$D' : '$'}
              </span>
              <input type="number" min="0" step="any" value={form.monto}
                onChange={(e) => set('monto', e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {/* Cobrado */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.cobrado} onChange={(e) => set('cobrado', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-sm text-gray-700">Ya cobrado</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FinanzasCasa() {
  const [mes, setMes] = useState(mesKey())
  const [saldos, setSaldos] = useState(null)
  const [gastos, setGastos] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalSaldos,   setModalSaldos]   = useState(false)
  const [modalGasto,    setModalGasto]    = useState(false)
  const [modalIngreso,  setModalIngreso]  = useState(false)
  const [editandoG,     setEditandoG]     = useState(null)
  const [editandoI,     setEditandoI]     = useState(null)
  const [eliminandoG,   setEliminandoG]   = useState(null)
  const [eliminandoI,   setEliminandoI]   = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [
        { data: s, error: e1 },
        { data: g, error: e2 },
        { data: i, error: e3 },
      ] = await Promise.all([
        supabase.from('casa_saldos').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('casa_gastos_fijos').select('*').eq('mes', mes).order('created_at'),
        supabase.from('casa_ingresos').select('*').eq('mes', mes).order('created_at'),
      ])
      if (e1 || e2 || e3) setError((e1 || e2 || e3).message)
      else { setSaldos(s); setGastos(g); setIngresos(i) }
      setLoading(false)
    }
    fetchData()
  }, [mes])

  // ── cálculos ─────────────────────────────────────────────────────────────────

  const tc = saldos?.tipo_cambio ?? 1500
  const usdActual = saldos?.dolarapp_usd ?? 0

  const totalPesos = (saldos?.bbva ?? 0) + (saldos?.mercadopago ?? 0)
    + (saldos?.efectivo ?? 0) + (saldos?.cuenta_dni ?? 0)

  const ingresosPendientesARS = ingresos
    .filter((i) => !i.cobrado && i.moneda === 'ars')
    .reduce((s, i) => s + i.monto, 0)

  const ingresosPendientesUSD = ingresos
    .filter((i) => !i.cobrado && i.moneda === 'usd')
    .reduce((s, i) => s + i.monto, 0)

  const gastosPendientesARS = gastos
    .filter((g) => !g.pagado)
    .reduce((s, g) => s + g.monto, 0)

  const totalIngresosARS   = ingresos.filter((i) => i.moneda === 'ars').reduce((s, i) => s + i.monto, 0)
  const totalIngresosUSD   = ingresos.filter((i) => i.moneda === 'usd').reduce((s, i) => s + i.monto, 0)
  const totalGastosARS     = gastos.reduce((s, g) => s + g.monto, 0)

  // Proyección: pesos disponibles = en cuenta + freelance pendiente - gastos fijos pendientes
  const netPesos = totalPesos + ingresosPendientesARS - gastosPendientesARS
  const usdVender = netPesos < 0 ? Math.abs(netPesos) / tc : 0
  const usdProyectado = usdActual + ingresosPendientesUSD - usdVender

  // ── acciones ─────────────────────────────────────────────────────────────────

  async function toggleGasto(g) {
    const nuevo = !g.pagado
    setGastos((prev) => prev.map((x) => x.id === g.id ? { ...x, pagado: nuevo } : x))
    const { error: err } = await supabase.from('casa_gastos_fijos').update({ pagado: nuevo }).eq('id', g.id)
    if (err) setGastos((prev) => prev.map((x) => x.id === g.id ? { ...x, pagado: g.pagado } : x))
  }

  async function toggleIngreso(i) {
    const nuevo = !i.cobrado
    setIngresos((prev) => prev.map((x) => x.id === i.id ? { ...x, cobrado: nuevo } : x))
    const { error: err } = await supabase.from('casa_ingresos').update({ cobrado: nuevo }).eq('id', i.id)
    if (err) setIngresos((prev) => prev.map((x) => x.id === i.id ? { ...x, cobrado: i.cobrado } : x))
  }

  async function eliminarGasto(id) {
    setEliminandoG(id)
    const { error: err } = await supabase.from('casa_gastos_fijos').delete().eq('id', id)
    if (!err) setGastos((prev) => prev.filter((x) => x.id !== id))
    setEliminandoG(null)
  }

  async function eliminarIngreso(id) {
    setEliminandoI(id)
    const { error: err } = await supabase.from('casa_ingresos').delete().eq('id', id)
    if (!err) setIngresos((prev) => prev.filter((x) => x.id !== id))
    setEliminandoI(null)
  }

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Finanzas Casa</h1>
      <p className="text-sm text-gray-400">Cargando…</p>
    </div>
  )

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Finanzas Casa</h1>
      <p className="text-sm text-red-500">Error: {error}</p>
    </div>
  )

  // ── render ───────────────────────────────────────────────────────────────────

  const iconTrash = (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
    </svg>
  )

  const iconEdit = (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  )

  return (
    <>
      <div className="space-y-8">

        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Finanzas Casa</h1>
            <p className="text-sm text-gray-400 mt-0.5">Gestión mensual del hogar</p>
          </div>
          {/* Selector de mes */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setMes(prevMes(mes))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 px-3 min-w-[140px] text-center">
              {mesLabel(mes)}
            </span>
            <button onClick={() => setMes(nextMes(mes))}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Saldos ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Saldos actuales</h2>
            <button onClick={() => setModalSaldos(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
              {saldos ? 'Actualizar' : 'Cargar saldos'}
            </button>
          </div>
          {saldos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'BBVA',        valor: saldos.bbva,        moneda: 'ars', color: 'border-blue-100' },
                { label: 'MercadoPago', valor: saldos.mercadopago, moneda: 'ars', color: 'border-indigo-100' },
                { label: 'Efectivo',    valor: saldos.efectivo,    moneda: 'ars', color: 'border-gray-200' },
                { label: 'Cuenta DNI',  valor: saldos.cuenta_dni,  moneda: 'ars', color: 'border-gray-200' },
                { label: 'DolarApp',    valor: saldos.dolarapp_usd, moneda: 'usd', color: 'border-green-100' },
                { label: 'Tipo cambio', valor: saldos.tipo_cambio,  moneda: 'tc',  color: 'border-amber-100' },
              ].map(({ label, valor, moneda, color }) => (
                <div key={label} className={`bg-white rounded-xl border shadow-sm p-3 ${color}`}>
                  <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                  <p className="text-base font-bold text-gray-800 tabular-nums">
                    {moneda === 'usd' ? formatUSD(valor)
                      : moneda === 'tc' ? `$${Number(valor).toLocaleString('es-AR')}`
                      : formatARS(valor)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-400">No hay saldos cargados.</p>
              <button onClick={() => setModalSaldos(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                Cargar saldos →
              </button>
            </div>
          )}
        </div>

        {/* ── Proyección ── */}
        {saldos && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label:   'Total en pesos',
                value:   formatARS(totalPesos),
                sub:     `${ingresos.filter(i => !i.cobrado && i.moneda==='ars').length} freelance pendiente${ingresos.filter(i=>!i.cobrado&&i.moneda==='ars').length!==1?'s':''}`,
                accent:  'border-blue-100',
              },
              {
                label:   'Gastos fijos del mes',
                value:   formatARS(totalGastosARS),
                sub:     `${gastos.filter(g=>!g.pagado).length} pendiente${gastos.filter(g=>!g.pagado).length!==1?'s':''}`,
                accent:  gastos.filter(g=>!g.pagado).length > 0 ? 'border-amber-200' : 'border-green-100',
              },
              {
                label:   'USD proyectado fin de mes',
                value:   formatUSD(usdProyectado),
                sub:     usdVender > 0
                  ? `Necesitás vender ~${formatUSD(usdVender)}`
                  : 'No necesitás vender USD',
                accent:  usdProyectado >= 1000 ? 'border-green-200' : 'border-red-200',
              },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 ${accent}`}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Gastos e Ingresos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gastos fijos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Gastos fijos</h2>
              <button onClick={() => setModalGasto(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Agregar
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {gastos.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Sin gastos fijos este mes.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Día</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gastos.map((g) => (
                      <tr key={g.id} className={g.pagado ? 'hover:bg-gray-50' : 'bg-amber-50/30 hover:bg-amber-50/50'}>
                        <td className="px-4 py-2.5 text-sm text-gray-800">{g.nombre}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold tabular-nums text-gray-800 text-right">
                          {formatARS(g.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-400 text-center">
                          {g.vencimiento_dia ? `día ${g.vencimiento_dia}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleGasto(g)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              g.pagado
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}>
                            {g.pagado ? '✓ Pagado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditandoG(g)} title="Editar"
                              className="text-gray-300 hover:text-blue-400 transition-colors">
                              {iconEdit}
                            </button>
                            <button onClick={() => eliminarGasto(g.id)} disabled={eliminandoG === g.id}
                              className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
                              {iconTrash}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total</td>
                      <td className="px-4 py-2.5 text-sm font-bold tabular-nums text-gray-800 text-right">
                        {formatARS(totalGastosARS)}
                      </td>
                      <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-400 text-center">
                        {gastos.filter(g=>g.pagado).length}/{gastos.length} pagados
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Ingresos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ingresos</h2>
              <button onClick={() => setModalIngreso(true)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Agregar
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {ingresos.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Sin ingresos registrados este mes.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente / Fuente</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ingresos.map((i) => (
                      <tr key={i.id} className={i.cobrado ? 'hover:bg-gray-50' : 'bg-blue-50/20 hover:bg-blue-50/40'}>
                        <td className="px-4 py-2.5">
                          <div className="text-sm text-gray-800">{i.nombre}</div>
                          <div className="text-xs text-gray-400">
                            {i.tipo === 'sueldo_usd' ? 'Sueldo USD' : 'Freelance'}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold tabular-nums text-right">
                          <span className={i.moneda === 'usd' ? 'text-green-700' : 'text-gray-800'}>
                            {i.moneda === 'usd' ? formatUSD(i.monto) : formatARS(i.monto)}
                          </span>
                          {i.moneda === 'usd' && saldos && (
                            <div className="text-xs text-gray-400 font-normal">
                              ≈ {formatARS(i.monto * tc)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleIngreso(i)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              i.cobrado
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                            {i.cobrado ? '✓ Cobrado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditandoI(i)} title="Editar"
                              className="text-gray-300 hover:text-blue-400 transition-colors">
                              {iconEdit}
                            </button>
                            <button onClick={() => eliminarIngreso(i.id)} disabled={eliminandoI === i.id}
                              className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
                              {iconTrash}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="text-sm font-bold text-gray-800 tabular-nums">{formatARS(totalIngresosARS)}</div>
                        {totalIngresosUSD > 0 && (
                          <div className="text-xs font-semibold text-green-700 tabular-nums">+ {formatUSD(totalIngresosUSD)}</div>
                        )}
                      </td>
                      <td colSpan={2} className="px-4 py-2.5 text-xs text-gray-400 text-center">
                        {ingresos.filter(i=>i.cobrado).length}/{ingresos.length} cobrados
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modales */}
      {modalSaldos && <ModalSaldos saldos={saldos} onGuardar={(d) => { setSaldos(d); setModalSaldos(false) }} onCerrar={() => setModalSaldos(false)} />}
      {(modalGasto || editandoG) && <ModalGasto mes={mes} item={editandoG}
        onGuardar={(d) => {
          if (editandoG) setGastos((p) => p.map((x) => x.id === d.id ? d : x))
          else setGastos((p) => [...p, d])
          setModalGasto(false); setEditandoG(null)
        }}
        onCerrar={() => { setModalGasto(false); setEditandoG(null) }} />}
      {(modalIngreso || editandoI) && <ModalIngreso mes={mes} item={editandoI}
        onGuardar={(d) => {
          if (editandoI) setIngresos((p) => p.map((x) => x.id === d.id ? d : x))
          else setIngresos((p) => [...p, d])
          setModalIngreso(false); setEditandoI(null)
        }}
        onCerrar={() => { setModalIngreso(false); setEditandoI(null) }} />}
    </>
  )
}
