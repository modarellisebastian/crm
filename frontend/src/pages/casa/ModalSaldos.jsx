import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearSaldos, actualizarSaldos } from '../../services/casaService'
import { numInput } from './constants'

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
    const result = saldos?.id
      ? await actualizarSaldos(saldos.id, payload)
      : await crearSaldos(payload)
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
    <Modal title="Actualizar saldos" onClose={onCerrar} maxWidth="max-w-sm">
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
    </Modal>
  )
}

export default ModalSaldos
