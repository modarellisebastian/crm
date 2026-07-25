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
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Fecha de inicio</label>
              <input type="date" value={form.fecha_inicio}
                onChange={(e) => set('fecha_inicio', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Venc. hosting</label>
              <input type="date" value={form.fecha_vencimiento_hosting}
                onChange={(e) => set('fecha_vencimiento_hosting', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">URL sitio entregado</label>
            <input type="text" placeholder="https://..." value={form.url_sitio_entregado}
              onChange={(e) => set('url_sitio_entregado', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">URL demo Stitch</label>
            <input type="text" placeholder="https://..." value={form.url_demo_stitch}
              onChange={(e) => set('url_demo_stitch', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Notas</label>
            <textarea rows={2} placeholder="Detalles del proyecto..." value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50">
              {guardando ? 'Creando cliente…' : 'Crear cliente'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default ModalConvertir
