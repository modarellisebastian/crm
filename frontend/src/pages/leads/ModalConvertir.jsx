import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { crearClienteDesdeLead } from '../../services/clientsService'

function ModalConvertir({ lead, onConvertido, onCerrar }) {
  const hoy = new Date().toISOString().split('T')[0]
  const enUnAnio = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    fecha_inicio:              hoy,
    fecha_vencimiento_hosting: enUnAnio,
    url_sitio_entregado:       '',
    url_demo_stitch:           '',
    notas:                     '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState(null)

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const { data, error: err } = await crearClienteDesdeLead(lead, {
      fecha_inicio:              form.fecha_inicio || null,
      fecha_vencimiento_hosting: form.fecha_vencimiento_hosting || null,
      url_sitio_entregado:       form.url_sitio_entregado || null,
      url_demo_stitch:           form.url_demo_stitch || null,
      notas:                     form.notas || null,
    })

    if (err) { setError(err.message); setGuardando(false); return }
    onConvertido(lead.id, data.id)
  }

  return (
    <Modal title="Convertir en cliente" subtitle={lead.nombre} onClose={onCerrar}>
      <form onSubmit={handleSubmit} className="px-4 py-4">
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="form-label small fw-medium mb-1">Fecha de inicio</label>
            <input type="date" value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
              className="form-control form-control-sm" />
          </div>
          <div className="col-6">
            <label className="form-label small fw-medium mb-1">Venc. hosting</label>
            <input type="date" value={form.fecha_vencimiento_hosting}
              onChange={(e) => set('fecha_vencimiento_hosting', e.target.value)}
              className="form-control form-control-sm" />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">URL sitio entregado</label>
          <input type="text" placeholder="https://..." value={form.url_sitio_entregado}
            onChange={(e) => set('url_sitio_entregado', e.target.value)}
            className="form-control form-control-sm" />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">URL demo Stitch</label>
          <input type="text" placeholder="https://..." value={form.url_demo_stitch}
            onChange={(e) => set('url_demo_stitch', e.target.value)}
            className="form-control form-control-sm" />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-medium mb-1">Notas</label>
          <textarea rows={2} placeholder="Detalles del proyecto..." value={form.notas}
            onChange={(e) => set('notas', e.target.value)}
            className="form-control form-control-sm" style={{ resize: 'none' }} />
        </div>

        {error && <p className="text-danger small mb-3">{error}</p>}

        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" onClick={onCerrar} className="btn btn-sm btn-outline-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={guardando} className="btn btn-sm btn-success">
            {guardando ? 'Creando cliente...' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalConvertir
