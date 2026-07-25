function Tooltip({ text, wide }) {
  return (
    <span className="group relative inline-flex items-center">
      <svg
        className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 cursor-help transition-colors shrink-0"
        viewBox="0 0 20 20" fill="currentColor"
      >
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <span className={`pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${wide ? 'w-64' : 'w-52'} rounded-xl bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 text-center shadow-lg`}>
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}

export default Tooltip
