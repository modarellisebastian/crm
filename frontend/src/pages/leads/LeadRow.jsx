import { useEffect, useRef, useState } from 'react'
import { actualizarMovimientoLead, eliminarLead, buscarInstagram } from '../../services/leadsService'
import { ESTADOS, ESTADO_STYLES, ESTADO_LABELS, WA_TEMPLATES } from './constants'
import { IconWhatsApp, IconEmail, IconInstagram, IconFacebook } from './icons'

// ─── select de estado inline ──────────────────────────────────────────────────

function EstadoSelect({ lead, onUpdate }) {
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const nuevoEstado = e.target.value
    setSaving(true)
    await actualizarMovimientoLead(lead.id, { estado: nuevoEstado })
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
      const data = await buscarInstagram(SCRAPER_URL, { leadId: lead.id, nombre: lead.nombre, ciudad: lead.ciudad })
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

  const templates = WA_TEMPLATES(lead.nombre, lead.rubro)

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
    const { error } = await eliminarLead(lead.id)
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

export default LeadRow
