import { useEffect } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmModal({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, loading = false, danger = true }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.4)',
          zIndex: 1055,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, maxWidth: 'calc(100vw - 32px)',
        background: '#fff',
        borderRadius: 12,
        zIndex: 1056,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
        animation: 'fadeScaleIn .15s ease',
      }}>
        <style>{`@keyframes fadeScaleIn { from { opacity:0; transform: translate(-50%,-50%) scale(.95) } to { opacity:1; transform: translate(-50%,-50%) scale(1) } }`}</style>

        <div className="p-4 text-center">
          {/* Icono */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: danger ? '#f5f5f5' : '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <FiAlertTriangle size={24} color={danger ? '#dc2626' : '#ca8a04'} />
          </div>

          <h6 className="fw-bold mb-2" style={{ color: '#0a0a0a' }}>{title}</h6>
          <p className="text-muted mb-4" style={{ fontSize: 14 }}>{message}</p>

          <div className="d-flex gap-2 justify-content-center">
            <button
              onClick={onCancel}
              className="btn btn-outline-secondary px-4"
              disabled={loading}
              style={{ fontSize: 14 }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`btn ${danger ? 'btn-danger' : 'btn-warning'} px-4`}
              disabled={loading}
              style={{ fontSize: 14 }}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />{confirmLabel}...</>
                : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
