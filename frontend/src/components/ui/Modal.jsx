function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-bottom">
            <div>
              <h5 className="modal-title fw-semibold mb-0">{title}</h5>
              {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
