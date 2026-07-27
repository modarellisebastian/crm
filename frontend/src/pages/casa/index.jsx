import { useEffect, useState } from 'react'
import {
  fetchUltimosSaldos,
  fetchMovimientosDelMes,
  actualizarResueltoMovimiento,
  eliminarMovimiento,
  copiarMovimientosDeMes,
} from '../../services/casaService'
import { mesKey, mesLabel, prevMes, nextMes, formatARS, formatUSD } from './constants'
import ModalSaldos from './ModalSaldos'
import ModalMovimiento from './ModalMovimiento'

export default function FinanzasCasa() {
  const [mes, setMes] = useState(mesKey())
  const [saldos, setSaldos] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalSaldos, setModalSaldos] = useState(false)
  const [modalNuevo,  setModalNuevo]  = useState(null) // null | 'egreso' | 'ingreso'
  const [editando,    setEditando]    = useState(null) // movimiento en edición
  const [eliminando,  setEliminando]  = useState(null)
  const [copiando,    setCopiando]    = useState(false)
  const [errorCopia,  setErrorCopia]  = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [
        { data: s, error: e1 },
        { data: m, error: e2 },
      ] = await Promise.all([
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

  // ── cálculos ─────────────────────────────────────────────────────────────────

  const tc = saldos?.tipo_cambio ?? 1500
  const usdActual = saldos?.dolarapp_usd ?? 0

  const totalPesos = (saldos?.bbva ?? 0) + (saldos?.mercadopago ?? 0)
    + (saldos?.efectivo ?? 0) + (saldos?.cuenta_dni ?? 0)

  const ingresosPendientesARS = ingresos
    .filter((i) => !i.resuelto && i.moneda === 'ars')
    .reduce((s, i) => s + i.monto, 0)

  const ingresosPendientesUSD = ingresos
    .filter((i) => !i.resuelto && i.moneda === 'usd')
    .reduce((s, i) => s + i.monto, 0)

  const gastosPendientesARS = gastos
    .filter((g) => !g.resuelto)
    .reduce((s, g) => s + g.monto, 0)

  const totalIngresosARS   = ingresos.filter((i) => i.moneda === 'ars').reduce((s, i) => s + i.monto, 0)
  const totalIngresosUSD   = ingresos.filter((i) => i.moneda === 'usd').reduce((s, i) => s + i.monto, 0)
  const totalGastosARS     = gastos.reduce((s, g) => s + g.monto, 0)

  // Proyección: pesos disponibles = en cuenta + freelance pendiente - gastos fijos pendientes
  const netPesos = totalPesos + ingresosPendientesARS - gastosPendientesARS
  const usdVender = netPesos < 0 ? Math.abs(netPesos) / tc : 0
  const usdProyectado = usdActual + ingresosPendientesUSD - usdVender

  // ── acciones ─────────────────────────────────────────────────────────────────

  async function toggleResuelto(m) {
    const nuevo = !m.resuelto
    setMovimientos((prev) => prev.map((x) => x.id === m.id ? { ...x, resuelto: nuevo } : x))
    const { error: err } = await actualizarResueltoMovimiento(m.id, nuevo)
    if (err) setMovimientos((prev) => prev.map((x) => x.id === m.id ? { ...x, resuelto: m.resuelto } : x))
  }

  async function eliminar(id) {
    setEliminando(id)
    const { error: err } = await eliminarMovimiento(id)
    if (!err) setMovimientos((prev) => prev.filter((x) => x.id !== id))
    setEliminando(null)
  }

  function onGuardarMovimiento(m) {
    setMovimientos((prev) => {
      const existe = prev.find((x) => x.id === m.id)
      return existe ? prev.map((x) => x.id === m.id ? m : x) : [...prev, m]
    })
    setModalNuevo(null)
    setEditando(null)
  }

  async function copiarMesAnterior() {
    setCopiando(true)
    setErrorCopia(null)
    const { data, error: err } = await copiarMovimientosDeMes(prevMes(mes), mes)
    if (err) setErrorCopia(err.message)
    else setMovimientos((prev) => [...prev, ...data])
    setCopiando(false)
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
                sub:     `${ingresos.filter(i => !i.resuelto && i.moneda==='ars').length} freelance pendiente${ingresos.filter(i=>!i.resuelto&&i.moneda==='ars').length!==1?'s':''}`,
                accent:  'border-blue-100',
              },
              {
                label:   'Gastos fijos del mes',
                value:   formatARS(totalGastosARS),
                sub:     `${gastos.filter(g=>!g.resuelto).length} pendiente${gastos.filter(g=>!g.resuelto).length!==1?'s':''}`,
                accent:  gastos.filter(g=>!g.resuelto).length > 0 ? 'border-amber-200' : 'border-green-100',
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

        {/* ── Copiar mes anterior ── */}
        {movimientos.length === 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-sm text-blue-700">
              Todavía no cargaste nada este mes. Si los gastos e ingresos son parecidos a {mesLabel(prevMes(mes))}, copialos y solo ajustá lo que cambió.
            </p>
            <button onClick={copiarMesAnterior} disabled={copiando}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              {copiando ? 'Copiando…' : `Copiar ${mesLabel(prevMes(mes))}`}
            </button>
          </div>
        )}
        {errorCopia && <p className="text-sm text-red-600">{errorCopia}</p>}

        {/* ── Gastos e Ingresos ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gastos fijos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Gastos fijos</h2>
              <button onClick={() => setModalNuevo('egreso')}
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
                      <tr key={g.id} className={g.resuelto ? 'hover:bg-gray-50' : 'bg-amber-50/30 hover:bg-amber-50/50'}>
                        <td className="px-4 py-2.5 text-sm text-gray-800">{g.nombre}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold tabular-nums text-gray-800 text-right">
                          {formatARS(g.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-400 text-center">
                          {g.vencimiento_dia ? `día ${g.vencimiento_dia}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleResuelto(g)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              g.resuelto
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}>
                            {g.resuelto ? '✓ Pagado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditando(g)} title="Editar"
                              className="text-gray-300 hover:text-blue-400 transition-colors">
                              {iconEdit}
                            </button>
                            <button onClick={() => eliminar(g.id)} disabled={eliminando === g.id}
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
                        {gastos.filter(g=>g.resuelto).length}/{gastos.length} pagados
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
              <button onClick={() => setModalNuevo('ingreso')}
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
                      <tr key={i.id} className={i.resuelto ? 'hover:bg-gray-50' : 'bg-blue-50/20 hover:bg-blue-50/40'}>
                        <td className="px-4 py-2.5">
                          <div className="text-sm text-gray-800">{i.nombre}</div>
                          <div className="text-xs text-gray-400">
                            {i.categoria === 'sueldo_usd' ? 'Sueldo USD' : 'Freelance'}
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
                          <button onClick={() => toggleResuelto(i)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                              i.resuelto
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                            {i.resuelto ? '✓ Cobrado' : 'Pendiente'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditando(i)} title="Editar"
                              className="text-gray-300 hover:text-blue-400 transition-colors">
                              {iconEdit}
                            </button>
                            <button onClick={() => eliminar(i.id)} disabled={eliminando === i.id}
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
                        {ingresos.filter(i=>i.resuelto).length}/{ingresos.length} cobrados
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
