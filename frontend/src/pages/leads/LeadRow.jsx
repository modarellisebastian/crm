import { useEffect, useRef, useState } from 'react'
import { actualizarMovimientoLead, eliminarLead } from '../../services/leadsService'
import { useToast } from '../../context/ToastProvider'
import { ESTADOS, ESTADO_LABELS, WA_TEMPLATES } from './constants'
import { IconWhatsApp, IconEmail, IconInstagram, IconFacebook } from './icons'
import { FiEdit3, FiTrash2, FiMoreHorizontal, FiEye, FiFileText } from 'react-icons/fi'
import ConfirmModal from '../../components/ConfirmModal'

// ─── select de estado inline ──────────────────────────────────────────────────

function EstadoSelect({ lead, onUpdate }) {
  const [saving, setSaving] = useState(false)

  const toast = useToast()

  async function handleChange(e) {
    const nuevoEstado = e.target.value
    setSaving(true)
    await actualizarMovimientoLead(lead.id, { estado: nuevoEstado })
    onUpdate(lead.id, { estado: nuevoEstado })
    setSaving(false)
    toast('Estado actualizado', 'success')
  }

  // Clases bg-light-* del tema Duralux
  const BADGE_CLS = {
    nuevo:         'bg-light-primary',
    contactado:    'bg-light-warning',
    sin_respuesta: 'bg-light-danger',
    interesado:    'bg-light-success',
    en_espera:     'bg-light-info',
    demo_enviado:  'bg-light-secondary',
    negociando:    'bg-light-warning',
    cerrado:       'bg-light-success',
    descartado:    'bg-light-secondary',
  }

  const cls = BADGE_CLS[lead.estado] ?? 'bg-light-secondary'

  return (
    <select
      value={lead.estado}
      onChange={handleChange}
      disabled={saving}
      className={`badge border-0 ${cls}`}
      style={{
        borderRadius: 3,
        padding: '5px 8px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        minWidth: 120,
        appearance: 'auto',
      }}
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>
      ))}
    </select>
  )
}

// ─── score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-muted small">—</span>
  const s = Number(score)
  const [bg, color, barBg] =
    s >= 70 ? ['#f5f5f5', '#16a34a', '#16a34a'] :
    s >= 40 ? ['#f5f5f5', '#ca8a04', '#ca8a04'] :
              ['#f5f5f5', '#dc2626', '#dc2626']
  return (
    <div>
      <span className="fw-bold d-block" style={{ fontSize: 13, color }}>{s}</span>
      <div style={{ height: 4, background: '#f5f5f5', borderRadius: 2, width: 60, marginTop: 3 }}>
        <div style={{ height: '100%', width: `${Math.min(s, 100)}%`, background: barBg, borderRadius: 2, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

// ─── menu de WhatsApp ─────────────────────────────────────────────────────────

function WaMenu({ lead, waNumber, waEstimado, onContacto }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const templates = WA_TEMPLATES(lead.nombre, lead.rubro)

  return (
    <div className="dropdown" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        title={waEstimado ? 'WhatsApp estimado' : 'WhatsApp'}
        style={{ ...ACTION_BTN, color: waEstimado ? '#ca8a04' : '#16a34a', borderColor: waEstimado ? '#ebebeb' : '#ebebeb' }}
      >
        <IconWhatsApp />
      </button>
      {open && (
        <div className="dropdown-menu show shadow dropdown-menu-end" style={{ minWidth: 220, right: 0, left: 'auto' }}>
          <h6 className="dropdown-header small text-uppercase">Elegí un mensaje</h6>
          {templates.map((t) => (
            <button key={t.key}
              onClick={() => {
                const msg = t.variantes
                  ? t.variantes[Math.floor(Math.random() * t.variantes.length)]
                  : t.msg
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
                setOpen(false)
                onContacto(lead.id)
              }}
              className="dropdown-item d-flex align-items-center gap-2 small">
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Botón de acción circular estilo Duralux (evita conflicto avatar-text con width:auto)
const ACTION_BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: '50%',
  border: '1px solid #dcdee4', background: '#fff',
  cursor: 'pointer', flexShrink: 0,
  transition: 'background .15s, border-color .15s',
}

// ─── fila de la tabla ─────────────────────────────────────────────────────────

function LeadRow({ lead, seleccionado, waContactado, onToggleSeleccion, onUpdate, onDelete, esCliente, onConvertir, onContacto, onVerDetalle }) {
  const toast = useToast()
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleEliminar() {
    setEliminando(true)
    const { error } = await eliminarLead(lead.id)
    if (!error) {
      onDelete(lead.id)
      toast('Lead eliminado', 'error')
    } else {
      setEliminando(false)
      toast('Error al eliminar', 'error')
    }
    setConfirmando(false)
    setMenuOpen(false)
  }

  const waConfirmado = lead.whatsapp ? lead.whatsapp.replace(/\D/g, '') : null
  const waEstimado   = !waConfirmado && lead.telefono ? lead.telefono.replace(/\D/g, '') : null
  const waNumber     = waConfirmado ?? waEstimado

  const inicial = (lead.nombre ?? lead.rubro ?? '?')[0].toUpperCase()

  return (
    <tr className={`single-item chat-single-item${seleccionado ? ' table-primary' : ''}`}>
      {/* Checkbox */}
      <td>
        <input
          type="checkbox"
          className="custom-table-checkbox"
          checked={seleccionado}
          onChange={() => onToggleSeleccion(lead.id)}
        />
      </td>

      {/* Nombre + avatar */}
      <td>
        <div className="hstack gap-3">
          <div className="avatar-text user-avatar-text avatar-md text-white fw-bold" style={{ fontSize: 13 }}>
            {inicial}
          </div>
          <div>
            <button
              onClick={() => onVerDetalle?.(lead)}
              className="text-truncate-1-line fw-medium"
              style={{
                color: '#0a0a0a', maxWidth: 180, display: 'block',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', textDecoration: 'none',
              }}
              title="Ver detalle y notas"
            >
              {lead.nombre ?? <span className="text-muted fst-italic">Sin nombre</span>}
            </button>
            {lead.rubro && (
              <small className="text-muted d-block text-truncate" style={{ maxWidth: 180, fontSize: 11 }}>
                {lead.rubro}
              </small>
            )}
          </div>
        </div>
      </td>

      {/* Ciudad */}
      <td className="text-muted small">{lead.ciudad ?? '—'}</td>

      {/* Score */}
      <td><ScoreBadge score={lead.score} /></td>

      {/* Web */}
      <td className="text-center">
        {lead.tiene_web
          ? <span className="badge" style={{ background: '#f5f5f5', color: '#16a34a' }}>Si</span>
          : <span className="text-muted small">No</span>}
      </td>

      {/* Estado */}
      <td><EstadoSelect lead={lead} onUpdate={onUpdate} /></td>

      {/* Acciones */}
      <td>
        <div className="hstack gap-1 justify-content-end">
          {/* WhatsApp */}
          {waNumber && (
            <WaMenu lead={lead} waNumber={waNumber} waEstimado={waEstimado} onContacto={onContacto} />
          )}

          {/* Email */}
          {lead.email && (
            <a href={`mailto:${lead.email}`} title={lead.email}
              style={{ ...ACTION_BTN, color: '#737373', textDecoration: 'none' }}>
              <IconEmail />
            </a>
          )}

          {/* Instagram */}
          {lead.instagram && (
            <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener noreferrer"
              title={`@${lead.instagram}`} style={{ ...ACTION_BTN, color: '#e1306c', borderColor: '#f7c0d4', textDecoration: 'none' }}>
              <IconInstagram />
            </a>
          )}

          {/* Ver detalle y notas */}
          <button onClick={() => onVerDetalle?.(lead)} title="Ver detalle y notas"
            style={{ ...ACTION_BTN, color: '#0a0a0a', borderColor: '#ebebeb' }}>
            <FiFileText size={14} />
          </button>

          {/* Editar */}
          <button onClick={() => onUpdate(lead.id, { __edit: true })} title="Editar"
            style={{ ...ACTION_BTN, color: '#737373' }}>
            <FiEdit3 size={14} />
          </button>

          {/* Convertir / cliente */}
          {lead.estado === 'cerrado' && !esCliente && (
            <button onClick={() => onConvertir(lead)} title="Convertir en cliente"
              style={{ ...ACTION_BTN, color: '#16a34a', borderColor: '#ebebeb' }}>
              <FiEye size={14} />
            </button>
          )}

          {/* Menu mas opciones */}
          <div className="dropdown" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ ...ACTION_BTN, color: '#737373' }}>
              <FiMoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="dropdown-menu show shadow dropdown-menu-end" style={{ right: 0, left: 'auto' }}>
                <button className="dropdown-item small d-flex align-items-center gap-2"
                  onClick={() => { onUpdate(lead.id, { __edit: true }); setMenuOpen(false) }}>
                  <FiEdit3 size={13} /> Editar
                </button>
                {lead.estado === 'cerrado' && !esCliente && (
                  <button className="dropdown-item small d-flex align-items-center gap-2"
                    onClick={() => { onConvertir(lead); setMenuOpen(false) }}>
                    <FiEye size={13} /> Convertir en cliente
                  </button>
                )}
                <div className="dropdown-divider" />
                <button className="dropdown-item small d-flex align-items-center gap-2 text-danger"
                  onClick={() => { setConfirmando(true); setMenuOpen(false) }}>
                  <FiTrash2 size={13} /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </td>

      {confirmando && (
        <ConfirmModal
          title="Eliminar lead"
          message={`¿Eliminás a "${lead.nombre ?? 'este lead'}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={handleEliminar}
          onCancel={() => setConfirmando(false)}
        />
      )}
    </tr>
  )
}

export default LeadRow
