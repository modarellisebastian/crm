import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearIngreso, actualizarIngreso } from '../../services/casaService'
import { INGRESOS_DEFAULT } from './constants'

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
    const result = editando
      ? await actualizarIngreso(item.id, payload)
      : await crearIngreso(mes, payload)
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  return (
    <Modal title={editando ? 'Editar ingreso' : 'Nuevo ingreso'} onClose={onCerrar} maxWidth="max-w-sm">
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
    </Modal>
  )
}

export default ModalIngreso
