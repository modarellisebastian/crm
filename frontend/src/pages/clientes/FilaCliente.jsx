import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronRight, FiEdit3, FiTrash2, FiPlus, FiCheck, FiX, FiExternalLink } from 'react-icons/fi'
import { eliminarCliente } from '../../services/clientsService'
import { crearPaymentDeCliente, actualizarPagado, eliminarPayment } from '../../services/paymentsService'
import { formatARS, formatFecha, diasHasta, HOY, TIPOS_PAGO, TIPO_LABEL, TIPO_SHORT, SERVICIO_BADGE } from './constants'

// ─── VencimientoBadge ─────────────────────────────────────────────────────────

function VencimientoBadge({ fecha }) {
  if (!fecha) return <span className="text-muted small">—</span>
  const dias  = diasHasta(fecha)
  const label = formatFecha(fecha)
  if (dias < 0)   return <span className="badge bg-light-danger text-danger">{label} (vencido)</span>
  if (dias <= 30) return <span className="badge bg-light-warning text-warning">{label}</span>
  return <span className="text-muted small">{label}</span>
}

// ─── PendienteCell ────────────────────────────────────────────────────────────

function PendienteCell({ pagos }) {
  const pendientes = pagos.filter((p) => !p.pagado)
  const total      = pendientes.reduce((s, p) => s + (p.monto ?? 0), 0)

  if (total === 0) return (
    <span className="badge bg-light-success text-success d-inline-flex align-items-center gap-1">
      <FiCheck size={11} /> Al día
    </span>
  )

  const porTipo = {}
  pendientes.forEach((p) => { porTipo[p.tipo] = (porTipo[p.tipo] ?? 0) + (p.monto ?? 0) })

  return (
    <div>
      <p className="fw-semibold text-warning mb-1" style={{ fontSize: 13 }}>{formatARS(total)}</p>
      <div className="d-flex flex-wrap gap-1">
        {Object.entries(porTipo).map(([tipo, monto]) => (
          <span key={tipo} className="badge bg-light-secondary text-secondary" style={{ fontSize: 10 }}>
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
  return { tipo: svc.tipo === 'recurrente' ? 'mantenimiento' : 'proyecto', monto: svc.monto != null ? String(svc.monto) : '' }
}

function InlineFormPago({ cliente, onAgregar }) {
  const servicios    = (cliente.servicios ?? []).filter((s) => s.activo)
  const defaultSvcId = servicios[0] ? String(servicios[0].id) : '__manual'
  const defaultInfo  = infoDeSvc(servicios[0])

  const [svcId,       setSvcId]      = useState(defaultSvcId)
  const [tipo,        setTipo]       = useState(defaultInfo.tipo)
  const [monto,       setMonto]      = useState(defaultInfo.monto)
  const [descripcion, setDesc]       = useState('')
  const [fecha,       setFecha]      = useState(HOY)
  const [pagado,      setPagado]     = useState(false)
  const [esSoporte,   setEsSoporte]  = useState(false)
  const [horas,       setHoras]      = useState('')
  const [valorHora,   setValorHora]  = useState('')
  const [guardando,   setGuardando]  = useState(false)
  const [error,       setError]      = useState(null)

  const totalSoporte = esSoporte && horas && valorHora ? Number(horas) * Number(valorHora) : null

  function handleSvcChange(id) {
    setSvcId(id)
    if (id === '__manual') { setTipo('proyecto'); setMonto('') }
    else { const svc = servicios.find((s) => String(s.id) === id); const info = infoDeSvc(svc); setTipo(info.tipo); setMonto(info.monto) }
  }

  function handleTipoChange(t) { setTipo(t); setEsSoporte(t === 'soporte'); if (t === 'soporte') setMonto('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (esSoporte) { if (!horas || !valorHora) { setError('Ingresá horas y valor por hora.'); return } }
    else { if (!monto || Number(monto) <= 0) { setError('Ingresá el monto.'); return } }
    setGuardando(true)
    const montoFinal = esSoporte ? totalSoporte : Number(monto)
    const { data, error: err } = await crearPaymentDeCliente({ client_id: cliente.id, tipo: esSoporte ? 'soporte' : tipo, monto: montoFinal, descripcion: descripcion || null, fecha_cobro: fecha, pagado, horas: esSoporte ? Number(horas) : null })
    if (err) { setError(err.message); setGuardando(false); return }
    onAgregar(data)
    setDesc('')
    setHoras('')
    if (!esSoporte && svcId !== '__manual') { const svc = servicios.find((s) => String(s.id) === svcId); setMonto(infoDeSvc(svc).monto) }
    else if (!esSoporte) setMonto('')
    setGuardando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card border-primary mb-3">
      <div className="card-body p-3">
        <p className="fw-semibold text-primary mb-3" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          <FiPlus size={13} className="me-1" />Registrar cobro
        </p>
        <div className="d-flex flex-wrap gap-2 align-items-end">

          {servicios.length > 0 && (
            <div>
              <label className="form-label mb-1" style={{ fontSize: 11 }}>Servicio</label>
              <select className="form-select form-select-sm" value={svcId} onChange={e => handleSvcChange(e.target.value)} style={{ fontSize: 12 }}>
                {servicios.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}{s.monto != null ? ` · ${formatARS(s.monto)}` : ''}</option>)}
                <option value="__manual">Manual</option>
              </select>
            </div>
          )}

          <div style={{ flex: '1 1 180px' }}>
            <label className="form-label mb-1" style={{ fontSize: 11 }}>Descripción</label>
            <input type="text" className="form-control form-control-sm" value={descripcion} onChange={e => setDesc(e.target.value)} placeholder="Ej: Mantenimiento mayo 2025" style={{ fontSize: 12 }} />
          </div>

          {(svcId === '__manual' || servicios.length === 0) && (
            <div>
              <label className="form-label mb-1" style={{ fontSize: 11 }}>Tipo</label>
              <select className="form-select form-select-sm" value={tipo} onChange={e => handleTipoChange(e.target.value)} style={{ fontSize: 12 }}>
                {TIPOS_PAGO.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
          )}

          {esSoporte ? (
            <>
              <div style={{ width: 80 }}>
                <label className="form-label mb-1" style={{ fontSize: 11 }}>Horas</label>
                <input type="number" className="form-control form-control-sm" min="0" step="0.5" placeholder="0" value={horas} onChange={e => setHoras(e.target.value)} style={{ fontSize: 12 }} />
              </div>
              <div style={{ width: 100 }}>
                <label className="form-label mb-1" style={{ fontSize: 11 }}>Valor/hora</label>
                <input type="number" className="form-control form-control-sm" min="0" placeholder="0" value={valorHora} onChange={e => setValorHora(e.target.value)} style={{ fontSize: 12 }} />
              </div>
              {totalSoporte != null && (
                <div className="align-self-end pb-1">
                  <span className="fw-bold text-success" style={{ fontSize: 13 }}>= {formatARS(totalSoporte)}</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ width: 120 }}>
              <label className="form-label mb-1" style={{ fontSize: 11 }}>Monto</label>
              <input type="number" className="form-control form-control-sm" min="0" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} style={{ fontSize: 12 }} />
            </div>
          )}

          <div>
            <label className="form-label mb-1" style={{ fontSize: 11 }}>Fecha</label>
            <input type="date" className="form-control form-control-sm" value={fecha} onChange={e => setFecha(e.target.value)} style={{ fontSize: 12 }} />
          </div>

          <div className="d-flex align-items-center gap-3 align-self-end mb-1">
            <div className="form-check mb-0">
              <input className="form-check-input" type="checkbox" id={`pagado-${cliente.id}`} checked={pagado} onChange={e => setPagado(e.target.checked)} />
              <label className="form-check-label" htmlFor={`pagado-${cliente.id}`} style={{ fontSize: 12 }}>Ya cobrado</label>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando} style={{ fontSize: 12 }}>
              {guardando ? <span className="spinner-border spinner-border-sm" /> : 'Agregar cobro'}
            </button>
          </div>
        </div>
        {error && <p className="text-danger mb-0 mt-2" style={{ fontSize: 12 }}>{error}</p>}
      </div>
    </form>
  )
}

// ─── PagoItem ─────────────────────────────────────────────────────────────────

function PagoItem({ pago, onTogglePagado, onEliminar }) {
  const [toggling,   setToggling]   = useState(false)
  const [eliminando, setEliminando] = useState(false)

  async function handleToggle() { setToggling(true); await onTogglePagado(pago); setToggling(false) }
  async function handleEliminar() { setEliminando(true); await onEliminar(pago.id) }

  return (
    <div className={`d-flex align-items-center gap-3 rounded p-2 ${pago.pagado ? '' : 'border border-warning'}`}
      style={{ background: pago.pagado ? '#f5f5f5' : '#fffbf0' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: pago.pagado ? '#16a34a' : '#ca8a04', flexShrink: 0 }} />
      <div className="flex-grow-1 overflow-hidden">
        <p className={`mb-0 text-truncate ${pago.pagado ? 'text-muted' : 'fw-medium'}`} style={{ fontSize: 13 }}>
          {pago.descripcion ?? <span className="fst-italic text-muted">Sin descripción</span>}
        </p>
        <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
          <span className="badge bg-light-secondary text-secondary" style={{ fontSize: 10 }}>{TIPO_LABEL[pago.tipo] ?? pago.tipo}</span>
          <span className="text-muted" style={{ fontSize: 11 }}>{formatFecha(pago.fecha_cobro)}</span>
          {pago.horas != null && <span className="text-info" style={{ fontSize: 11 }}>{pago.horas}h</span>}
        </div>
      </div>
      <span className={`fw-semibold ${pago.pagado ? 'text-muted' : ''}`} style={{ fontSize: 13, flexShrink: 0 }}>{formatARS(pago.monto)}</span>
      <button onClick={handleToggle} disabled={toggling}
        className={`btn btn-sm ${pago.pagado ? 'btn-outline-success' : 'btn-warning'}`}
        style={{ fontSize: 11, padding: '2px 8px', flexShrink: 0 }}>
        {toggling ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
          : pago.pagado ? <><FiCheck size={11} /> Cobrado</> : 'Cobrar'}
      </button>
      <button onClick={handleEliminar} disabled={eliminando}
        style={{ border: 'none', background: 'none', color: '#dcdcdc', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        {eliminando ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} /> : <FiX size={14} />}
      </button>
    </div>
  )
}

// ─── FilaCliente ──────────────────────────────────────────────────────────────

function FilaCliente({ cliente, onEditar, onEliminar }) {
  const navigate = useNavigate()
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

  const ACTION_BTN = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: '50%',
    border: '1px solid #dcdee4', background: '#fff',
    cursor: 'pointer', flexShrink: 0,
  }

  return (
    <>
      <tr className={`single-item chat-single-item${expandido ? ' table-active' : ''}`}>

        {/* Expand + Nombre */}
        <td>
          <div className="d-flex align-items-start gap-2">
            <button
              onClick={() => setExpandido(!expandido)}
              style={{ ...ACTION_BTN, border: 'none', background: 'none', color: '#a3a3a3', transition: 'transform .15s', transform: expandido ? 'rotate(90deg)' : 'none' }}
            >
              <FiChevronRight size={16} />
            </button>
            <div className="overflow-hidden">
              <p className="fw-semibold mb-0" style={{ color: '#0a0a0a', fontSize: 14 }}>{cliente.nombre ?? '—'}</p>
              {(() => {
                const r = cliente.rubro ?? lead?.rubro
                const c = cliente.ciudad ?? lead?.ciudad
                return (r || c) ? <span className="text-muted text-truncate" style={{ fontSize: 12 }}>{[r, c].filter(Boolean).join(' · ')}</span> : null
              })()}
            </div>
          </div>
        </td>

        {/* Servicios activos */}
        <td>
          {svcActivos.length === 0 ? (
            <span className="text-muted fst-italic" style={{ fontSize: 12 }}>Sin servicios</span>
          ) : (
            <div className="d-flex flex-wrap gap-1">
              {svcActivos.slice(0, 3).map((s) => (
                <span key={s.id ?? s._id} className="badge bg-light-primary text-primary" style={{ fontSize: 11 }}>
                  {s.nombre}{s.monto != null && <span className="ms-1 opacity-75">{formatARS(s.monto)}</span>}
                </span>
              ))}
              {svcActivos.length > 3 && <span className="text-muted" style={{ fontSize: 11 }}>+{svcActivos.length - 3}</span>}
            </div>
          )}
        </td>

        {/* Hosting */}
        <td className="text-nowrap"><VencimientoBadge fecha={cliente.fecha_vencimiento_hosting} /></td>

        {/* Pendiente */}
        <td><PendienteCell pagos={pagos} /></td>

        {/* Acciones */}
        <td>
          <div className="hstack gap-1 justify-content-end">
            <button
              onClick={() => setExpandido(true)}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1"
              style={{ fontSize: 12 }}
            >
              <FiPlus size={12} /> Cobro
            </button>
            <button onClick={() => navigate(`/clientes/${cliente.id}`)} style={{ ...ACTION_BTN, color: '#0a0a0a', borderColor: '#ebebeb' }} title="Ver detalle">
              <FiExternalLink size={14} />
            </button>
            <button onClick={() => onEditar(cliente)} style={{ ...ACTION_BTN, color: '#737373' }} title="Editar">
              <FiEdit3 size={14} />
            </button>
            {confirmando ? (
              <div className="d-flex gap-1">
                <button onClick={handleEliminar} disabled={eliminando}
                  className="btn btn-danger btn-sm" style={{ fontSize: 11 }}>
                  {eliminando ? '…' : 'Eliminar'}
                </button>
                <button onClick={() => setConfirmando(false)}
                  className="btn btn-outline-secondary btn-sm" style={{ fontSize: 11 }}>
                  No
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmando(true)} style={{ ...ACTION_BTN, color: '#dc2626', borderColor: '#f9c8c8' }} title="Eliminar">
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Panel expandido */}
      {expandido && (
        <tr>
          <td colSpan={5} style={{ background: '#f5f5f5', padding: '20px 24px' }}>

            {/* Resumen financiero */}
            <div className="d-flex align-items-center gap-4 mb-4 flex-wrap">
              {[
                { label: 'Total facturado', value: pagado + pendiente, cls: 'text-dark' },
                { label: 'Cobrado',         value: pagado,             cls: 'text-success' },
                { label: 'Pendiente',       value: pendiente,          cls: pendiente > 0 ? 'text-warning' : 'text-muted' },
              ].map(({ label, value, cls }) => (
                <div key={label}>
                  <span className="text-muted d-block" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</span>
                  <span className={`fw-bold fs-5 ${cls}`}>{formatARS(value)}</span>
                </div>
              ))}
            </div>

            {/* Formulario */}
            <InlineFormPago cliente={{ ...cliente, servicios }} onAgregar={onPagoAgregado} />

            {/* Historial */}
            {pagosSorted.length > 0 ? (
              <div>
                <p className="text-muted mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Historial · {pagosSorted.length} cobro{pagosSorted.length !== 1 ? 's' : ''}
                </p>
                <div className="d-flex flex-column gap-2">
                  {pagosSorted.map((p) => (
                    <PagoItem key={p.id} pago={p} onTogglePagado={togglePagado} onEliminar={eliminarPago} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="alert alert-light border-dashed text-muted small d-flex align-items-center gap-2">
                Sin cobros registrados todavía. Usá el formulario de arriba para agregar el primero.
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default FilaCliente
