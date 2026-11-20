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
    notas:           item?.notas           ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); setError(null) }

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
          notas:           form.notas || null,
        }
      : {
          tipo_movimiento: 'egreso',
          nombre:          form.nombre,
          categoria:       null,
          moneda:          'ars',
          monto:           Number(form.monto),
          vencimiento_dia: form.vencimiento_dia ? Number(form.vencimiento_dia) : null,
          resuelto:        form.resuelto,
          notas:           form.notas || null,
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
    <Modal title={titulo} onClose={onCerrar}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body d-flex flex-column gap-3">

          {/* Tipo */}
          <div className="btn-group w-100">
            {[{ val: 'egreso', label: 'Gasto fijo' }, { val: 'ingreso', label: 'Ingreso' }].map(({ val, label }) => (
              <button key={val} type="button"
                className={`btn btn-sm ${form.tipo_movimiento === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => set('tipo_movimiento', val)}>
                {label}
              </button>
            ))}
          </div>

          {/* Categoría (solo ingreso) */}
          {esIngreso && (
            <div className="btn-group w-100">
              {[{ val: 'freelance', label: 'Freelance (ARS)' }, { val: 'sueldo_usd', label: 'Sueldo (USD)' }].map(({ val, label }) => (
                <button key={val} type="button"
                  className={`btn btn-sm ${form.categoria === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      categoria: val,
                      moneda: val === 'sueldo_usd' ? 'usd' : 'ars',
                      nombre: val === 'sueldo_usd' ? 'Sueldo DolarApp' : f.nombre,
                    }))
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="form-label small fw-medium mb-1">
              {esIngreso ? 'Nombre / Cliente' : 'Nombre'}
            </label>
            <input list="movimiento-nombres" className="form-control form-control-sm"
              value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
              placeholder={esIngreso ? 'Ej: HOLAHELLO' : 'Ej: Inmobiliaria'} />
            <datalist id="movimiento-nombres">
              {(esIngreso ? INGRESOS_DEFAULT : GASTOS_FIJOS_DEFAULT).map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          {/* Monto + vencimiento */}
          <div className={`row g-2`}>
            <div className={esIngreso ? 'col-12' : 'col-7'}>
              <label className="form-label small fw-medium mb-1">
                Monto {esIngreso ? (form.moneda === 'usd' ? '(USD)' : '(ARS)') : ''}
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text">{esIngreso && form.moneda === 'usd' ? 'U$D' : '$'}</span>
                <input type="number" min="0" step="any" className="form-control"
                  value={form.monto} onChange={(e) => set('monto', e.target.value)} placeholder="0" />
              </div>
            </div>
            {!esIngreso && (
              <div className="col-5">
                <label className="form-label small fw-medium mb-1">Vence día</label>
                <input type="number" min="1" max="31" className="form-control form-control-sm"
                  value={form.vencimiento_dia} onChange={(e) => set('vencimiento_dia', e.target.value)} placeholder="—" />
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="form-label small fw-medium mb-1">
              Notas <span className="text-muted fw-normal">(opcional)</span>
            </label>
            <textarea className="form-control form-control-sm" rows={2}
              value={form.notas} onChange={(e) => set('notas', e.target.value)}
              placeholder="Ej: 2 cuotas atrasadas + corriente" />
          </div>

          {/* Resuelto */}
          <div className="form-check">
            <input type="checkbox" className="form-check-input" id="resuelto"
              checked={form.resuelto} onChange={(e) => set('resuelto', e.target.checked)} />
            <label className="form-check-label small" htmlFor="resuelto">
              {esIngreso ? 'Ya cobrado' : 'Ya pagado'}
            </label>
          </div>

          {error && <p className="text-danger small mb-0">{error}</p>}
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

export default ModalMovimiento
