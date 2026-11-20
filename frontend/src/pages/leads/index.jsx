import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState'
import LeadDetailOffcanvas from '../../components/LeadDetailOffcanvas'
import { useToast } from '../../context/ToastProvider'
import { FiPlus, FiDownload, FiTrash2 } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  fetchLeadsConClientes,
  marcarLeadsSinRespuesta,
  actualizarMovimientoLead,
  actualizarLead,
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
  const [filtroFecha, setFiltroFecha]         = useState('')
  const [campoFecha, setCampoFecha]           = useState('movimiento')
  const [leadEditando, setLeadEditando] = useState(null)
  const toast = useToast()
  const [leadConvirtiendo, setLeadConvirtiendo] = useState(null)
  const [clienteLeadIds, setClienteLeadIds]     = useState(new Set())
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [autoMovidos, setAutoMovidos] = useState(0)
  const [waContactados, setWaContactados] = useState(new Set())
  const [orden, setOrden] = useState('score')
  const [leadDetalle, setLeadDetalle] = useState(null)
  const [cambioEstadoMasivo, setCambioEstadoMasivo] = useState('')
  const [aplicandoEstado, setAplicandoEstado] = useState(false)

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      const [{ data, error }, { data: clientes }] = await fetchLeadsConClientes()

      if (error) {
        setError(error.message)
      } else {
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

  function handleUpdate(id, cambios) {
    if (cambios.__edit) {
      setLeadEditando(leads.find((l) => l.id === id))
      return
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
  }

  function handleGuardar(leadActualizado) {
    const esNuevo = !leads.find(l => l.id === leadActualizado.id)
    if (esNuevo) setLeads(prev => [leadActualizado, ...prev])
    else setLeads((prev) => prev.map((l) => (l.id === leadActualizado.id ? leadActualizado : l)))
    setLeadEditando(null)
    toast(esNuevo ? 'Lead creado' : 'Lead actualizado', 'success')
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

  const hayFiltros = filtroCiudad || filtroEstado || filtroBusqueda || filtroCategoria || filtroFecha

  function exportarCSV() {
    const target = seleccionados.size > 0
      ? leadsFiltrados.filter(l => seleccionados.has(l.id))
      : leadsFiltrados
    const headers = ['Nombre','Rubro','Ciudad','Estado','WhatsApp','Telefono','Web','Instagram','Score','Fecha creacion']
    const rows = target.map(l => [
      l.nombre ?? '', l.rubro ?? '', l.ciudad ?? '',
      ESTADO_LABELS[l.estado] ?? l.estado,
      l.whatsapp ?? '', l.telefono ?? '', l.web ?? '', l.instagram ?? '',
      l.score ?? '',
      l.created_at ? new Date(l.created_at).toLocaleDateString('es-AR') : '',
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCambioEstadoMasivo() {
    if (!cambioEstadoMasivo || !seleccionados.size) return
    setAplicandoEstado(true)
    const ids = [...seleccionados]
    await Promise.all(ids.map(id => actualizarLead(id, { estado: cambioEstadoMasivo, fecha_ultimo_movimiento: new Date().toISOString() })))
    setLeads(prev => prev.map(l => seleccionados.has(l.id) ? { ...l, estado: cambioEstadoMasivo } : l))
    setSeleccionados(new Set())
    setCambioEstadoMasivo('')
    setAplicandoEstado(false)
    toast(`Estado actualizado en ${ids.length} lead${ids.length !== 1 ? 's' : ''}`, 'success')
  }

  return (
    <>
      <div className="d-flex flex-column gap-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h4 className="fw-semibold mb-0">Leads</h4>
            <span className="text-muted small">{leadsFiltrados.length} resultado{leadsFiltrados.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-1"
              style={{ fontSize: 13 }}
              onClick={exportarCSV}
              title={seleccionados.size > 0 ? `Exportar ${seleccionados.size} seleccionados` : 'Exportar todos'}
            >
              <FiDownload size={15} />
              <span className="d-none d-sm-inline">Exportar CSV</span>
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ fontSize: 13, padding: '8px 18px' }}
              onClick={() => setLeadEditando({})}
            >
              <FiPlus size={16} />
              Nuevo lead
            </button>
          </div>
        </div>

        {/* Notificacion auto-transicion */}
        {autoMovidos > 0 && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between gap-2 py-2">
            <span className="small">
              <strong>{autoMovidos} lead{autoMovidos !== 1 ? 's' : ''}</strong> pasaron a{' '}
              <strong>Sin respuesta</strong> por mas de 72hs sin movimiento.
            </span>
            <button className="btn-close btn-sm" onClick={() => setAutoMovidos(0)} />
          </div>
        )}

        {/* Barra de acciones masivas */}
        {seleccionados.size > 0 && (
          <div className="card" style={{ background: '#0a0a0a', border: 'none' }}>
            <div className="card-body py-2 px-3 d-flex align-items-center gap-3 flex-wrap">
              <span className="badge bg-primary">{seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}</span>
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto', fontSize: 12, maxWidth: 180 }}
                  value={cambioEstadoMasivo}
                  onChange={e => setCambioEstadoMasivo(e.target.value)}
                >
                  <option value="">Cambiar estado a...</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>)}
                </select>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={!cambioEstadoMasivo || aplicandoEstado}
                  onClick={handleCambioEstadoMasivo}
                  style={{ fontSize: 12 }}
                >
                  {aplicandoEstado ? <span className="spinner-border spinner-border-sm" /> : 'Aplicar'}
                </button>
              </div>
              <div className="vr" style={{ background: 'rgba(255,255,255,.2)', height: 20 }} />
              <button onClick={exportarCSV} className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                <FiDownload size={13} /> CSV
              </button>
              <button onClick={handleEliminarSeleccionados} disabled={eliminandoMasivo}
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                {eliminandoMasivo
                  ? <span className="spinner-border spinner-border-sm" />
                  : <><FiTrash2 size={13} /> Eliminar</>}
              </button>
              <button onClick={() => setSeleccionados(new Set())}
                className="btn btn-sm btn-link ms-auto text-white-50 py-0" style={{ fontSize: 12 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="card">
          <div className="card-body py-3">
          <div className="d-flex flex-column gap-2">
          {/* Fila 1 */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group" style={{ width: 240 }}>
              <span className="input-group-text" style={{ background: '#f5f5f5', border: '1px solid #dcdee4', borderRight: 'none' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#a3a3a3" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input type="text" className="form-control"
                placeholder="Buscar nombre o telefono..."
                value={filtroBusqueda}
                onChange={(e) => { setFiltroBusqueda(e.target.value); setPagina(1) }}
                style={{ fontSize: 13, borderLeft: 'none' }} />
            </div>

            <select className="form-select" style={{ width: 'auto', fontSize: 13 }}
              value={filtroCiudad}
              onChange={(e) => { setFiltroCiudad(e.target.value); setPagina(1) }}>
              <option value="">Todas las ciudades</option>
              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="form-select" style={{ width: 'auto', fontSize: 13 }}
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1) }}>
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e] ?? e}</option>)}
            </select>

            {categorias.length > 0 && (
              <select className="form-select" style={{ width: 'auto', fontSize: 13 }}
                value={filtroCategoria}
                onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1) }}>
                <option value="">Todas las categorias</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="text-muted" style={{ fontSize: 12 }}>Ordenar:</span>
              <select className="form-select" style={{ width: 'auto', fontSize: 13 }}
                value={orden}
                onChange={(e) => { setOrden(e.target.value); setPagina(1) }}>
                {ORDEN_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            {hayFiltros && (
              <button className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: 12 }}
                onClick={() => { setFiltroCiudad(''); setFiltroEstado(''); setFiltroBusqueda(''); setFiltroCategoria(''); setFiltroFecha(''); setPagina(1) }}>
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Fila 2: filtro por fecha */}
          <div className="d-flex align-items-center gap-2 flex-wrap pt-1" style={{ borderTop: '1px solid #f5f5f5' }}>
            <span className="text-muted" style={{ fontSize: 12 }}>Periodo:</span>
            {[
              { key: 'hoy',    label: 'Hoy' },
              { key: 'ayer',   label: 'Ayer' },
              { key: 'semana', label: 'Esta semana' },
              { key: 'mes',    label: 'Este mes' },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => { setFiltroFecha(filtroFecha === key ? '' : key); setPagina(1) }}
                className={`btn btn-sm ${filtroFecha === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: 12 }}>
                {label}
              </button>
            ))}

            {filtroFecha && (
              <>
                <div className="vr mx-1" />
                <span className="text-muted" style={{ fontSize: 12 }}>Campo:</span>
                <button onClick={() => setCampoFecha('movimiento')}
                  className={`btn btn-sm ${campoFecha === 'movimiento' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 12 }}>
                  Ult. movimiento
                </button>
                <button onClick={() => setCampoFecha('scraping')}
                  className={`btn btn-sm ${campoFecha === 'scraping' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 12 }}>
                  Fecha scraping
                </button>
              </>
            )}
          </div>
        </div>
        </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="card function-table"><div className="card-body py-5 text-center text-muted small">Cargando leads...</div></div>
        ) : error ? (
          <div className="alert alert-danger small">Error: {error}</div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="card function-table">
            <EmptyState
              icon="filter"
              title="Sin resultados"
              description="No hay leads que coincidan con los filtros seleccionados. Probá con otros criterios."
            />
          </div>
        ) : (
          <div className="card function-table">
            <div className="card-body p-0">
              <div className="table-responsive" style={{ overflow: 'visible' }}>
                <table className="table table-hover dataTable mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input
                          type="checkbox"
                          className="custom-table-checkbox"
                          checked={leadsFiltrados.length > 0 && seleccionados.size === leadsFiltrados.length}
                          ref={(el) => { if (el) el.indeterminate = seleccionados.size > 0 && seleccionados.size < leadsFiltrados.length }}
                          onChange={toggleTodos}
                        />
                      </th>
                      <th>Cliente / Nombre</th>
                      <th>Ciudad</th>
                      <th style={{ width: 90 }}>Score</th>
                      <th>Web</th>
                      <th>Estado</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
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
                        onVerDetalle={setLeadDetalle}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginacion estilo Duralux */}
            {totalPaginas > 1 && (
              <div className="d-flex align-items-center justify-content-between px-4 py-3 border-top">
                <span className="text-muted" style={{ fontSize: 11 }}>
                  Mostrando {(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, leadsFiltrados.length)} de {leadsFiltrados.length}
                </span>
                <ul className="pagination-common-style d-flex gap-1 mb-0 list-unstyled">
                  <li>
                    <a href="#" onClick={e => { e.preventDefault(); setPagina(p => Math.max(1, p - 1)) }}
                      className={pagina === 1 ? 'disabled text-muted' : ''}>←</a>
                  </li>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                    <li key={n}>
                      <a href="#" onClick={e => { e.preventDefault(); setPagina(n) }}
                        className={pagina === n ? 'active' : ''}>
                        {n}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" onClick={e => { e.preventDefault(); setPagina(p => Math.min(totalPaginas, p + 1)) }}
                      className={pagina === totalPaginas ? 'disabled text-muted' : ''}>→</a>
                  </li>
                </ul>
              </div>
            )}
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

      {leadDetalle && (
        <LeadDetailOffcanvas
          lead={leadDetalle}
          onClose={() => setLeadDetalle(null)}
        />
      )}
    </>
  )
}
