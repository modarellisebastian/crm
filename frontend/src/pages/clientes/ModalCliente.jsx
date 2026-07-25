import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Tooltip from '../../components/ui/Tooltip'
import { actualizarCliente, crearCliente, fetchClienteCompleto } from '../../services/clientsService'
import { crearServicios, eliminarServicios } from '../../services/serviciosService'
import { HOY, SERVICIO_BADGE, FRECUENCIA_LABEL, formatARS } from './constants'

// ─── FormServicio ─────────────────────────────────────────────────────────────

const SERVICIO_VACIO = { nombre: '', tipo: 'recurrente', frecuencia: 'mensual', monto: '', por_horas: false, valor_hora: '' }

function FormServicio({ onAgregar, onCancelar }) {
  const [s, setS] = useState(SERVICIO_VACIO)
  function set(k, v) { setS((f) => ({ ...f, [k]: v })) }

  function handleAgregar() {
    if (!s.nombre.trim()) return
    onAgregar({
      nombre:     s.nombre.trim(),
      tipo:       s.tipo,
      frecuencia: s.tipo === 'recurrente' ? s.frecuencia : null,
      monto:      (!s.por_horas && s.monto !== '') ? Number(s.monto) : null,
      valor_hora: (s.por_horas && s.valor_hora !== '') ? Number(s.valor_hora) : null,
      activo:     true,
    })
    setS(SERVICIO_VACIO)
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Nombre del servicio*" value={s.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          className="col-span-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={s.tipo} onChange={(e) => set('tipo', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="recurrente">Recurrente</option>
          <option value="unico">Único</option>
        </select>
        {s.tipo === 'recurrente' ? (
          <select value={s.frecuencia} onChange={(e) => set('frecuencia', e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-400">Pago único</div>
        )}
        <label className="col-span-2 flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={s.por_horas} onChange={(e) => set('por_horas', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm text-gray-700">Cobrar por horas</span>
        </label>
        {s.por_horas ? (
          <div className="col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input type="number" min="0" placeholder="Valor por hora" value={s.valor_hora}
              onChange={(e) => set('valor_hora', e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-7 pr-12 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/hora</span>
          </div>
        ) : (
          <div className="col-span-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input type="number" min="0" placeholder="Monto (opcional)" value={s.monto}
              onChange={(e) => set('monto', e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancelar}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleAgregar}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
          Agregar servicio
        </button>
      </div>
    </div>
  )
}

// ─── ModalCliente ─────────────────────────────────────────────────────────────

function ModalCliente({ clienteInicial, onGuardar, onCerrar }) {
  const esEdicion = Boolean(clienteInicial)

  const [form, setForm] = useState({
    nombre:                    clienteInicial?.nombre                    ?? '',
    rubro:                     clienteInicial?.rubro                     ?? '',
    ciudad:                    clienteInicial?.ciudad                    ?? '',
    email:                     clienteInicial?.email                     ?? '',
    telefono:                  clienteInicial?.telefono                  ?? '',
    fecha_inicio:              clienteInicial?.fecha_inicio              ?? HOY,
    fecha_vencimiento_hosting: clienteInicial?.fecha_vencimiento_hosting ?? '',
    url_sitio_entregado:       clienteInicial?.url_sitio_entregado       ?? '',
    url_demo_stitch:           clienteInicial?.url_demo_stitch           ?? '',
    notas:                     clienteInicial?.notas                     ?? '',
  })
  const [servicios, setServicios]           = useState(clienteInicial?.servicios ?? [])
  const [idsAEliminar, setIdsAEliminar]     = useState([])
  const [mostrarFormSvc, setMostrarFormSvc] = useState(false)
  const [guardando, setGuardando]           = useState(false)
  const [error, setError]                   = useState(null)

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function agregarServicio(svc) {
    setServicios((prev) => [...prev, { ...svc, _nuevo: true, _id: crypto.randomUUID() }])
    setMostrarFormSvc(false)
  }

  function quitarServicio(id) {
    const svc = servicios.find((s) => (s.id ?? s._id) === id)
    if (svc?.id) setIdsAEliminar((prev) => [...prev, svc.id])
    setServicios((prev) => prev.filter((s) => (s.id ?? s._id) !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return }
    setGuardando(true); setError(null)

    const payload = {
      nombre:                    form.nombre,
      rubro:                     form.rubro || null,
      ciudad:                    form.ciudad || null,
      email:                     form.email || null,
      telefono:                  form.telefono || null,
      fecha_inicio:              form.fecha_inicio || null,
      fecha_vencimiento_hosting: form.fecha_vencimiento_hosting || null,
      url_sitio_entregado:       form.url_sitio_entregado || null,
      url_demo_stitch:           form.url_demo_stitch || null,
      notas:                     form.notas || null,
    }

    if (esEdicion) {
      const { error: e1 } = await actualizarCliente(clienteInicial.id, payload)
      if (e1) { setError(e1.message); setGuardando(false); return }

      if (idsAEliminar.length > 0) {
        const { error: e2 } = await eliminarServicios(idsAEliminar)
        if (e2) { setError(e2.message); setGuardando(false); return }
      }

      const nuevos = servicios.filter((s) => s._nuevo)
      if (nuevos.length > 0) {
        const { error: e3 } = await crearServicios(
          nuevos.map(({ nombre, tipo, frecuencia, monto, valor_hora, activo }) => ({
            client_id: clienteInicial.id, nombre, tipo, frecuencia, monto, valor_hora, activo,
          }))
        )
        if (e3) { setError(e3.message); setGuardando(false); return }
      }

      const { data } = await fetchClienteCompleto(clienteInicial.id)
      onGuardar(data)
    } else {
      const { data: cliente, error: e1 } = await crearCliente(payload)
      if (e1) { setError(e1.message); setGuardando(false); return }

      if (servicios.length > 0) {
        await crearServicios(
          servicios.map(({ nombre, tipo, frecuencia, monto, valor_hora, activo }) => ({
            client_id: cliente.id, nombre, tipo, frecuencia, monto, valor_hora, activo,
          }))
        )
      }

      const { data } = await fetchClienteCompleto(cliente.id)
      onGuardar(data)
    }
  }

  return (
    <Modal
      title={esEdicion ? `Editar — ${clienteInicial.nombre}` : 'Nuevo cliente'}
      onClose={onCerrar}
      maxWidth="max-w-2xl"
      scrollable
    >
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6">

          {/* Datos básicos */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos del cliente</p>
              <Tooltip text="Información de contacto del cliente. El nombre es el único campo obligatorio." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="block text-xs font-medium text-gray-600">Nombre *</label>
                <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)}
                  placeholder="Nombre del cliente o empresa"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Rubro</label>
                <input type="text" value={form.rubro} onChange={(e) => set('rubro', e.target.value)}
                  placeholder="Ej: Gimnasio"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Ciudad</label>
                <input type="text" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)}
                  placeholder="Ej: Tandil"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Teléfono / WhatsApp</label>
                <input type="text" value={form.telefono} onChange={(e) => set('telefono', e.target.value)}
                  placeholder="+54 9 ..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </section>

          {/* Proyecto */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Proyecto web</p>
              <Tooltip text="Datos relacionados al sitio entregado y vencimiento de hosting. El sistema te avisará cuando el hosting esté por vencer." wide />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Fecha de inicio</label>
                  <Tooltip text="Cuándo comenzó el proyecto o la relación con este cliente." />
                </div>
                <input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Vencimiento hosting</label>
                  <Tooltip text="Fecha en que vence el plan de hosting del cliente. Aparece resaltada en rojo/amarillo si está cerca o vencida." />
                </div>
                <input type="date" value={form.fecha_vencimiento_hosting} onChange={(e) => set('fecha_vencimiento_hosting', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">URL sitio entregado</label>
                  <Tooltip text="URL del sitio web ya publicado y entregado al cliente." />
                </div>
                <input type="text" value={form.url_sitio_entregado} onChange={(e) => set('url_sitio_entregado', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">URL demo</label>
                  <Tooltip text="Enlace a la demo o propuesta que se le envió al cliente antes de cerrar." />
                </div>
                <input type="text" value={form.url_demo_stitch} onChange={(e) => set('url_demo_stitch', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-1">
                  <label className="block text-xs font-medium text-gray-600">Notas internas</label>
                  <Tooltip text="Observaciones privadas sobre el cliente: preferencias, historial de conversaciones, próximos pasos, etc." />
                </div>
                <textarea rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)}
                  placeholder="Detalles del proyecto, acuerdos, recordatorios…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          </section>

          {/* Servicios */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Servicios</p>
                <Tooltip
                  text="Servicios contratados por este cliente. Los servicios activos aparecen en la tabla principal y se usan para pre-completar el monto al registrar cobros. Podés pausarlos sin eliminarlos."
                  wide
                />
              </div>
              {!mostrarFormSvc && (
                <button type="button" onClick={() => setMostrarFormSvc(true)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Agregar servicio
                </button>
              )}
            </div>

            {servicios.length > 0 && (
              <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 px-3">
                {servicios.map((s) => {
                  const id = s.id ?? s._id
                  return (
                    <div key={id} className="flex items-center gap-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SERVICIO_BADGE[s.tipo]}`}>
                        {s.tipo}{s.frecuencia ? ` · ${s.frecuencia}` : ''}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{s.nombre}</span>
                      {s.monto != null && (
                        <span className="text-xs text-gray-400 tabular-nums shrink-0">
                          {formatARS(s.monto)}{s.frecuencia ? FRECUENCIA_LABEL[s.frecuencia] : ''}
                        </span>
                      )}
                      <button type="button" onClick={() => quitarServicio(id)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {mostrarFormSvc && <FormServicio onAgregar={agregarServicio} onCancelar={() => setMostrarFormSvc(false)} />}

            {servicios.length === 0 && !mostrarFormSvc && (
              <p className="text-xs text-gray-400 py-1">Sin servicios. Podés agregarlos ahora o después.</p>
            )}
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button type="button" onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
    </Modal>
  )
}

export default ModalCliente
