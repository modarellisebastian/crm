import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ESTADOS = ['nuevo', 'contactado', 'sin_respuesta', 'interesado', 'en_espera', 'demo_enviado', 'negociando', 'cerrado', 'descartado']

const PAGE_SIZE = 20

const ORDEN_OPTIONS = [
  { key: 'score',      label: 'Score' },
  { key: 'movimiento', label: 'Último movimiento' },
  { key: 'creado',     label: 'Fecha scraping' },
]

function sortLeads(arr, orden) {
  const comparar = {
    score:      (a, b) => (b.score ?? 0) - (a.score ?? 0) || new Date(b.created_at) - new Date(a.created_at),
    movimiento: (a, b) => new Date(b.fecha_ultimo_movimiento ?? b.created_at) - new Date(a.fecha_ultimo_movimiento ?? a.created_at),
    creado:     (a, b) => new Date(b.created_at) - new Date(a.created_at),
  }[orden] ?? ((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const activos     = arr.filter((l) => l.estado !== 'descartado').sort(comparar)
  const descartados = arr.filter((l) => l.estado === 'descartado').sort(comparar)
  return [...activos, ...descartados]
}

const ESTADO_STYLES = {
  nuevo:          'bg-blue-100 text-blue-700',
  contactado:     'bg-yellow-100 text-yellow-700',
  sin_respuesta:  'bg-red-100 text-red-600',
  interesado:     'bg-teal-100 text-teal-700',
  en_espera:      'bg-indigo-100 text-indigo-700',
  demo_enviado:   'bg-purple-100 text-purple-700',
  negociando:     'bg-orange-100 text-orange-700',
  cerrado:        'bg-green-100 text-green-700',
  descartado:     'bg-gray-100 text-gray-500',
}

const ESTADO_LABELS = {
  nuevo:          'Nuevo',
  contactado:     'Contactado',
  sin_respuesta:  'Sin respuesta',
  interesado:     'Interesado',
  en_espera:      'En espera',
  demo_enviado:   'Demo enviado',
  negociando:     'Negociando',
  cerrado:        'Cerrado',
  descartado:     'Descartado',
}

// ─── íconos de contacto ───────────────────────────────────────────────────────

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.849L.057 23.617a.75.75 0 0 0 .921.921l5.769-1.474A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.696 9.696 0 0 1-4.951-1.355l-.355-.212-3.668.937.955-3.587-.232-.369A9.698 9.698 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  )
}

function IconEmail() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
    </svg>
  )
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

// ─── modal edición ────────────────────────────────────────────────────────────

const CAMPOS_TEXTO = [
  { key: 'nombre',    label: 'Nombre' },
  { key: 'rubro',     label: 'Rubro' },
  { key: 'ciudad',    label: 'Ciudad' },
  { key: 'url_web',   label: 'URL web' },
  { key: 'telefono',  label: 'Teléfono' },
  { key: 'whatsapp',  label: 'WhatsApp' },
  { key: 'email',     label: 'Email' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook' },
]

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

    const { data, error: err } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', lead.id)
      .select()
      .single()

    if (err) {
      setError(err.message)
      setGuardando(false)
      return
    }
    onGuardar(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800 truncate pr-4">
            Editar — {lead.nombre ?? 'Lead'}
          </h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

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
      </div>
    </div>
  )
}

// ─── modal convertir a cliente ────────────────────────────────────────────────

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

    const { data, error: err } = await supabase
      .from('clients')
      .insert({
        lead_id:                   lead.id,
        nombre:                    lead.nombre,
        fecha_inicio:              form.fecha_inicio || null,
        fecha_vencimiento_hosting: form.fecha_vencimiento_hosting || null,
        url_sitio_entregado:       form.url_sitio_entregado || null,
        url_demo_stitch:           form.url_demo_stitch || null,
        notas:                     form.notas || null,
      })
      .select()
      .single()

    if (err) { setError(err.message); setGuardando(false); return }
    onConvertido(lead.id, data.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Convertir en cliente</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.nombre}</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

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
      </div>
    </div>
  )
}

// ─── select de estado inline ──────────────────────────────────────────────────

function EstadoSelect({ lead, onUpdate }) {
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const nuevoEstado = e.target.value
    setSaving(true)
    await supabase
      .from('leads')
      .update({ estado: nuevoEstado, fecha_ultimo_movimiento: new Date().toISOString() })
      .eq('id', lead.id)
    onUpdate(lead.id, { estado: nuevoEstado })
    setSaving(false)
  }

  return (
    <select
      value={lead.estado}
      onChange={handleChange}
      disabled={saving}
      className={[
        'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300',
        'disabled:opacity-50',
        ESTADO_STYLES[lead.estado] ?? 'bg-gray-100 text-gray-600',
      ].join(' ')}
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>
      ))}
    </select>
  )
}

// ─── buscar instagram ─────────────────────────────────────────────────────────

const SCRAPER_URL = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3005'

function BuscarIG({ lead, onEncontrado }) {
  const [estado, setEstado] = useState('idle') // 'idle' | 'buscando' | 'encontrado' | 'no_encontrado'

  async function handleBuscar() {
    setEstado('buscando')
    try {
      const res  = await fetch(`${SCRAPER_URL}/api/enriquecer-instagram`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ leadId: lead.id, nombre: lead.nombre, ciudad: lead.ciudad }),
      })
      const data = await res.json()
      if (data.encontrado) {
        setEstado('encontrado')
        onEncontrado(data.instagram)
      } else {
        setEstado('no_encontrado')
        setTimeout(() => setEstado('idle'), 3000)
      }
    } catch {
      setEstado('idle')
    }
  }

  if (estado === 'buscando') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7">
        <svg className="w-3.5 h-3.5 animate-spin text-pink-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </span>
    )
  }

  if (estado === 'no_encontrado') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 text-gray-300" title="No se encontró Instagram">
        <IconInstagram />
      </span>
    )
  }

  return (
    <button
      onClick={handleBuscar}
      title="Buscar Instagram"
      className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-300 hover:text-pink-400 hover:bg-pink-50 transition-colors"
    >
      <IconInstagram />
    </button>
  )
}

// ─── plantillas de WhatsApp ───────────────────────────────────────────────────

const WA_TEMPLATES = (nombre) => [
  {
    key: 'primer_contacto',
    label: 'Primer contacto',
    emoji: '👋',
    // variantes: se elige una al azar al hacer click para evitar bloqueos de WA
    variantes: [
      `Hola! Soy Sebastián. Tengo una app para administrar gimnasios que ya están usando varios gyms en Argentina, y quería ver si les podía ser útil a ustedes también. ¿Este es ${nombre ?? 'el gimnasio'}?`,
      `Buenas! Mi nombre es Sebastián. Desarrollé una app de gestión para gimnasios y varios gyms del país ya la están usando. ¿Puedo hablar con alguien de ${nombre ?? 'el gimnasio'}?`,
      `Hola, cómo están? Soy Sebastián. Trabajo con gimnasios de Argentina ofreciéndoles una app de administración. ¿Este es el contacto de ${nombre ?? 'el gimnasio'}?`,
      `Buen día! Soy Sebastián. Tengo una solución digital para gimnasios que ya usan varios en todo el país. ¿Hablo con alguien de ${nombre ?? 'el gimnasio'}?`,
      `Hola! Sebastián acá. Estoy trabajando con gimnasios de todo el país con una app de gestión y administración. ¿Este es ${nombre ?? 'el gimnasio'}?`,
    ],
  },
  {
    key: 'seguimiento',
    label: 'Seguimiento',
    emoji: '🔄',
    msg: `Hola! Soy Sebastián, te escribí hace unos días sobre ${nombre ?? 'el gimnasio'}. ¿Pudiste ver lo que te mandé?`,
  },
  {
    key: 'propuesta',
    label: 'Propuesta web',
    emoji: '💻',
    msg: `Hola! Soy Sebastián, me especializo en páginas web para gimnasios. Quería mostrarte algo para ${nombre ?? 'el gimnasio'}, ¿tenés un momento?`,
  },
  {
    key: 'cierre',
    label: 'Cierre / trial',
    emoji: '🚀',
    msg: `Hola! Soy Sebastián. Quería saber si tuviste oportunidad de revisar la propuesta para ${nombre ?? 'el gimnasio'}. Podemos arrancar con una prueba sin costo para que lo veas funcionando 🙌`,
  },
]

function WaMenu({ lead, waNumber, waEstimado, onContacto }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const templates = WA_TEMPLATES(lead.nombre)

  function handleTemplate() {
    setOpen(false)
    onContacto(lead.id)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={waEstimado ? 'WhatsApp estimado desde teléfono' : 'WhatsApp'}
        className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
          waEstimado
            ? 'text-amber-400 hover:bg-amber-50'
            : 'text-green-500 hover:bg-green-50'
        }`}
      >
        <IconWhatsApp />
      </button>

      {open && (
        <div className="absolute left-0 top-8 z-30 w-56 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 overflow-hidden">
          <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 mb-1">
            Elegí un mensaje
          </p>
          {templates.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                const msg = t.variantes
                  ? t.variantes[Math.floor(Math.random() * t.variantes.length)]
                  : t.msg
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
                handleTemplate()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-base leading-none">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── fila de la tabla ─────────────────────────────────────────────────────────

function LeadRow({ lead, seleccionado, waContactado, onToggleSeleccion, onUpdate, onDelete, esCliente, onConvertir, onContacto }) {
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando]   = useState(false)

  async function handleEliminar() {
    setEliminando(true)
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    if (!error) onDelete(lead.id)
    else setEliminando(false)
    setConfirmando(false)
  }

  const waConfirmado = lead.whatsapp ? lead.whatsapp.replace(/\D/g, '') : null
  const waEstimado   = !waConfirmado && lead.telefono ? lead.telefono.replace(/\D/g, '') : null
  const waNumber     = waConfirmado ?? waEstimado

  return (
    <tr className={`transition-colors ${
      seleccionado  ? 'bg-blue-50' :
      waContactado  ? 'bg-green-50 hover:bg-green-100' :
      'hover:bg-gray-50'
    }`}>
      <td className="px-4 py-3 w-8">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => onToggleSeleccion(lead.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        <p className="font-medium text-gray-800 truncate">
          {lead.nombre ?? <span className="text-gray-300">—</span>}
        </p>
        {lead.notas && (
          <p className="text-xs text-gray-400 truncate mt-0.5" title={lead.notas}>
            {lead.notas}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {lead.rubro ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
        {lead.ciudad ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {lead.tiene_web
          ? <span className="text-green-600 font-medium">Sí</span>
          : <span className="text-gray-300">No</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
        {lead.whatsapp ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate text-xs">
        {lead.email ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[130px] truncate text-xs">
        {lead.instagram ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-gray-600 max-w-[130px] truncate text-xs">
        {lead.facebook ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <EstadoSelect lead={lead} onUpdate={onUpdate} />
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Links de contacto */}
          {waNumber && (
            <WaMenu lead={lead} waNumber={waNumber} waEstimado={waEstimado} onContacto={onContacto} />
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} title="Enviar email"
              className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:bg-gray-100 transition-colors">
              <IconEmail />
            </a>
          )}
          {lead.instagram ? (
            <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener noreferrer" title={`@${lead.instagram}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded text-pink-500 hover:bg-pink-50 transition-colors">
              <IconInstagram />
            </a>
          ) : (
            <BuscarIG lead={lead} onEncontrado={(ig) => onUpdate(lead.id, { instagram: ig })} />
          )}
          {lead.facebook && (
            <a href={lead.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
              className="inline-flex items-center justify-center w-7 h-7 rounded text-blue-500 hover:bg-blue-50 transition-colors">
              <IconFacebook />
            </a>
          )}

          {/* Convertir en cliente (solo cerrados) */}
          {lead.estado === 'cerrado' && (
            esCliente ? (
              <span title="Ya es cliente"
                className="inline-flex items-center justify-center w-7 h-7 rounded text-green-500">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                </svg>
              </span>
            ) : (
              <button onClick={() => onConvertir(lead)} title="Convertir en cliente"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors whitespace-nowrap">
                → Cliente
              </button>
            )
          )}

          {/* Separador si hay links de contacto */}
          {(waNumber || lead.email || lead.instagram || lead.facebook) && (
            <span className="w-px h-4 bg-gray-200 mx-0.5" />
          )}

          {/* Editar */}
          <button
            onClick={() => onUpdate(lead.id, { __edit: true })}
            title="Editar"
            className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>

          {/* Eliminar / confirmar */}
          {confirmando ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="text-xs font-medium text-red-600 hover:text-red-700 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {eliminando ? '…' : 'Sí'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmando(true)}
              title="Eliminar"
              className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [ciudades, setCiudades]               = useState([])
  const [categorias, setCategorias]           = useState([])
  const [filtroCiudad, setFiltroCiudad]       = useState('')
  const [filtroEstado, setFiltroEstado]       = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroBusqueda, setFiltroBusqueda]   = useState('')
  const [filtroFecha, setFiltroFecha]         = useState('')       // '' | 'hoy' | 'ayer' | 'semana' | 'mes'
  const [campoFecha, setCampoFecha]           = useState('movimiento') // 'movimiento' | 'scraping'
  const [leadEditando, setLeadEditando] = useState(null)
  const [leadConvirtiendo, setLeadConvirtiendo] = useState(null)
  const [clienteLeadIds, setClienteLeadIds]     = useState(new Set())
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [autoMovidos, setAutoMovidos] = useState(0)
  const [waContactados, setWaContactados] = useState(new Set())
  const [orden, setOrden] = useState('score')

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      const [{ data, error }, { data: clientes }] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('lead_id').not('lead_id', 'is', null),
      ])

      if (error) {
        setError(error.message)
      } else {
        // Auto-transición: contactado → sin_respuesta después de 72hs
        const limite = new Date(Date.now() - 72 * 3600 * 1000).toISOString()
        const stale  = data.filter((l) =>
          l.estado === 'contactado' &&
          (l.fecha_ultimo_movimiento ?? l.created_at) < limite
        )

        let leadsFinales = data
        if (stale.length > 0) {
          const ahora = new Date().toISOString()
          await supabase
            .from('leads')
            .update({ estado: 'sin_respuesta', fecha_ultimo_movimiento: ahora })
            .in('id', stale.map((l) => l.id))

          const ids = new Set(stale.map((l) => l.id))
          leadsFinales = data.map((l) =>
            ids.has(l.id) ? { ...l, estado: 'sin_respuesta', fecha_ultimo_movimiento: ahora } : l
          )
          setAutoMovidos(stale.length)
        }

        setLeads(leadsFinales)
        const unicas = [...new Set(leadsFinales.map((l) => l.ciudad).filter(Boolean))].sort()
        setCiudades(unicas)
        const cats = [...new Set(leadsFinales.map((l) => l.categoria_google).filter(Boolean))].sort()
        setCategorias(cats)
      }
      setClienteLeadIds(new Set((clientes ?? []).map((c) => c.lead_id)))
      setLoading(false)
    }
    fetchLeads()
  }, [])

  // onUpdate recibe { estado } para cambio inline, o { __edit: true } para abrir modal
  function handleUpdate(id, cambios) {
    if (cambios.__edit) {
      setLeadEditando(leads.find((l) => l.id === id))
      return
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
  }

  function handleGuardar(leadActualizado) {
    setLeads((prev) => prev.map((l) => (l.id === leadActualizado.id ? leadActualizado : l)))
    setLeadEditando(null)
  }

  function handleConvertido(leadId, clienteId) {
    setClienteLeadIds((prev) => new Set([...prev, leadId]))
    setLeadConvirtiendo(null)
    navigate('/clientes')
  }

  async function handleContacto(id) {
    setWaContactados((prev) => new Set([...prev, id]))
    const lead  = leads.find((l) => l.id === id)
    const ahora = new Date().toISOString()
    const updates = { fecha_ultimo_movimiento: ahora }
    if (lead?.estado === 'nuevo') updates.estado = 'contactado'
    await supabase.from('leads').update(updates).eq('id', id)
    if (lead?.estado === 'nuevo') handleUpdate(id, { estado: 'contactado' })
  }

  function handleDelete(id) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    setSeleccionados((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  async function handleEliminarSeleccionados() {
    if (!seleccionados.size) return
    setEliminandoMasivo(true)
    const ids = [...seleccionados]
    const { error } = await supabase.from('leads').delete().in('id', ids)
    if (!error) {
      setLeads((prev) => prev.filter((l) => !seleccionados.has(l.id)))
      setSeleccionados(new Set())
    }
    setEliminandoMasivo(false)
  }

  function toggleSeleccion(id) {
    setSeleccionados((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleTodos() {
    if (seleccionados.size === leadsFiltrados.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(leadsFiltrados.map((l) => l.id)))
    }
  }

  function rangoFecha(periodo) {
    const ahora = new Date()
    const hoy   = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
    switch (periodo) {
      case 'hoy':    return { desde: hoy,                                   hasta: ahora }
      case 'ayer':   return { desde: new Date(hoy - 86400000),              hasta: new Date(hoy - 1) }
      case 'semana': return { desde: new Date(hoy - 6 * 86400000),          hasta: ahora }
      case 'mes':    return { desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1), hasta: ahora }
      default:       return null
    }
  }

  const termino = filtroBusqueda.trim().toLowerCase()

  const leadsFiltrados = sortLeads(leads.filter((l) => {
    if (filtroCiudad    && l.ciudad           !== filtroCiudad)    return false
    if (filtroEstado    && l.estado           !== filtroEstado)    return false
    if (filtroCategoria && l.categoria_google !== filtroCategoria) return false
    if (filtroFecha) {
      const rango = rangoFecha(filtroFecha)
      const valor = campoFecha === 'movimiento' ? l.fecha_ultimo_movimiento : l.created_at
      if (!valor) return false
      const fecha = new Date(valor)
      if (fecha < rango.desde || fecha > rango.hasta) return false
    }
    if (termino) {
      const enNombre   = l.nombre?.toLowerCase().includes(termino)
      const enTelefono = l.telefono?.includes(termino)
      const enWa       = l.whatsapp?.includes(termino)
      if (!enNombre && !enTelefono && !enWa) return false
    }
    return true
  }), orden)

  const totalPaginas  = Math.ceil(leadsFiltrados.length / PAGE_SIZE) || 1
  const leadsVisibles = leadsFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Leads</h1>
          <span className="text-sm text-gray-400">
            {leadsFiltrados.length} resultado{leadsFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Notificación auto-transición */}
        {autoMovidos > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V8.75a.75.75 0 00-1.5 0v4.5zm.75-6.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">
                <span className="font-semibold">{autoMovidos} lead{autoMovidos !== 1 ? 's' : ''}</span>
                {' '}pasaron a <span className="font-semibold">Sin respuesta</span> por más de 72hs sin movimiento.
              </p>
            </div>
            <button
              onClick={() => setAutoMovidos(0)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}

        {/* Barra de selección masiva */}
        {seleccionados.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium text-blue-700">
              {seleccionados.size} lead{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSeleccionados(new Set())}
                className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarSeleccionados}
                disabled={eliminandoMasivo}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminandoMasivo ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Eliminando…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd"/>
                    </svg>
                    Eliminar {seleccionados.size}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="space-y-2.5">
          {/* Fila 1: búsqueda + selects */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar nombre o teléfono…"
                value={filtroBusqueda}
                onChange={(e) => { setFiltroBusqueda(e.target.value); setPagina(1) }}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white text-gray-700 w-56 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
              />
            </div>

            <select
              value={filtroCiudad}
              onChange={(e) => { setFiltroCiudad(e.target.value); setPagina(1) }}
              className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }}
              className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>)}
            </select>

            {categorias.length > 0 && (
              <select
                value={filtroCategoria}
                onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1) }}
                className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-gray-400">Ordenar:</span>
              <select
                value={orden}
                onChange={(e) => { setOrden(e.target.value); setPagina(1) }}
                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {ORDEN_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            {(filtroCiudad || filtroEstado || filtroBusqueda || filtroCategoria || filtroFecha) && (
              <button
                onClick={() => { setFiltroCiudad(''); setFiltroEstado(''); setFiltroBusqueda(''); setFiltroCategoria(''); setFiltroFecha(''); setPagina(1) }}
                className="text-sm text-gray-400 hover:text-gray-600 px-2"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Fila 2: filtro por fecha */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 shrink-0">Período:</span>
            {[
              { key: 'hoy',    label: 'Hoy' },
              { key: 'ayer',   label: 'Ayer' },
              { key: 'semana', label: 'Esta semana' },
              { key: 'mes',    label: 'Este mes' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFiltroFecha(filtroFecha === key ? '' : key); setPagina(1) }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filtroFecha === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white'
                }`}
              >
                {label}
              </button>
            ))}

            {filtroFecha && (
              <>
                <span className="text-xs text-gray-300 mx-1">·</span>
                <span className="text-xs text-gray-400 shrink-0">Filtrar por:</span>
                <button
                  onClick={() => setCampoFecha('movimiento')}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    campoFecha === 'movimiento'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  Último movimiento
                </button>
                <button
                  onClick={() => setCampoFecha('scraping')}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    campoFecha === 'scraping'
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  Fecha scraping
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-sm text-gray-400">Cargando leads...</p>
        ) : error ? (
          <p className="text-sm text-red-500">Error: {error}</p>
        ) : leadsFiltrados.length === 0 ? (
          <p className="text-sm text-gray-400">No hay leads con los filtros seleccionados.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={leadsFiltrados.length > 0 && seleccionados.size === leadsFiltrados.length}
                      ref={(el) => { if (el) el.indeterminate = seleccionados.size > 0 && seleccionados.size < leadsFiltrados.length }}
                      onChange={toggleTodos}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Rubro</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium text-center">Web</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Instagram</th>
                  <th className="px-4 py-3 font-medium">Facebook</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leadsVisibles.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    seleccionado={seleccionados.has(lead.id)}
                    waContactado={waContactados.has(lead.id)}
                    onToggleSeleccion={toggleSeleccion}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    esCliente={clienteLeadIds.has(lead.id)}
                    onConvertir={setLeadConvirtiendo}
                    onContacto={handleContacto}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-gray-400">
              Página {pagina} de {totalPaginas} · {leadsFiltrados.length} resultados
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {leadEditando && (
        <ModalEditar
          lead={leadEditando}
          onGuardar={handleGuardar}
          onCerrar={() => setLeadEditando(null)}
        />
      )}

      {leadConvirtiendo && (
        <ModalConvertir
          lead={leadConvirtiendo}
          onConvertido={handleConvertido}
          onCerrar={() => setLeadConvirtiendo(null)}
        />
      )}
    </>
  )
}
