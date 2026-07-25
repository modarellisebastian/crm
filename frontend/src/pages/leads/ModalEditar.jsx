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
      // Convertir strings vacíos a null para no guardar basura
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
        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
          {/* Campos de texto */}
          <div className="grid grid-cols-2 gap-4">
            {CAMPOS_TEXTO.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="—"
                />
              </div>
            ))}
          </div>

          {/* Tiene web */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.tiene_web}
              onChange={(e) => set('tiene_web', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Tiene sitio web</span>
          </label>

          {/* Estado */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{ESTADO_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Notas</label>
            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              placeholder="Observaciones, seguimiento, próximo contacto…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default ModalEditar
