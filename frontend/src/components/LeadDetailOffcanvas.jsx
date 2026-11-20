import { useEffect, useState } from 'react'
import { FiX, FiTrash2, FiSend, FiExternalLink } from 'react-icons/fi'
import { fetchLeadNotes, addLeadNote, deleteLeadNote } from '../services/leadsService'

const ESTADO_MAP = {
  nuevo:         { label: 'Nuevo',         bg: '#f5f5f5', color: '#0a0a0a' },
  contactado:    { label: 'Contactado',    bg: '#f5f5f5', color: '#ca8a04' },
  sin_respuesta: { label: 'Sin respuesta', bg: '#f5f5f5', color: '#dc2626' },
  interesado:    { label: 'Interesado',    bg: '#f5f5f5', color: '#16a34a' },
  en_espera:     { label: 'En espera',     bg: '#eaf6fb', color: '#3ec9d6' },
  demo_enviado:  { label: 'Demo enviado',  bg: '#f5f5f5', color: '#737373' },
  negociando:    { label: 'Negociando',    bg: '#f5f5f5', color: '#ca8a04' },
  cerrado:       { label: 'Cerrado',       bg: '#f5f5f5', color: '#16a34a' },
  descartado:    { label: 'Descartado',    bg: '#f5f5f5', color: '#737373' },
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function InfoRow({ label, value, link }) {
  if (!value) return null
  return (
    <div className="d-flex gap-2 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
      <span className="text-muted" style={{ fontSize: 12, minWidth: 110 }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer"
          className="text-primary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
          {value} <FiExternalLink size={11} />
        </a>
      ) : (
        <span className="fw-medium" style={{ fontSize: 13, color: '#0a0a0a' }}>{value}</span>
      )}
    </div>
  )
}

export default function LeadDetailOffcanvas({ lead, onClose }) {
  const [notes, setNotes] = useState([])
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(true)

  useEffect(() => {
    if (!lead) return
    setLoadingNotes(true)
    fetchLeadNotes(lead.id).then(({ data }) => {
      setNotes(data ?? [])
      setLoadingNotes(false)
    })
  }, [lead?.id])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!lead) return null

  async function handleAddNote(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setSaving(true)
    const { data } = await addLeadNote(lead.id, t)
    if (data) setNotes(prev => [data, ...prev])
    setTexto('')
    setSaving(false)
  }

  async function handleDeleteNote(id) {
    await deleteLeadNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const estado = ESTADO_MAP[lead.estado] ?? { label: lead.estado, bg: '#f5f5f5', color: '#737373' }
  const initials = (lead.nombre ?? lead.rubro ?? '?').slice(0, 2).toUpperCase()
  const waUrl = lead.whatsapp
    ? `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`
    : lead.telefono
      ? `https://wa.me/${lead.telefono.replace(/\D/g, '')}`
      : null
  const webUrl = lead.web
    ? (lead.web.startsWith('http') ? lead.web : `https://${lead.web}`)
    : null
  const igUrl = lead.instagram
    ? `https://instagram.com/${lead.instagram.replace('@', '')}`
    : null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.35)',
          zIndex: 1044,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, background: '#fff',
        zIndex: 1045, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,.12)',
        animation: 'slideInRight .2s ease',
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 p-4" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0a0a0a, #6610f2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="fw-bold mb-1 text-truncate" style={{ color: '#0a0a0a' }}>
              {lead.nombre ?? <span className="text-muted fst-italic">Sin nombre</span>}
            </h6>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
              background: estado.bg, color: estado.color,
            }}>
              {estado.label}
            </span>
          </div>
          <button onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#737373', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Datos */}
          <div className="card mb-4">
            <div className="card-body p-3">
              <p className="text-muted fw-semibold text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: '.5px' }}>
                Información
              </p>
              <InfoRow label="Rubro" value={lead.rubro} />
              <InfoRow label="Ciudad" value={lead.ciudad} />
              <InfoRow label="Categoría" value={lead.categoria_google} />
              <InfoRow label="Teléfono" value={lead.telefono} />
              <InfoRow label="WhatsApp" value={lead.whatsapp} link={waUrl} />
              <InfoRow label="Web" value={lead.web} link={webUrl} />
              <InfoRow label="Instagram" value={lead.instagram} link={igUrl} />
              <InfoRow label="Score" value={lead.score != null ? `${lead.score} pts` : null} />
              <InfoRow label="Tiene web" value={lead.tiene_web ? 'Sí' : null} />
              <div className="pt-2 mt-1 d-flex flex-column gap-1" style={{ fontSize: 12, color: '#a3a3a3' }}>
                <span>Agregado: {fmt(lead.created_at)}</span>
                <span>Ult. movimiento: {fmt(lead.fecha_ultimo_movimiento)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <p className="text-muted fw-semibold text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: '.5px' }}>
            Notas
          </p>

          <form onSubmit={handleAddNote} className="d-flex gap-2 mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Llamé, quedó en pensar..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              style={{ fontSize: 13 }}
              autoFocus
            />
            <button type="submit"
              className="btn btn-primary px-3"
              disabled={saving || !texto.trim()}
              style={{ flexShrink: 0 }}>
              <FiSend size={15} />
            </button>
          </form>

          {loadingNotes ? (
            <div className="text-center py-3">
              <span className="spinner-border spinner-border-sm text-muted" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4" style={{ color: '#a3a3a3', fontSize: 13 }}>
              Sin notas todavía. Registrá el primer contacto arriba.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {notes.map(note => (
                <div key={note.id} style={{
                  background: '#fafbff',
                  border: '1px solid #eef0f8',
                  borderLeft: '3px solid #0a0a0a',
                  borderRadius: 6, padding: '10px 12px',
                }}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <p className="mb-1" style={{ fontSize: 13, color: '#0a0a0a', lineHeight: 1.5 }}>
                      {note.texto}
                    </p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ border: 'none', background: 'none', color: '#dcdcdc', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: '#a3a3a3' }}>
                    {new Date(note.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
