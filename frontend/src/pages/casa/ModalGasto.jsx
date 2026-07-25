import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearGasto, actualizarGasto } from '../../services/casaService'
import { GASTOS_FIJOS_DEFAULT } from './constants'

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
    const result = editando
      ? await actualizarGasto(item.id, payload)
      : await crearGasto(mes, payload)
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  return (
    <Modal title={editando ? 'Editar gasto fijo' : 'Nuevo gasto fijo'} onClose={onCerrar} maxWidth="max-w-sm">
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
    </Modal>
  )
}

export default ModalGasto
