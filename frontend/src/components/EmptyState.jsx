// EmptyState — componente reutilizable estilo Duralux
// Props: icon (elemento SVG/JSX), title, description, action ({ label, onClick })

const ICONS = {
  leads: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  search: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  money: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  clients: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  filter: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      <line x1="4" y1="8" x2="20" y2="8" />
    </svg>
  ),
}

export default function EmptyState({ icon = 'search', title, description, action, colSpan }) {
  const content = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', gap: 12,
    }}>
      {/* Ícono en círculo suave */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#a3a3a3', marginBottom: 4,
      }}>
        {ICONS[icon] ?? ICONS.search}
      </div>

      <p style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
        {title}
      </p>

      {description && (
        <p style={{ fontSize: 13, color: '#a3a3a3', margin: 0, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary btn-sm mt-2"
          style={{ fontSize: 12, padding: '6px 16px' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )

  // Si está dentro de una tabla, envolver en tr > td
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} style={{ padding: 0, border: 'none' }}>
          {content}
        </td>
      </tr>
    )
  }

  return content
}
