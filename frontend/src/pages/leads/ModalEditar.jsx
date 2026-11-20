import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { actualizarLead } from '../../services/leadsService'
import { CAMPOS_TEXTO, ESTADOS, ESTADO_LABELS } from './constants'

function ModalEditar({ lead, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    nombre:    lead.nombre    ?? '',
    rubro:     lead.rubro     ?? '',
    ciudad:    lead.ciudad    ?? '',
    url_web:   lead.url_web   ?? '',
    telefono:  lead.telefono  ?? '',
    whatsapp:  lead.whatsapp  ?? '',
    email:     lead.email     ?? '',
    instagram: lead.instagram ?? '',
    facebook:  lead.facebook  ?? '',
    tiene_web: lead.tiene_web ?? false,
    estado:    lead.estado    ?? 'nuevo',
    notas:     lead.notas     ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState(null)

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const payload = {
      ...form,
      url_web:   form.url_web   || null,
      telefono:  form.telefono  || null,
      whatsapp:  form.whatsapp  || null,
      email:     form.email     || null,
      instagram: form.instagram || null,
      facebook:  form.facebook  || null,
      notas:     form.notas     || null,
      fecha_ultimo_movimiento: new Date().toISOString(),
    }

    const { data, error: err } = await actualizarLead(lead.id, payload)

    if (err) {
      setError(err.message)
      setGuardando(false)
      return
    }
    onGuardar(data)
  }

  return (
    <Modal title={`Editar — ${lead.nombre ?? 'Lead'}`} onClose={onCerrar} maxWidth="max-w-lg" scrollable>
      <form onSubmit={handleSubmit} className="px-4 py-4 overflow-y-auto">
        <div className="row g-3 mb-3">
          {CAMPOS_TEXTO.map(({ key, label }) => (
            <div key={key} className="col-6">
              <label className="form-label small fw-medium mb-1">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="form-control form-control-sm"
                placeholder="—"
              />
            </div>
          ))}
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="tiene_web"
            checked={form.tiene_web}
            onChange={(e) => set('tiene_web', e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="tiene_web">Tiene sitio web</label>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={(e) => set('estado', e.target.value)}
            className="form-select form-select-sm"
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>{ESTADO_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Notas</label>
          <textarea
            rows={3}
            value={form.notas}
            onChange={(e) => set('notas', e.target.value)}
            placeholder="Observaciones, seguimiento, proximo contacto..."
            className="form-control form-control-sm"
            style={{ resize: 'none' }}
          />
        </div>

        {error && <p className="text-danger small mb-3">{error}</p>}

        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" onClick={onCerrar} className="btn btn-sm btn-outline-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="btn btn-sm btn-primary">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalEditar
