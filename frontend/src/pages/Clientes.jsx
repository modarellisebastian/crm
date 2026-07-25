import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatARS(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0)
}

function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = (iso.split('T')[0]).split('-')
  return `${d}/${m}/${y}`
}

function diasHasta(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

const HOY = new Date().toISOString().split('T')[0]

// ─── constantes ───────────────────────────────────────────────────────────────

const TIPOS_PAGO = ['proyecto', 'mantenimiento', 'hosting', 'soporte']

const TIPO_LABEL = {
  proyecto:      'Proyecto',
  mantenimiento: 'Mantenimiento',
  hosting:       'Hosting',
  soporte:       'Soporte',
}

const TIPO_SHORT = {
  proyecto:      'Proy.',
  mantenimiento: 'Mant.',
  hosting:       'Host.',
  soporte:       'Sop.',
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

const SERVICIO_BADGE = {
  recurrente: 'bg-blue-50 text-blue-700 ring-blue-100',
  unico:      'bg-gray-100 text-gray-600 ring-gray-200',
}

const FRECUENCIA_LABEL = { mensual: '/mes', anual: '/año' }

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

// ─── VencimientoBadge ─────────────────────────────────────────────────────────

function VencimientoBadge({ fecha }) {
  if (!fecha) return <span className="text-gray-300 text-sm">—</span>
  const dias  = diasHasta(fecha)
  const label = formatFecha(fecha)
  if (dias < 0)   return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />Vencido</span>
  if (dias <= 30) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{label}</span>
  return <span className="text-sm text-gray-500">{label}</span>
}

// ─── PendienteCell ────────────────────────────────────────────────────────────

function PendienteCell({ pagos }) {
  const pendientes = pagos.filter((p) => !p.pagado)
  const total      = pendientes.reduce((s, p) => s + (p.monto ?? 0), 0)

  if (total === 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
      Al día
    </span>
  )

  const porTipo = {}
  pendientes.forEach((p) => { porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + (p.monto ?? 0) })

  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-amber-600 tabular-nums">{formatARS(total)}</p>
      <div className="flex flex-wrap gap-1">
        {Object.entries(porTipo).map(([tipo, monto]) => (
          <span key={tipo}
            className={`inline-flex items-center gap-0.5 rounded-full text-xs font-medium px-1.5 py-0.5 ring-1 ring-inset ${TIPO_BADGE[tipo] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIPO_DOT[tipo] ?? 'bg-gray-400'}`} />
            {TIPO_SHORT[tipo] ?? tipo} {formatARS(monto)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── InlineFormPago ───────────────────────────────────────────────────────────

function infoDeSvc(svc) {
  if (!svc) return { tipo: 'proyecto', monto: '' }
  return {
    tipo:  svc.tipo === 'recurrente' ? 'mantenimiento' : 'proyecto',
    monto: svc.monto != null ? String(svc.monto) : '',
  }
}

function InlineFormPago({ cliente, onAgregar }) {
  const servicios    = (cliente.servicios ?? []).filter((s) => s.activo)
  const defaultSvcId = servicios[0] ? String(servicios[0].id) : '__manual'
  const defaultInfo  = infoDeSvc(servicios[0])

  const [svcId,      setSvcId]      = useState(defaultSvcId)
  const [tipo,       setTipo]       = useState(defaultInfo.tipo)
  const [monto,      setMonto]      = useState(defaultInfo.monto)
  const [descripcion,setDesc]       = useState('')
  const [fecha,      setFecha]      = useState(HOY)
  const [pagado,     setPagado]     = useState(false)
  const [esSoporte,  setEsSoporte]  = useState(false)
  const [horas,      setHoras]      = useState('')
  const [valorHora,  setValorHora]  = useState('')
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState(null)

  const totalSoporte = esSoporte && horas && valorHora
    ? Number(horas) * Number(valorHora)
    : null

  function handleSvcChange(id) {
    setSvcId(id)
    if (id === '__manual') {
      setTipo('proyecto'); setMonto('')
    } else {
      const svc  = servicios.find((s) => String(s.id) === id)
      const info = infoDeSvc(svc)
      setTipo(info.tipo); setMonto(info.monto)
    }
  }

  function handleTipoChange(t) {
    setTipo(t)
    setEsSoporte(t === 'soporte')
    if (t === 'soporte') setMonto('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (esSoporte) {
      if (!horas || !valorHora) { setError('Ingresá horas y valor por hora.'); return }
    } else {
      if (!monto || Number(monto) <= 0) { setError('Ingresá el monto.'); return }
    }

    setGuardando(true)
    const montoFinal = esSoporte ? totalSoporte : Number(monto)

    const { data, error: err } = await supabase.from('payments').insert({
      client_id:   cliente.id,
      tipo:        esSoporte ? 'soporte' : tipo,
      monto:       montoFinal,
      descripcion: descripcion || null,
      fecha_cobro: fecha,
      pagado,
      horas:       esSoporte ? Number(horas) : null,
    }).select().single()

    if (err) { setError(err.message); setGuardando(false); return }

    onAgregar(data)
    setDesc('')
    setHoras('')
    if (!esSoporte && svcId !== '__manual') {
      const svc = servicios.find((s) => String(s.id) === svcId)
      setMonto(infoDeSvc(svc).monto)
    } else if (!esSoporte) {
      setMonto('')
    }
    setGuardando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Registrar cobro</span>
        <span className="ml-1">
          <Tooltip
            text="Cargá un nuevo cobro para este cliente. Si tiene servicios configurados, seleccioná uno para pre-completar el monto y tipo automáticamente."
            wide
          />
        </span>
      </div>

      {/* Campos */}
      <div className="flex flex-wrap gap-3 items-end">

        {/* Servicio (si tiene servicios activos) */}
        {servicios.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500">Servicio</label>
              <Tooltip text="Seleccioná un servicio para pre-completar el monto y tipo. 'Manual' si es un cobro puntual no vinculado a un servicio." wide />
            </div>
            <select
              value={svcId}
              onChange={(e) => handleSvcChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {servicios.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre}{s.monto != null ? ` · ${formatARS(s.monto)}` : ''}
                </option>
              ))}
              <option value="__manual">Manual</option>
            </select>
          </div>
        )}

        {/* Descripción */}
        <div className="space-y-1 flex-1 min-w-[180px]">
          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-500">Descripción</label>
            <Tooltip text='Qué incluye este cobro. Ej: "Mantenimiento mayo 2025", "Proyecto sitio web – cuota 2 de 3", "Hosting renovación anual 2025".' wide />
          </div>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDesc(e.target.value)}
            placeholder='Ej: Mantenimiento mayo 2025'
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Tipo (solo si es manual) */}
        {(svcId === '__manual' || servicios.length === 0) && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500">Tipo</label>
              <Tooltip text="Proyecto: pago único por desarrollo. Mantenimiento: cuota mensual. Hosting: renovación anual. Soporte: horas de trabajo puntual (se calcula automáticamente)." wide />
            </div>
            <select
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              {TIPOS_PAGO.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
        )}

        {/* Soporte por horas */}
        {esSoporte ? (
          <>
            <div className="space-y-1 w-24">
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-gray-500">Horas</label>
                <Tooltip text="Cantidad de horas trabajadas. El total se calcula multiplicando por el valor/hora." />
              </div>
              <input
                type="number" min="0" step="0.5" placeholder="0"
                value={horas} onChange={(e) => setHoras(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="space-y-1 w-28">
              <div className="flex items-center gap-1">
                <label className="text-xs font-medium text-gray-500">Valor/hora</label>
                <Tooltip text="Precio por hora de soporte. El total = horas × valor/hora." />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                <input
                  type="number" min="0" placeholder="0"
                  value={valorHora} onChange={(e) => setValorHora(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 pl-6 pr-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            {totalSoporte != null && (
              <div className="self-end pb-1.5">
                <span className="text-sm font-bold text-teal-700 tabular-nums">= {formatARS(totalSoporte)}</span>
              </div>
            )}
          </>
        ) : (
          /* Monto fijo */
          <div className="space-y-1 w-32">
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500">Monto</label>
              <Tooltip text="Si seleccionaste un servicio con monto fijo, se pre-completa automáticamente. Podés modificarlo." />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
              <input
                type="number" min="0" placeholder="0"
                value={monto} onChange={(e) => setMonto(e.target.value)}
                className="w-full rounded-lg border border-gray-200 pl-6 pr-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {/* Fecha */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-500">Fecha</label>
            <Tooltip text="Fecha del cobro o de emisión de la factura. Por defecto es hoy." />
          </div>
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Ya cobrado + botón */}
        <div className="flex items-center gap-3 self-end pb-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox" checked={pagado}
              onChange={(e) => setPagado(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">Ya cobrado</span>
            <Tooltip text="Activá si el cliente ya pagó. Si no, queda como pendiente y aparece en la sección de cobros a reclamar." />
          </label>
          <button
            type="submit" disabled={guardando}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {guardando
              ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              : <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd"/></svg>
            }
            Agregar cobro
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}

// ─── PagoItem ─────────────────────────────────────────────────────────────────

function PagoItem({ pago, onTogglePagado, onEliminar }) {
  const [toggling,  setToggling]  = useState(false)
  const [eliminando,setEliminando]= useState(false)

  async function handleToggle() {
    setToggling(true)
    await onTogglePagado(pago)
    setToggling(false)
  }

  async function handleEliminar() {
    setEliminando(true)
    await onEliminar(pago.id)
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
      pago.pagado ? 'bg-gray-50' : 'bg-white border border-amber-100 shadow-sm'
    }`}>
      {/* Indicador de tipo */}
      <span className={`w-2 h-2 rounded-full shrink-0 mt-0.5 self-start ${TIPO_DOT[pago.tipo] ?? 'bg-gray-300'}`} />

      {/* Descripción + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${pago.pagado ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
          {pago.descripcion ?? <span className="italic text-gray-400">Sin descripción</span>}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TIPO_BADGE[pago.tipo] ?? 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
            {TIPO_LABEL[pago.tipo] ?? pago.tipo}
          </span>
          <span className="text-xs text-gray-400">{formatFecha(pago.fecha_cobro)}</span>
          {pago.horas != null && (
            <span className="text-xs text-teal-600">{pago.horas}h</span>
          )}
        </div>
      </div>

      {/* Monto */}
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${pago.pagado ? 'text-gray-400' : 'text-gray-800'}`}>
        {formatARS(pago.monto)}
      </span>

      {/* Toggle cobrado */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        title={pago.pagado ? 'Marcar como pendiente' : 'Marcar como cobrado'}
        className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
          pago.pagado
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
      >
        {pago.pagado ? (
          <>
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Cobrado
          </>
        ) : (
          <>
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            Cobrar
          </>
        )}
      </button>

      {/* Eliminar */}
      <button
        onClick={handleEliminar}
        disabled={eliminando}
        title="Eliminar este cobro"
        className="shrink-0 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
      >
        {eliminando
          ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          : <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
        }
      </button>
    </div>
  )
}

// ─── FilaServicio (solo en modal) ─────────────────────────────────────────────

function FilaServicio({ servicio, onToggleActivo, onEliminar }) {
  const [eliminando, setEliminando] = useState(false)

  async function handleEliminar() {
    setEliminando(true)
    await onEliminar(servicio.id)
    setEliminando(false)
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <input
        type="checkbox" checked={servicio.activo}
        onChange={() => onToggleActivo(servicio)}
        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
        title={servicio.activo ? 'Activo — click para pausar' : 'Inactivo — click para activar'}
      />
      <span className={`text-sm font-medium flex-1 truncate ${servicio.activo ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
        {servicio.nombre}
      </span>
      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SERVICIO_BADGE[servicio.tipo]}`}>
        {servicio.tipo}{servicio.frecuencia ? ` · ${servicio.frecuencia}` : ''}
      </span>
      {servicio.valor_hora != null ? (
        <span className="text-xs text-teal-600 font-medium tabular-nums shrink-0">
          {formatARS(servicio.valor_hora)}/h
        </span>
      ) : servicio.monto != null ? (
        <span className="text-xs text-gray-500 tabular-nums shrink-0">
          {formatARS(servicio.monto)}{servicio.frecuencia ? FRECUENCIA_LABEL[servicio.frecuencia] : ''}
        </span>
      ) : null}
      <button onClick={handleEliminar} disabled={eliminando}
        className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  )
}

// ─── FormServicio ─────────────────────────────────────────────────────────────

const SERVICIO_VACIO = { nombre: '', tipo: 'recurrente', frecuencia: 'mensual', monto: '', por_horas: false, valor_hora: '' }

function FormServicio({ onAgregar, onCancelar }) {
  const [s, setS] = useState(SERVICIO_VACIO)
  function set(k, v) { setS((f) => ({ ...f, [k]: v })) }

  function handleAgregar() {
    if (!s.nombre.trim()) return
    onAgregar({
      nombre:     s.nombre.trim(),
      tipo:       s.tipo,
      frecuencia: s.tipo === 'recurrente' ? s.frecuencia : null,
      monto:      (!s.por_horas && s.monto !== '') ? Number(s.monto) : null,
      valor_hora: (s.por_horas && s.valor_hora !== '') ? Number(s.valor_hora) : null,
      activo:     true,
    })
    setS(SERVICIO_VACIO)
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Nombre del servicio*" value={s.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          className="col-span-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={s.tipo} onChange={(e) => set('tipo', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="recurrente">Recurrente</option>
          <option value="unico">Único</option>
        </select>
        {s.tipo === 'recurrente' ? (
          <select value={s.frecuencia} onChange={(e) => set('frecuencia', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400">Pago único</div>
        )}
        <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={s.por_horas} onChange={(e) => set('por_horas', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm text-gray-700">Cobrar por horas</span>
        </label>
        {s.por_horas ? (
          <div className="col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input type="number" min="0" placeholder="Valor por hora" value={s.valor_hora}
              onChange={(e) => set('valor_hora', e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-7 pr-12 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/hora</span>
          </div>
        ) : (
          <div className="col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input type="number" min="0" placeholder="Monto (opcional)" value={s.monto}
              onChange={(e) => set('monto', e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleAgregar}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
          Agregar servicio
        </button>
      </div>
    </div>
  )
}

// ─── ModalCliente ─────────────────────────────────────────────────────────────

function ModalCliente({ clienteInicial, onGuardar, onCerrar }) {
  const esEdicion = Boolean(clienteInicial)

  const [form, setForm] = useState({
    nombre:                    clienteInicial?.nombre                    ?? '',
    rubro:                     clienteInicial?.rubro                     ?? '',
    ciudad:                    clienteInicial?.ciudad                    ?? '',
    email:                     clienteInicial?.email                     ?? '',
    telefono:                  clienteInicial?.telefono                  ?? '',
    fecha_inicio:              clienteInicial?.fecha_inicio              ?? HOY,
    fecha_vencimiento_hosting: clienteInicial?.fecha_vencimiento_hosting ?? '',
    url_sitio_entregado:       clienteInicial?.url_sitio_entregado       ?? '',
    url_demo_stitch:           clienteInicial?.url_demo_stitch           ?? '',
    notas:                     clienteInicial?.notas                     ?? '',
  })
  const [servicios, setServicios]           = useState(clienteInicial?.servicios ?? [])
  const [idsAEliminar, setIdsAEliminar]     = useState([])
  const [mostrarFormSvc, setMostrarFormSvc] = useState(false)
  const [guardando, setGuardando]           = useState(false)
  const [error, setError]                   = useState(null)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function agregarServicio(svc) {
    setServicios((prev) => [...prev, { ...svc, _nuevo: true, _id: crypto.randomUUID() }])
    setMostrarFormSvc(false)
  }

  function quitarServicio(id) {
    const svc = servicios.find((s) => (s.id ?? s._id) === id)
    if (svc?.id) setIdsAEliminar((prev) => [...prev, svc.id])
    setServicios((prev) => prev.filter((s) => (s.id ?? s._id) !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setGuardando(true); setError(null)

    const payload = {
      nombre:                    form.nombre,
      rubro:                     form.rubro || null,
      ciudad:                    form.ciudad || null,
      email:                     form.email || null,
      telefono:                  form.telefono || null,
      fecha_inicio:              form.fecha_inicio || null,
      fecha_vencimiento_hosting: form.fecha_vencimiento_hosting || null,
      url_sitio_entregado:       form.url_sitio_entregado || null,
      url_demo_stitch:           form.url_demo_stitch || null,
      notas:                     form.notas || null,
    }

    if (esEdicion) {
      const { error: e1 } = await supabase.from('clients').update(payload).eq('id', clienteInicial.id)
      if (e1) { setError(e1.message); setGuardando(false); return }

      if (idsAEliminar.length > 0) {
        const { error: e2 } = await supabase.from('servicios').delete().in('id', idsAEliminar)
        if (e2) { setError(e2.message); setGuardando(false); return }
      }

      const nuevos = servicios.filter((s) => s._nuevo)
      if (nuevos.length > 0) {
        const { error: e3 } = await supabase.from('servicios').insert(
          nuevos.map(({ nombre, tipo, frecuencia, monto, valor_hora, activo }) => ({
            client_id: clienteInicial.id, nombre, tipo, frecuencia, monto, valor_hora, activo,
          }))
        )
        if (e3) { setError(e3.message); setGuardando(false); return }
      }

      const { data } = await supabase.from('clients')
        .select('*, leads(nombre, rubro, ciudad), payments(*), servicios(*)')
        .eq('id', clienteInicial.id).single()
      onGuardar(data)
    } else {
      const { data: cliente, error: e1 } = await supabase.from('clients').insert(payload).select().single()
      if (e1) { setError(e1.message); setGuardando(false); return }

      if (servicios.length > 0) {
        await supabase.from('servicios').insert(
          servicios.map(({ nombre, tipo, frecuencia, monto, valor_hora, activo }) => ({
            client_id: cliente.id, nombre, tipo, frecuencia, monto, valor_hora, activo,
          }))
        )
      }

      const { data } = await supabase.from('clients')
        .select('*, leads(nombre, rubro, ciudad), payments(*), servicios(*)')
        .eq('id', cliente.id).single()
      onGuardar(data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {esEdicion ? `Editar — ${clienteInicial.nombre}` : 'Nuevo cliente'}
          </h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6">

          {/* Datos básicos */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos del cliente</p>
              <Tooltip text="Información de contacto del cliente. El nombre es el único campo obligatorio." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="block text-xs font-medium text-gray-600">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Nombre del cliente o empresa"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Rubro</label>
                <input type="text" value={form.rubro} onChange={(e) => set('rubro', e.target.value)}
                  placeholder="Ej: Gimnasio"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Ciudad</label>
                <input type="text" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}
                  placeholder="Ej: Tandil"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Teléfono / WhatsApp</label>
                <input type="text" value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                  placeholder="+54 9 ..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </section>

          {/* Proyecto */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Proyecto web</p>
              <Tooltip text="Datos relacionados al sitio entregado y vencimiento de hosting. El sistema te avisará cuando el hosting esté por vencer." wide />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Fecha de inicio</label>
                  <Tooltip text="Cuándo comenzó el proyecto o la relación con este cliente." />
                </div>
                <input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Vencimiento hosting</label>
                  <Tooltip text="Fecha en que vence el plan de hosting del cliente. Aparece resaltada en rojo/amarillo si está cerca o vencida." />
                </div>
                <input type="date" value={form.fecha_vencimiento_hosting} onChange={(e) => set('fecha_vencimiento_hosting', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">URL sitio entregado</label>
                  <Tooltip text="URL del sitio web ya publicado y entregado al cliente." />
                </div>
                <input type="text" value={form.url_sitio_entregado} onChange={(e) => set('url_sitio_entregado', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">URL demo</label>
                  <Tooltip text="Enlace a la demo o propuesta que se le envió al cliente antes de cerrar." />
                </div>
                <input type="text" value={form.url_demo_stitch} onChange={(e) => set('url_demo_stitch', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Notas internas</label>
                  <Tooltip text="Observaciones privadas sobre el cliente: preferencias, historial de conversaciones, próximos pasos, etc." />
                </div>
                <textarea rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)}
                  placeholder="Detalles del proyecto, acuerdos, recordatorios…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </section>

          {/* Servicios */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Servicios</p>
                <Tooltip
                  text="Servicios contratados por este cliente. Los servicios activos aparecen en la tabla principal y se usan para pre-completar el monto al registrar cobros. Podés pausarlos sin eliminarlos."
                  wide
                />
              </div>
              {!mostrarFormSvc && (
                <button type="button" onClick={() => setMostrarFormSvc(true)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Agregar servicio
                </button>
              )}
            </div>

            {servicios.length > 0 && (
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 px-3">
                {servicios.map((s) => {
                  const id = s.id ?? s._id
                  return (
                    <div key={id} className="flex items-center gap-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SERVICIO_BADGE[s.tipo]}`}>
                        {s.tipo}{s.frecuencia ? ` · ${s.frecuencia}` : ''}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{s.nombre}</span>
                      {s.monto != null && (
                        <span className="text-xs text-gray-400 tabular-nums shrink-0">
                          {formatARS(s.monto)}{s.frecuencia ? FRECUENCIA_LABEL[s.frecuencia] : ''}
                        </span>
                      )}
                      <button type="button" onClick={() => quitarServicio(id)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {mostrarFormSvc && <FormServicio onAgregar={agregarServicio} onCancelar={() => setMostrarFormSvc(false)} />}

            {servicios.length === 0 && !mostrarFormSvc && (
              <p className="text-xs text-gray-400 py-1">Sin servicios. Podés agregarlos ahora o después.</p>
            )}
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── FilaCliente ──────────────────────────────────────────────────────────────

function FilaCliente({ cliente, onEditar, onEliminar }) {
  const [expandido,   setExpandido]   = useState(false)
  const [pagos,       setPagos]       = useState(cliente.payments ?? [])
  const [servicios,   setServicios]   = useState(cliente.servicios ?? [])
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando,  setEliminando]  = useState(false)

  const svcActivos = servicios.filter((s) => s.activo)
  const lead       = cliente.leads
  const pagado     = pagos.filter((p) => p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)
  const pendiente  = pagos.filter((p) => !p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)

  async function togglePagado(pago) {
    const nuevo = !pago.pagado
    setPagos((prev) => prev.map((p) => p.id === pago.id ? { ...p, pagado: nuevo } : p))
    const { error } = await supabase.from('payments').update({ pagado: nuevo }).eq('id', pago.id)
    if (error) setPagos((prev) => prev.map((p) => p.id === pago.id ? { ...p, pagado: pago.pagado } : p))
  }

  async function eliminarPago(id) {
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id))
  }

  function onPagoAgregado(pago) { setPagos((prev) => [pago, ...prev]) }

  function onServiciosActualizados() {}

  async function handleEliminar() {
    setEliminando(true)
    const { error } = await supabase.from('clients').delete().eq('id', cliente.id)
    if (!error) onEliminar(cliente.id)
    else setEliminando(false)
    setConfirmando(false)
  }

  const pagosSorted = [...pagos].sort((a, b) => (b.fecha_cobro ?? '').localeCompare(a.fecha_cobro ?? ''))

  return (
    <>
      <tr className={`transition-colors ${expandido ? 'bg-blue-50/30' : 'hover:bg-gray-50/70'}`}>

        {/* Expand + Cliente */}
        <td className="px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => setExpandido(!expandido)}
              title={expandido ? 'Ocultar cobros' : 'Ver cobros y registrar'}
              className={`mt-1 shrink-0 transition-all duration-150 ${expandido ? 'rotate-90 text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 leading-snug">{cliente.nombre ?? '—'}</p>
              {(() => {
                const r = cliente.rubro ?? lead?.rubro
                const c = cliente.ciudad ?? lead?.ciudad
                return (r || c) ? <p className="text-xs text-gray-400 truncate">{[r, c].filter(Boolean).join(' · ')}</p> : null
              })()}
              {(cliente.email || cliente.telefono) && (
                <p className="text-xs text-gray-400 truncate">{cliente.email ?? cliente.telefono}</p>
              )}
            </div>
          </div>
        </td>

        {/* Servicios activos */}
        <td className="px-4 py-3">
          {svcActivos.length === 0 ? (
            <span className="text-xs text-gray-300 italic">Sin servicios</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {svcActivos.slice(0, 3).map((s) => (
                <span key={s.id ?? s._id}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SERVICIO_BADGE[s.tipo]}`}>
                  {s.nombre}
                  {s.monto != null && <span className="ml-1 opacity-60">{formatARS(s.monto)}</span>}
                </span>
              ))}
              {svcActivos.length > 3 && <span className="text-xs text-gray-400 self-center">+{svcActivos.length - 3}</span>}
            </div>
          )}
        </td>

        {/* Venc. Hosting */}
        <td className="px-4 py-3 whitespace-nowrap">
          <VencimientoBadge fecha={cliente.fecha_vencimiento_hosting} />
        </td>

        {/* Pendiente */}
        <td className="px-4 py-3">
          <PendienteCell pagos={pagos} />
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpandido(true)}
              title="Registrar cobro — abre el historial con el formulario"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
              </svg>
              Cobro
            </button>
            <button
              onClick={() => onEditar(cliente, onServiciosActualizados)}
              title="Editar datos del cliente y servicios"
              className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            </button>
            {confirmando ? (
              <div className="flex items-center gap-1">
                <button onClick={handleEliminar} disabled={eliminando}
                  className="text-xs font-medium text-red-600 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 disabled:opacity-50">
                  {eliminando ? '…' : 'Sí, eliminar'}
                </button>
                <button onClick={() => setConfirmando(false)}
                  className="text-xs font-medium text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100">
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmando(true)} title="Eliminar cliente"
                className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Panel expandido — solo cobros */}
      {expandido && (
        <tr>
          <td colSpan={5} className="bg-slate-50/60 border-b border-slate-200 px-0 py-0">
            <div className="px-10 py-5 space-y-4">

              {/* Resumen financiero */}
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total facturado</p>
                  <p className="text-xl font-bold text-gray-700 tabular-nums">{formatARS(pagado + pendiente)}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cobrado</p>
                  <p className="text-xl font-bold text-green-600 tabular-nums">{formatARS(pagado)}</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Pendiente</p>
                  <p className={`text-xl font-bold tabular-nums ${pendiente > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                    {formatARS(pendiente)}
                  </p>
                </div>
              </div>

              {/* Formulario inline */}
              <InlineFormPago
                cliente={{ ...cliente, servicios }}
                onAgregar={onPagoAgregado}
              />

              {/* Historial */}
              {pagosSorted.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Historial · {pagosSorted.length} cobro{pagosSorted.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1.5">
                    {pagosSorted.map((p) => (
                      <PagoItem
                        key={p.id}
                        pago={p}
                        onTogglePagado={togglePagado}
                        onEliminar={eliminarPago}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-400">
                  <svg className="w-4 h-4 shrink-0 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  Sin cobros registrados todavía. Usá el formulario de arriba para agregar el primero.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Clientes() {
  const [clientes,      setClientes]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [modalCliente,  setModalCliente]  = useState(null)

  useEffect(() => {
    async function fetchClientes() {
      const { data, error } = await supabase
        .from('clients')
        .select('*, leads(nombre, rubro, ciudad), payments(*), servicios(*)')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setClientes(data)
      setLoading(false)
    }
    fetchClientes()
  }, [])

  function handleEditar(cliente) { setModalCliente({ cliente }) }
  function handleEliminar(id)    { setClientes((prev) => prev.filter((c) => c.id !== id)) }

  function handleClienteGuardado(clienteActualizado) {
    setClientes((prev) => {
      const existe = prev.find((c) => c.id === clienteActualizado.id)
      return existe
        ? prev.map((c) => c.id === clienteActualizado.id ? clienteActualizado : c)
        : [clienteActualizado, ...prev]
    })
    setModalCliente(null)
  }

  // Métricas
  const pagosFlat = clientes.flatMap((c) => c.payments ?? [])
  const { inicio, fin } = (() => {
    const now = new Date()
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      fin:    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    }
  })()
  const pendienteTotal = pagosFlat.filter((p) => !p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)
  const cobradoMes     = pagosFlat
    .filter((p) => p.pagado && p.fecha_cobro >= inicio && p.fecha_cobro <= fin)
    .reduce((s, p) => s + (p.monto ?? 0), 0)
  const proxVencimientos = clientes.filter((c) => {
    const d = diasHasta(c.fecha_vencimiento_hosting)
    return d !== null && d >= 0 && d <= 30
  }).length

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
      <p className="text-sm text-gray-400">Cargando clientes…</p>
    </div>
  )

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
      <p className="text-sm text-red-500">Error: {error}</p>
    </div>
  )

  return (
    <>
      <div className="space-y-8">

        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Hacé click en el nombre para ver y registrar cobros</p>
          </div>
          <button
            onClick={() => setModalCliente('nuevo')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nuevo cliente
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Clientes activos',
              value: clientes.length,
              tooltip: 'Total de clientes registrados en el CRM.',
              accent: 'border-gray-200',
            },
            {
              label: 'Cobrado este mes',
              value: formatARS(cobradoMes),
              tooltip: 'Total marcado como cobrado con fecha en el mes actual.',
              accent: 'border-green-100',
            },
            {
              label: 'Pendiente de cobro',
              value: formatARS(pendienteTotal),
              tooltip: 'Total de cobros registrados que aún no fueron marcados como pagados, de todos los clientes.',
              accent: pendienteTotal > 0 ? 'border-amber-200' : 'border-gray-200',
            },
          ].map(({ label, value, tooltip, accent }) => (
            <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-1 ${accent}`}>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <Tooltip text={tooltip} />
              </div>
              <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Alerta vencimientos */}
        {proxVencimientos > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{proxVencimientos} cliente{proxVencimientos !== 1 ? 's' : ''}</span>
              {' '}tiene{proxVencimientos !== 1 ? 'n' : ''} el hosting por vencer en los próximos 30 días.
            </p>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Servicios
                      <Tooltip text="Servicios activos contratados. Se usan para pre-completar el monto al registrar cobros. Los podés gestionar desde el botón de editar." wide />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Hosting
                      <Tooltip text="Fecha de vencimiento del plan de hosting. Amarillo = menos de 30 días. Rojo = ya vencido." />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Pendiente
                      <Tooltip text="Cobros registrados que aún no fueron marcados como pagados. Se desglosa por tipo de servicio." wide />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="space-y-2">
                        <svg className="w-8 h-8 text-gray-200 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10Z" clipRule="evenodd" />
                          <path d="M3 15.055v-.93a49.176 49.176 0 008 .53c2.769 0 5.448-.294 8-.53v.93c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-11.274 0C3.985 17.585 3 16.402 3 15.055Z" />
                        </svg>
                        <p className="text-sm text-gray-400">No hay clientes todavía.</p>
                        <p className="text-xs text-gray-400">Creá uno con "Nuevo cliente" o convertí un lead cerrado desde la sección Leads.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <FilaCliente
                      key={cliente.id}
                      cliente={cliente}
                      onEditar={handleEditar}
                      onEliminar={handleEliminar}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalCliente && (
        <ModalCliente
          clienteInicial={modalCliente === 'nuevo' ? null : modalCliente.cliente}
          onGuardar={handleClienteGuardado}
          onCerrar={() => setModalCliente(null)}
        />
      )}
    </>
  )
}
