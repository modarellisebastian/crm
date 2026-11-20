import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../context/ToastProvider'
import {
  fetchUltimosSaldos,
  fetchMovimientosDelMes,
  actualizarResueltoMovimiento,
  eliminarMovimiento,
  copiarMovimientosDeMes,
  copiarMovimientosPorTipo,
} from '../../services/casaService'
import { mesKey, mesLabel, prevMes, nextMes, formatARS, formatUSD } from './constants'
import ModalSaldos from './ModalSaldos'
import ModalMovimiento from './ModalMovimiento'
import { FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2, FiPlus, FiDollarSign, FiTrendingDown, FiBarChart2, FiCreditCard, FiSmartphone, FiTrendingUp, FiGlobe, FiBriefcase } from 'react-icons/fi'

export default function FinanzasCasa() {
  const toast = useToast()
  const [mes, setMes] = useState(mesKey())
  const [saldos, setSaldos] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalSaldos, setModalSaldos] = useState(false)
  const [modalNuevo,  setModalNuevo]  = useState(null)
  const [editando,    setEditando]    = useState(null)
  const [eliminando,  setEliminando]  = useState(null)
  const [copiando,    setCopiando]    = useState(false)
  const [errorCopia,  setErrorCopia]  = useState(null)
  const [copiandoG,   setCopiandoG]   = useState(false)
  const [copiandoI,   setCopiandoI]   = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [{ data: s, error: e1 }, { data: m, error: e2 }] = await Promise.all([
        fetchUltimosSaldos(),
        fetchMovimientosDelMes(mes),
      ])
      if (e1 || e2) setError((e1 || e2).message)
      else { setSaldos(s); setMovimientos(m) }
      setLoading(false)
    }
    fetchData()
  }, [mes])

  const gastos   = movimientos.filter((m) => m.tipo_movimiento === 'egreso')
  const ingresos = movimientos.filter((m) => m.tipo_movimiento === 'ingreso')

  const tc         = saldos?.tipo_cambio ?? 1500
  const usdActual  = (saldos?.dolarapp_usd ?? 0) + (saldos?.bbva_usd ?? 0)
  const totalPesos = (saldos?.bbva ?? 0) + (saldos?.mercadopago ?? 0) + (saldos?.efectivo ?? 0) + (saldos?.cuenta_dni ?? 0)

  const ingresosPendientesARS = ingresos.filter(i => !i.resuelto && i.moneda === 'ars').reduce((s, i) => s + i.monto, 0)
  const ingresosPendientesUSD = ingresos.filter(i => !i.resuelto && i.moneda === 'usd').reduce((s, i) => s + i.monto, 0)
  const gastosPendientesARS   = gastos.filter(g => !g.resuelto).reduce((s, g) => s + g.monto, 0)
  const totalIngresosARS      = ingresos.filter(i => i.moneda === 'ars').reduce((s, i) => s + i.monto, 0)
  const totalIngresosUSD      = ingresos.filter(i => i.moneda === 'usd').reduce((s, i) => s + i.monto, 0)
  const totalGastosARS        = gastos.reduce((s, g) => s + g.monto, 0)

  const netPesos    = totalPesos + ingresosPendientesARS - gastosPendientesARS
  const usdVender   = netPesos < 0 ? Math.abs(netPesos) / tc : 0
  const usdProyectado = usdActual + ingresosPendientesUSD - usdVender

  // Gasto diario disponible
  const hoy = new Date()
  const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasRestantes = diasEnMes - hoy.getDate() + 1 // incluye hoy
  const disponibleARS = Math.max(0, netPesos)
  const gastoDiario = diasRestantes > 0 ? disponibleARS / diasRestantes : 0

  async function toggleResuelto(m) {
    const nuevo = !m.resuelto
    setMovimientos(prev => prev.map(x => x.id === m.id ? { ...x, resuelto: nuevo } : x))
    const { error: err } = await actualizarResueltoMovimiento(m.id, nuevo)
    if (err) setMovimientos(prev => prev.map(x => x.id === m.id ? { ...x, resuelto: m.resuelto } : x))
  }

  async function eliminar(id) {
    setEliminando(id)
    const { error: err } = await eliminarMovimiento(id)
    if (!err) { setMovimientos(prev => prev.filter(x => x.id !== id)); toast('Movimiento eliminado', 'error') }
    else toast('Error al eliminar', 'error')
    setEliminando(null)
  }

  function onGuardarMovimiento(m) {
    setMovimientos(prev => {
      const existe = prev.find(x => x.id === m.id)
      toast(existe ? 'Movimiento actualizado' : 'Movimiento guardado', 'success')
      return existe ? prev.map(x => x.id === m.id ? m : x) : [...prev, m]
    })
    setModalNuevo(null)
    setEditando(null)
  }

  async function copiarGastosAnteriores() {
    setCopiandoG(true)
    const { data, error: err } = await copiarMovimientosPorTipo(prevMes(mes), mes, 'egreso')
    if (!err && data) setMovimientos(prev => [...prev, ...data])
    setCopiandoG(false)
  }

  async function copiarIngresosAnteriores() {
    setCopiandoI(true)
    const { data, error: err } = await copiarMovimientosPorTipo(prevMes(mes), mes, 'ingreso')
    if (!err && data) setMovimientos(prev => [...prev, ...data])
    setCopiandoI(false)
  }

  if (loading) return <div className="d-flex align-items-center gap-2 text-muted p-4"><div className="spinner-border spinner-border-sm" /><span>Cargando…</span></div>
  if (error)   return <p className="text-danger p-4">Error: {error}</p>

  const saldosCards = saldos ? [
    { label: 'BBVA',        valor: saldos.bbva,                moneda: 'ars', icon: <FiCreditCard size={16} />,  progressN: 1 },
    { label: 'MercadoPago', valor: saldos.mercadopago,         moneda: 'ars', icon: <FiSmartphone size={16} />,  progressN: 1 },
    { label: 'Efectivo',    valor: saldos.efectivo,            moneda: 'ars', icon: <FiBriefcase size={16} />,   progressN: 1 },
    { label: 'Cuenta DNI',  valor: saldos.cuenta_dni,          moneda: 'ars', icon: <FiCreditCard size={16} />,  progressN: 1 },
    { label: 'DolarApp',    valor: saldos.dolarapp_usd,        moneda: 'usd', icon: <FiDollarSign size={16} />,  progressN: 3 },
    { label: 'BBVA USD',    valor: saldos.bbva_usd,            moneda: 'usd', icon: <FiGlobe size={16} />,       progressN: 3 },
    { label: 'TC DolarApp', valor: saldos.tipo_cambio,         moneda: 'tc',  icon: <FiTrendingUp size={16} />,  progressN: 2 },
    { label: 'TC Oficial',  valor: saldos.tipo_cambio_oficial,  moneda: 'tc',  icon: <FiBarChart2 size={16} />,   progressN: 2 },
  ] : []

  return (
    <>
      <div className="d-flex flex-column gap-4">

        {/* Encabezado */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h4 className="fw-semibold mb-0">Finanzas Casa</h4>
            <p className="text-muted small mb-0">Gestión mensual del hogar</p>
          </div>
          <div className="d-flex align-items-center gap-1 bg-light rounded px-2 py-1">
            <button className="btn btn-sm btn-link p-1" onClick={() => setMes(prevMes(mes))}>
              <FiChevronLeft size={16} />
            </button>
            <span className="small fw-medium px-2" style={{ minWidth: 130, textAlign: 'center' }}>
              {mesLabel(mes)}
            </span>
            <button className="btn btn-sm btn-link p-1" onClick={() => setMes(nextMes(mes))}>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Saldos */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted text-uppercase small fw-semibold" style={{ letterSpacing: '.05em' }}>Saldos actuales</span>
            <button className="btn btn-link btn-sm p-0 text-primary" onClick={() => setModalSaldos(true)}>
              {saldos ? 'Actualizar' : 'Cargar saldos'}
            </button>
          </div>
          {saldos ? (
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-8 g-2">
              {saldosCards.map(({ label, valor, moneda, icon, progressN }) => (
                <div key={label} className="col">
                  <div className="card short-info-card h-100">
                    <div className="card-body p-3">
                      <div className="avatar-text avatar-md bg-gray-200 icon mb-3">
                        {icon}
                      </div>
                      <p className="fs-6 fw-bold text-dark mb-0">
                        {moneda === 'usd' ? formatUSD(valor)
                          : moneda === 'tc' ? `$${Number(valor ?? 0).toLocaleString('es-AR')}`
                          : formatARS(valor)}
                      </p>
                      <p className="fs-13 fw-semibold text-muted mb-0">{label}</p>
                      <div className="progress mt-2 ht-3">
                        <div className={`progress-bar progress-${progressN}`} role="progressbar" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed rounded p-4 text-center text-muted">
              <p className="mb-1 small">No hay saldos cargados.</p>
              <button className="btn btn-link btn-sm p-0" onClick={() => setModalSaldos(true)}>Cargar saldos →</button>
            </div>
          )}
        </div>

        {/* Proyección */}
        {saldos && (
          <div className="row g-3">
            {[
              {
                icon: <FiDollarSign size={20} />,
                label: 'Total en pesos',
                value: formatARS(totalPesos),
                sub: `${ingresos.filter(i => !i.resuelto && i.moneda === 'ars').length} freelance pendientes`,
                progressN: 1,
              },
              {
                icon: <FiTrendingDown size={20} />,
                label: 'Gastos fijos del mes',
                value: formatARS(totalGastosARS),
                sub: `${gastos.filter(g => !g.resuelto).length} pendientes`,
                progressN: gastos.filter(g => !g.resuelto).length > 0 ? 2 : 3,
              },
              {
                icon: <FiBarChart2 size={20} />,
                label: 'USD proyectado fin de mes',
                value: formatUSD(usdProyectado),
                sub: usdVender > 0 ? `Necesitas vender ~${formatUSD(usdVender)}` : 'No necesitas vender USD',
                progressN: usdProyectado >= 1000 ? 3 : 4,
              },
              {
                icon: <FiTrendingUp size={20} />,
                label: 'Podés gastar por día',
                value: formatARS(gastoDiario),
                sub: `Quedan ${diasRestantes} días en el mes`,
                progressN: gastoDiario > 5000 ? 3 : gastoDiario > 0 ? 2 : 4,
              },
            ].map(({ icon, label, value, sub, progressN }) => (
              <div key={label} className="col-12 col-md-3">
                <div className="card stretch stretch-full short-info-card">
                  <div className="card-body">
                    <div className="d-flex align-items-start justify-content-between mb-4">
                      <div className="d-flex gap-4 align-items-center">
                        <div className="avatar-text avatar-lg bg-gray-200 icon">{icon}</div>
                        <div>
                          <div className="fs-4 fw-bold text-dark">{value}</div>
                          <h3 className="fs-13 fw-semibold text-truncate-1-line text-muted mb-0">{label}</h3>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small mb-1">{sub}</p>
                    <div className="progress mt-2 ht-3">
                      <div className={`progress-bar progress-${progressN}`} role="progressbar" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Copiar mes anterior (cuando no hay nada) */}
        {movimientos.length === 0 && (
          <div className="alert alert-primary d-flex align-items-center justify-content-between gap-3">
            <span className="small">
              Todavía no cargaste nada este mes. Podés copiar los datos de {mesLabel(prevMes(mes))}.
            </span>
            <button className="btn btn-primary btn-sm flex-shrink-0" disabled={copiando}
              onClick={async () => {
                setCopiando(true); setErrorCopia(null)
                const { data, error: err } = await copiarMovimientosDeMes(prevMes(mes), mes)
                if (err) setErrorCopia(err.message)
                else setMovimientos(prev => [...prev, ...data])
                setCopiando(false)
              }}>
              {copiando ? 'Copiando…' : `Copiar ${mesLabel(prevMes(mes))}`}
            </button>
          </div>
        )}
        {errorCopia && <p className="text-danger small">{errorCopia}</p>}

        {/* Tablas */}
        <div className="row g-4">

          {/* Gastos fijos */}
          <div className="col-12 col-lg-6">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted text-uppercase small fw-semibold" style={{ letterSpacing: '.05em' }}>Gastos fijos</span>
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-link btn-sm p-0 text-muted" disabled={copiandoG} onClick={copiarGastosAnteriores}>
                  {copiandoG ? 'Copiando…' : `Copiar ${mesLabel(prevMes(mes))}`}
                </button>
                <button className="btn btn-link btn-sm p-0 text-primary d-flex align-items-center gap-1" onClick={() => setModalNuevo('egreso')}>
                  <FiPlus size={13} /> Agregar
                </button>
              </div>
            </div>

            <div className="card function-table">
              {gastos.length === 0 ? (
                <EmptyState icon="money" title="Sin gastos este mes" description="Agrega un gasto fijo para verlo aqui." />
              ) : (
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover dataTable mb-0">
                      <thead>
                        <tr>
                          <th>Concepto</th>
                          <th className="text-end">Monto</th>
                          <th className="text-center">Dia</th>
                          <th className="text-center">Estado</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gastos.map((g) => (
                          <tr key={g.id} className="single-item">
                            <td>
                              <span className="fw-medium" style={{ color: '#0a0a0a' }}>{g.nombre}</span>
                              {g.notas && <div className="text-muted" style={{ fontSize: '0.7rem' }}>{g.notas}</div>}
                            </td>
                            <td className="text-end fw-semibold">{formatARS(g.monto)}</td>
                            <td className="text-center text-muted">{g.vencimiento_dia ? `dia ${g.vencimiento_dia}` : '—'}</td>
                            <td className="text-center">
                              <button onClick={() => toggleResuelto(g)}
                                className={`badge border-0 ${g.resuelto ? 'bg-light-success' : 'bg-light-warning'}`}
                                style={{ cursor: 'pointer' }}>
                                {g.resuelto ? '✓ Pagado' : 'Pendiente'}
                              </button>
                            </td>
                            <td>
                              <div className="hstack gap-1 justify-content-end">
                                <button className="avatar-text avatar-md text-muted" style={{ border: 'none', background: 'transparent' }} onClick={() => setEditando(g)}><FiEdit2 size={13} /></button>
                                <button className="avatar-text avatar-md text-muted" style={{ border: 'none', background: 'transparent' }} disabled={eliminando === g.id} onClick={() => eliminar(g.id)}><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #eaebef' }}>
                          <td className="text-muted fw-semibold text-uppercase" style={{ fontSize: 10 }}>Total</td>
                          <td className="text-end fw-bold">{formatARS(totalGastosARS)}</td>
                          <td colSpan={3} className="text-center text-muted" style={{ fontSize: 11 }}>
                            {gastos.filter(g => g.resuelto).length}/{gastos.length} pagados
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ingresos */}
          <div className="col-12 col-lg-6">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted text-uppercase small fw-semibold" style={{ letterSpacing: '.05em' }}>Ingresos</span>
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-link btn-sm p-0 text-muted" disabled={copiandoI} onClick={copiarIngresosAnteriores}>
                  {copiandoI ? 'Copiando…' : `Copiar ${mesLabel(prevMes(mes))}`}
                </button>
                <button className="btn btn-link btn-sm p-0 text-primary d-flex align-items-center gap-1" onClick={() => setModalNuevo('ingreso')}>
                  <FiPlus size={13} /> Agregar
                </button>
              </div>
            </div>

            <div className="card function-table">
              {ingresos.length === 0 ? (
                <EmptyState icon="money" title="Sin ingresos este mes" description="Agrega un ingreso para verlo aqui." />
              ) : (
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover dataTable mb-0">
                      <thead>
                        <tr>
                          <th>Cliente / Fuente</th>
                          <th className="text-end">Monto</th>
                          <th className="text-center">Estado</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ingresos.map((ing) => (
                          <tr key={ing.id} className="single-item">
                            <td>
                              <span className="fw-medium d-block" style={{ color: '#0a0a0a' }}>{ing.nombre}</span>
                              <small className="text-muted">
                                {ing.categoria === 'sueldo_usd' ? 'Sueldo USD' : 'Freelance'}
                              </small>
                              {ing.notas && <small className="text-muted fst-italic d-block">{ing.notas}</small>}
                            </td>
                            <td className="text-end fw-semibold">
                              <span className={ing.moneda === 'usd' ? 'text-success' : ''}>
                                {ing.moneda === 'usd' ? formatUSD(ing.monto) : formatARS(ing.monto)}
                              </span>
                              {ing.moneda === 'usd' && saldos && (
                                <div className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>≈ {formatARS(ing.monto * tc)}</div>
                              )}
                            </td>
                            <td className="text-center">
                              <button onClick={() => toggleResuelto(ing)}
                                className={`badge border-0 ${ing.resuelto ? 'bg-light-success' : 'bg-light-primary'}`}
                                style={{ cursor: 'pointer' }}>
                                {ing.resuelto ? '✓ Cobrado' : 'Pendiente'}
                              </button>
                            </td>
                            <td>
                              <div className="hstack gap-1 justify-content-end">
                                <button className="avatar-text avatar-md text-muted" style={{ border: 'none', background: 'transparent' }} onClick={() => setEditando(ing)}><FiEdit2 size={13} /></button>
                                <button className="avatar-text avatar-md text-muted" style={{ border: 'none', background: 'transparent' }} disabled={eliminando === ing.id} onClick={() => eliminar(ing.id)}><FiTrash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #eaebef' }}>
                          <td className="text-muted fw-semibold text-uppercase" style={{ fontSize: 10 }}>Total</td>
                          <td className="text-end fw-bold">
                            <div>{formatARS(totalIngresosARS)}</div>
                            {totalIngresosUSD > 0 && <div className="text-success">+ {formatUSD(totalIngresosUSD)}</div>}
                          </td>
                          <td colSpan={2} className="text-center text-muted" style={{ fontSize: 11 }}>
                            {ingresos.filter(i => i.resuelto).length}/{ingresos.length} cobrados
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modales */}
      {modalSaldos && (
        <ModalSaldos saldos={saldos} onGuardar={(d) => { setSaldos(d); setModalSaldos(false) }} onCerrar={() => setModalSaldos(false)} />
      )}
      {(modalNuevo || editando) && (
        <ModalMovimiento
          mes={mes}
          item={editando}
          tipoInicial={modalNuevo}
          onGuardar={onGuardarMovimiento}
          onCerrar={() => { setModalNuevo(null); setEditando(null) }}
        />
      )}
    </>
  )
}
