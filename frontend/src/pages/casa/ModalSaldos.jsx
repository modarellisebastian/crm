import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearSaldos, actualizarSaldos } from '../../services/casaService'
import { numInput } from './constants'

function ModalSaldos({ saldos, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    bbva:                saldos?.bbva                ?? '',
    mercadopago:         saldos?.mercadopago         ?? '',
    efectivo:            saldos?.efectivo            ?? '',
    cuenta_dni:          saldos?.cuenta_dni          ?? '',
    dolarapp_usd:        saldos?.dolarapp_usd        ?? '',
    bbva_usd:            saldos?.bbva_usd            ?? '',
    tipo_cambio:         saldos?.tipo_cambio         ?? '',
    tipo_cambio_oficial: saldos?.tipo_cambio_oficial ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    const payload = {
      fecha:               new Date().toISOString().split('T')[0],
      bbva:                Number(form.bbva)                || 0,
      mercadopago:         Number(form.mercadopago)         || 0,
      efectivo:            Number(form.efectivo)            || 0,
      cuenta_dni:          Number(form.cuenta_dni)          || 0,
      dolarapp_usd:        Number(form.dolarapp_usd)        || 0,
      bbva_usd:            Number(form.bbva_usd)            || 0,
      tipo_cambio:         Number(form.tipo_cambio)         || 1500,
      tipo_cambio_oficial: Number(form.tipo_cambio_oficial) || 0,
    }
    const result = saldos?.id
      ? await actualizarSaldos(saldos.id, payload)
      : await crearSaldos(payload)
    if (result.error) { setError(result.error.message); setGuardando(false); return }
    onGuardar(result.data)
  }

  const campos = [
    { key: 'bbva',                label: 'BBVA',               prefix: '$' },
    { key: 'mercadopago',         label: 'MercadoPago',        prefix: '$' },
    { key: 'efectivo',            label: 'Efectivo',           prefix: '$' },
    { key: 'cuenta_dni',          label: 'Cuenta DNI',         prefix: '$' },
    { key: 'dolarapp_usd',        label: 'DolarApp',           prefix: 'U$D' },
    { key: 'bbva_usd',            label: 'BBVA (USD oficial)', prefix: 'U$D' },
    { key: 'tipo_cambio',         label: 'TC DolarApp',        prefix: null },
    { key: 'tipo_cambio_oficial', label: 'TC Oficial',         prefix: null },
  ]

  return (
    <Modal title="Actualizar saldos" onClose={onCerrar}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="row g-3">
            {campos.map(({ key, label, prefix }) => (
              <div key={key} className="col-6">
                <label className="form-label small fw-medium mb-1">{label}</label>
                <div className="input-group input-group-sm">
                  {prefix && <span className="input-group-text">{prefix}</span>}
                  <input
                    type="number" min="0" step="any"
                    className="form-control"
                    value={form[key]}
                    onChange={numInput(form[key], (v) => set(key, v))}
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
        </div>
        <div className="modal-footer border-top">
          <button type="button" className="btn btn-light btn-sm" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalSaldos
