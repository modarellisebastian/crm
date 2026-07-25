function IconClose() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

// Wrapper compartido por los modales del CRM: overlay + header con título/subtítulo
// y botón de cierre + cuerpo scrolleable opcional (para formularios largos).
function Modal({ title, subtitle, onClose, maxWidth = 'max-w-md', scrollable = false, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={[
          'bg-white rounded-2xl shadow-xl w-full',
          maxWidth,
          scrollable ? 'max-h-[92vh] flex flex-col' : '',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-semibold text-gray-800 truncate">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
