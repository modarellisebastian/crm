import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearMovimiento, actualizarMovimiento } from '../../services/casaService'
import { GASTOS_FIJOS_DEFAULT, INGRESOS_DEFAULT } from './constants'

function ModalMovimiento({ mes, item, tipoInicial, onGuardar, onCerrar }) {
  const editando = Boolean(item)
  const [form, setForm] = useState({
    tipo_movimiento: item?.tipo_movimiento ?? tipoInicial ?? 'egreso',
    nombre:          item?.nombre          ?? '',
    categoria:       item?.categoria       ?? 'freelance',
    moneda:          item?.moneda          ?? 'ars',
    monto:           item?.monto           ?? '',
    vencimiento_dia: item?.vencimiento_dia ?? '',
    resuelto:        item?.resuelto        ?? false,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); setError(null) }

  function handleTipoMovimiento(tipo_movimiento) {
    setForm((f) => ({ ...f, tipo_movimiento }))
  }

  function handleCategoria(categoria) {
    setForm((f) => ({
      ...f, categoria,
      moneda: categoria === 'sueldo_usd' ? 'usd' : 'ars',
      nombre: categoria === 'sueldo_usd' ? 'Sueldo DolarApp' : f.nombre,
    }))
  }

  const esIngreso = form.tipo_movimiento === 'ingreso'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre) { setError('Ingresá el nombre.'); return }
    if (!form.monto)  { setError('Ingresá el monto.');  return }
    setGuardando(true)

    const payload = esIngreso
      ? {
          tipo_movimiento: 'ingreso',
          nombre:          form.nombre,
          categoria:       form.categoria,
          moneda:          form.moneda,
          monto:           Number(form.monto),
          vencimiento_dia: null,
          resuelto:        form.resuelto,
        }
      : {
          tipo_movimiento: 'egreso',
          nombre:          form.nombre,
          categoria:       null,
          moneda:          'ars',
          monto:           Number(form.monto),
          vencimiento_dia: form.vencimiento_dia ? Number(form.vencimiento_dia) : null,
          resuelto:        form.resuelto,
        }

    const result = editando
      ? await actualizarMovimiento(item.id, payload)
      : await crearMovimiento(mes, payload)

    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  const titulo = editando
    ? (esIngreso ? 'Editar ingreso' : 'Editar gasto fijo')
    : (esIngreso ? 'Nuevo ingreso' : 'Nuevo gasto fijo')

  return (
    <Modal title={titulo} onClose={onCerrar} maxWidth="max-w-sm">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo de movimiento */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 'egreso',  label: 'Gasto fijo' },
              { val: 'ingreso', label: 'Ingreso' },
            ].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => handleTipoMovimiento(val)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  form.tipo_movimiento === val
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Categoría de ingreso (solo si es ingreso) */}
          {esIngreso && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'freelance',  label: 'Freelance (ARS)' },
                { val: 'sueldo_usd', label: 'Sueldo (USD)' },
              ].map(({ val, label }) => (
                <button key={val} type="button" onClick={() => handleCategoria(val)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    form.categoria === val
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {esIngreso ? 'Nombre / Cliente' : 'Nombre'}
            </label>
            <input list="movimiento-nombres" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder={esIngreso ? 'Ej: HOLAHELLO' : 'Ej: Inmobiliaria'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <datalist id="movimiento-nombres">
              {(esIngreso ? INGRESOS_DEFAULT : GASTOS_FIJOS_DEFAULT).map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          {/* Monto (+ vencimiento si es egreso) */}
          <div className={esIngreso ? '' : 'grid grid-cols-2 gap-3'}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Monto {esIngreso ? (form.moneda === 'usd' ? '(USD)' : '(ARS)') : ''}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {esIngreso && form.moneda === 'usd' ? 'U$D' : '$'}
                </span>
                <input type="number" min="0" step="any" value={form.monto}
                  onChange={(e) => set('monto', e.target.value)} placeholder="0"
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            {!esIngreso && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Vence día</label>
                <input type="number" min="1" max="31" value={form.vencimiento_dia}
                  onChange={(e) => set('vencimiento_dia', e.target.value)} placeholder="—"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          {/* Resuelto */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.resuelto} onChange={(e) => set('resuelto', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <span className="text-sm text-gray-700">{esIngreso ? 'Ya cobrado' : 'Ya pagado'}</span>
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
    </Modal>
  )
}

export default ModalMovimiento
