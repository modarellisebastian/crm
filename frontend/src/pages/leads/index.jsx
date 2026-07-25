import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchLeadsConClientes,
  marcarLeadsSinRespuesta,
  actualizarMovimientoLead,
  eliminarLeads,
} from '../../services/leadsService'
import { PAGE_SIZE, ORDEN_OPTIONS, ESTADOS, ESTADO_LABELS, sortLeads } from './constants'
import ModalEditar from './ModalEditar'
import ModalConvertir from './ModalConvertir'
import LeadRow from './LeadRow'

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
      const [{ data, error }, { data: clientes }] = await fetchLeadsConClientes()

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
          await marcarLeadsSinRespuesta(stale.map((l) => l.id), ahora)

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
    await actualizarMovimientoLead(id, lead?.estado === 'nuevo' ? { estado: 'contactado' } : {})
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
    const { error } = await eliminarLeads(ids)
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
