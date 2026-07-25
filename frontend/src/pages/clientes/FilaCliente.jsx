import { useState } from 'react'
import Tooltip from '../../components/ui/Tooltip'
import { eliminarCliente } from '../../services/clientsService'
import { crearPaymentDeCliente, actualizarPagado, eliminarPayment } from '../../services/paymentsService'
import { formatARS, formatFecha, diasHasta, HOY, TIPOS_PAGO, TIPO_LABEL, TIPO_SHORT, TIPO_BADGE, TIPO_DOT, SERVICIO_BADGE } from './constants'

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

    const { data, error: err } = await crearPaymentDeCliente({
      client_id:   cliente.id,
      tipo:        esSoporte ? 'soporte' : tipo,
      monto:       montoFinal,
      descripcion: descripcion || null,
      fecha_cobro: fecha,
      pagado,
      horas:       esSoporte ? Number(horas) : null,
    })

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
    const { error } = await actualizarPagado(pago.id, nuevo)
    if (error) setPagos((prev) => prev.map((p) => p.id === pago.id ? { ...p, pagado: pago.pagado } : p))
  }

  async function eliminarPago(id) {
    const { error } = await eliminarPayment(id)
    if (!error) setPagos((prev) => prev.filter((p) => p.id !== id))
  }

  function onPagoAgregado(pago) { setPagos((prev) => [pago, ...prev]) }

  async function handleEliminar() {
    setEliminando(true)
    const { error } = await eliminarCliente(cliente.id)
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
              onClick={() => onEditar(cliente)}
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

export default FilaCliente
