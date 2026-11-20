import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiEdit3, FiTrash2, FiFileText, FiCheck, FiX, FiSend, FiSearch, FiTrendingUp, FiDollarSign, FiClock, FiAlertCircle, FiChevronDown, FiUserPlus, FiDownload } from 'react-icons/fi'
import { generarPdfPropuesta } from '../../utils/generarPdfPropuesta'
import {
  fetchPropuestas,
  crearPropuesta,
  actualizarPropuesta,
  eliminarPropuesta,
  fetchPropuestaStats,
  generarNumeroPropuesta,
} from '../../services/propuestasService'
import { fetchClientesCompletos } from '../../services/clientsService'
import { useToast } from '../../context/ToastProvider'
import ConfirmModal from '../../components/ConfirmModal'

// ─── constantes ───────────────────────────────────────────────────────────────

const ESTADOS = ['borrador', 'enviada', 'aceptada', 'rechazada']

const ESTADO_CFG = {
  borrador:  { label: 'Borrador',  bg: '#f5f5f5', color: '#0a0a0a', dot: '#0a0a0a' },
  enviada:   { label: 'Enviada',   bg: '#f5f5f5', color: '#ca8a04', dot: '#ca8a04' },
  aceptada:  { label: 'Aceptada', bg: '#f5f5f5', color: '#16a34a', dot: '#16a34a' },
  rechazada: { label: 'Rechazada',bg: '#f5f5f5', color: '#dc2626', dot: '#dc2626' },
}

const EMPTY_FORM = {
  numero: '', cliente_nombre: '', client_id: null, asunto: '', monto: '', moneda: 'ars', fecha: '', estado: 'borrador', notas: '',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatMonto(n) {
  const num = Number(n)
  if (!num) return '$ 0'
  return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function formatFecha(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

// ─── KPI banner ───────────────────────────────────────────────────────────────

function KpiBanner({ stats, montoAceptado, total }) {
  const pipeline = ['borrador', 'enviada'].reduce((s, k) => s + (stats[k] || 0), 0)
  const tasa = total > 0 ? Math.round((stats.aceptada / total) * 100) : 0

  return (
    <div
      className="card stretch stretch-full mb-4"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #374f65 100%)',
        border: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* decoración */}
      <div style={{
        position: 'absolute', right: -40, top: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,.04)',
      }} />
      <div style={{
        position: 'absolute', right: 60, bottom: -60,
        width: 150, height: 150, borderRadius: '50%',
        background: 'rgba(255,255,255,.03)',
      }} />

      <div className="card-body">
        <div className="row g-4 align-items-center">
          <div className="col-md-4">
            <p className="mb-1" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              Total cobrado
            </p>
            <h2 className="fw-bold mb-0 text-white" style={{ fontSize: 28 }}>
              {formatMonto(montoAceptado)}
            </h2>
            <p className="mb-0 mt-1" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>
              {stats.aceptada ?? 0} propuesta{stats.aceptada !== 1 ? 's' : ''} aceptada{stats.aceptada !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="col-md-8">
            <div className="row g-3">
              {[
                { label: 'Tasa de cierre', value: `${tasa}%`, icon: <FiTrendingUp size={16}/>, color: '#16a34a' },
                { label: 'En pipeline',    value: pipeline,    icon: <FiClock size={16}/>,     color: '#ca8a04' },
                { label: 'Rechazadas',     value: stats.rechazada ?? 0, icon: <FiAlertCircle size={16}/>, color: '#dc2626' },
                { label: 'Total',          value: total,       icon: <FiFileText size={16}/>,  color: '#ebebeb' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="col-6 col-md-3">
                  <div style={{
                    background: 'rgba(255,255,255,.08)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ color }}>{icon}</span>
                      <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, fontWeight: 600 }}>{label}</span>
                    </div>
                    <p className="fw-bold mb-0 text-white" style={{ fontSize: 20 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── badge de estado ──────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] ?? { label: estado, bg: '#f5f5f5', color: '#737373', dot: '#737373' }
  return (
    <span
      className="d-inline-flex align-items-center gap-1"
      style={{
        background: cfg.bg, color: cfg.color,
        borderRadius: 20, padding: '3px 10px',
        fontWeight: 600, fontSize: 11,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ─── modal crear / editar ─────────────────────────────────────────────────────

function ClienteCombobox({ value, clienteId, onChange, onClose: onCloseModal }) {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState(value || '')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    fetchClientesCompletos().then(({ data }) => setClientes(data ?? []))
  }, [])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtrados = busqueda.trim()
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : clientes

  const seleccionado = clientes.find(c => c.id === clienteId)

  function seleccionar(c) {
    onChange(c.nombre, c.id)
    setBusqueda(c.nombre)
    setAbierto(false)
  }

  function handleCrearCliente() {
    onCloseModal()
    navigate('/clientes')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className="form-control"
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); onChange('', null); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          placeholder="Buscá un cliente..."
          style={{ fontSize: 14, paddingRight: 32 }}
          autoComplete="off"
        />
        <FiChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
      </div>

      {abierto && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: '#fff', border: '1px solid #e0e4ef', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', marginTop: 4,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {filtrados.length === 0 ? (
            <div className="p-3 text-center">
              <p className="text-muted mb-2" style={{ fontSize: 13 }}>No encontramos "{busqueda}"</p>
              <button type="button" onClick={handleCrearCliente}
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto">
                <FiUserPlus size={13} /> Crear cliente nuevo
              </button>
            </div>
          ) : (
            <>
              {filtrados.map(c => (
                <button key={c.id} type="button" onClick={() => seleccionar(c)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 14px', border: 'none',
                    background: c.id === clienteId ? '#f5f5f5' : 'transparent',
                    cursor: 'pointer', fontSize: 13,
                    color: c.id === clienteId ? '#0a0a0a' : '#0a0a0a',
                  }}
                  onMouseEnter={e => { if (c.id !== clienteId) e.target.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { if (c.id !== clienteId) e.target.style.background = 'transparent' }}
                >
                  <span className="fw-semibold">{c.nombre}</span>
                  {c.rubro && <span className="text-muted ms-2" style={{ fontSize: 11 }}>{c.rubro}</span>}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #f0f2f7', padding: '6px 8px' }}>
                <button type="button" onClick={handleCrearCliente}
                  className="btn btn-sm w-100 d-flex align-items-center gap-1 justify-content-center text-muted"
                  style={{ fontSize: 12, background: 'transparent', border: 'none' }}>
                  <FiUserPlus size={12} /> Cliente no existe — crearlo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {seleccionado && (
        <p className="mt-1 mb-0" style={{ fontSize: 11, color: '#16a34a' }}>
          ✓ {seleccionado.nombre} {seleccionado.tipo === 'recurrente' ? '· Recurrente' : '· Puntual'}
        </p>
      )}
    </div>
  )
}

function PropuestaModal({ inicial, onClose, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState(inicial ?? EMPTY_FORM)
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!inicial?.id

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente_nombre.trim() || !form.asunto.trim()) return
    setGuardando(true)
    // Si por algún motivo el número no se generó, lo generamos ahora
    const numero = form.numero || await generarNumeroPropuesta()
    const campos = {
      numero,
      cliente_nombre: form.cliente_nombre.trim(),
      client_id:      form.client_id || null,
      asunto:         form.asunto.trim(),
      monto:          Number(form.monto) || 0,
      moneda:         form.moneda || 'ars',
      fecha:          form.fecha || new Date().toISOString().slice(0, 10),
      estado:         form.estado,
      notas:          form.notas.trim() || null,
    }
    if (esEdicion) {
      const { data, error } = await actualizarPropuesta(inicial.id, campos)
      if (error) { toast('Error al guardar', 'error'); setGuardando(false); return }
      onGuardado({ ...inicial, ...data })
      toast('Propuesta actualizada', 'success')
    } else {
      const { data, error } = await crearPropuesta(campos)
      if (error) { console.error('Supabase error:', error); toast(error.message || 'Error al crear', 'error'); setGuardando(false); return }
      onGuardado(data)
      toast('Propuesta creada', 'success')
    }
    onClose()
  }

  const estadoCfg = ESTADO_CFG[form.estado]

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1050, backdropFilter:'blur(3px)' }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width: 700, maxWidth:'calc(100vw - 32px)',
        background:'#fff', borderRadius:16,
        zIndex:1051, boxShadow:'0 24px 80px rgba(0,0,0,.22)',
        animation:'fadeScaleIn .15s ease',
        maxHeight:'90vh', overflowY:'auto',
      }}>
        <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>

        {/* Header con color según estado */}
        <div style={{
          background: esEdicion ? estadoCfg?.bg ?? '#f5f5f5' : '#f5f5f5',
          borderRadius:'16px 16px 0 0',
          padding:'20px 24px',
          borderBottom:'1px solid #eef0f4',
        }}>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: esEdicion ? estadoCfg?.color + '22' : '#e8f0ff',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: esEdicion ? estadoCfg?.color : '#0a0a0a',
              }}>
                <FiFileText size={18} />
              </div>
              <div>
                <h6 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>
                  {esEdicion ? `Editar ${inicial.numero}` : 'Nueva propuesta'}
                </h6>
                {esEdicion
                  ? <p className="mb-0 text-muted" style={{ fontSize:12 }}>{inicial.cliente_nombre}</p>
                  : <p className="mb-0 text-muted" style={{ fontSize:12 }}>El número se asigna automáticamente</p>
                }
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373', padding:4 }}>
              <FiX size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Fila compacta: datos rápidos */}
          <div className="px-4 py-3" style={{ background:'#f5f5f5', borderBottom:'1px solid #eef0f4' }}>
            <div className="row g-2">
              <div className="col-3">
                <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Número</label>
                <input className="form-control form-control-sm" value={form.numero} readOnly style={{ fontSize:13, background:'#eef0f6', color:'#737373', cursor:'default' }} />
              </div>
              <div className="col-3">
                <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Fecha</label>
                <input type="date" className="form-control form-control-sm" value={form.fecha} onChange={e => set('fecha', e.target.value)} style={{ fontSize:13 }} />
              </div>
              <div className="col-3">
                <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Monto</label>
                <div className="input-group input-group-sm">
                  <select className="input-group-text form-select" value={form.moneda || 'ars'} onChange={e => set('moneda', e.target.value)} style={{ fontSize:12, maxWidth:60, cursor:'pointer' }}>
                    <option value="ars">ARS</option>
                    <option value="usd">USD</option>
                  </select>
                  <input type="number" min="0" step="any" className="form-control" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0" style={{ fontSize:13 }} />
                </div>
              </div>
              <div className="col-3">
                <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Estado</label>
                <select className="form-select form-select-sm" value={form.estado} onChange={e => set('estado', e.target.value)} style={{ fontSize:13 }}>
                  {ESTADOS.map(s => <option key={s} value={s}>{ESTADO_CFG[s].label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Cliente + Asunto */}
          <div className="px-4 pt-3 pb-2">
            <div className="mb-3">
              <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Cliente *</label>
              <ClienteCombobox
                value={form.cliente_nombre}
                clienteId={form.client_id}
                onChange={(nombre, id) => setForm(f => ({ ...f, cliente_nombre: nombre, client_id: id }))}
                onClose={onClose}
              />
            </div>
            <div>
              <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Título del proyecto *</label>
              <input className="form-control" value={form.asunto} onChange={e => set('asunto', e.target.value)} placeholder="Ej: Desarrollo web + SEO" required style={{ fontSize:14 }} />
            </div>
          </div>

          {/* Alcance */}
          <div className="px-4 pb-3">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="form-label fw-semibold mb-0" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>Alcance del proyecto</label>
              <span className="text-muted" style={{ fontSize:10 }}>Las líneas en MAYÚSCULAS se muestran como títulos de sección en el PDF</span>
            </div>
            <textarea
              className="form-control"
              rows={9}
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              placeholder={`INCLUYE:\nDiseño en Figma (hasta 5 pantallas)\nDesarrollo frontend responsive\nFormulario de contacto\n\nNO INCLUYE:\nRedacción de contenidos\nFotografía`}
              style={{ fontSize:13, resize:'vertical', lineHeight:1.6, fontFamily:'inherit' }}
            />
          </div>

          <div className="d-flex gap-2 justify-content-end px-4 pb-4">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-4" disabled={guardando}>
              {guardando
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : esEdicion ? 'Guardar cambios' : 'Crear propuesta'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── fila de tabla ────────────────────────────────────────────────────────────

const ACTION_BTN = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:30, height:30, borderRadius:'50%',
  border:'1px solid #e8eaf0', background:'#fff',
  cursor:'pointer', flexShrink:0,
  transition:'all .15s',
}

// Colores de avatar por inicial
const AVATAR_COLORS = ['#0a0a0a','#16a34a','#ca8a04','#dc2626','#8b5cf6','#06b6d4','#ec4899']
function avatarColor(str) {
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function PropuestaRow({ p, onEditar, onEliminar, onCambiarEstado }) {
  const color = avatarColor(p.cliente_nombre)
  const inicial = (p.cliente_nombre[0] ?? '?').toUpperCase()

  return (
    <tr className="single-item chat-single-item" style={{ cursor:'default' }}>
      <td>
        <span className="fw-bold" style={{ color:'#0a0a0a', fontSize:13, letterSpacing:.3 }}>{p.numero}</span>
      </td>
      <td>
        <div className="d-flex align-items-center gap-2">
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background: color + '22', color,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:13, flexShrink:0,
          }}>
            {inicial}
          </div>
          <span className="fw-medium" style={{ fontSize:13, color:'#0a0a0a', maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {p.cliente_nombre}
          </span>
        </div>
      </td>
      <td style={{ maxWidth:200 }}>
        <span className="text-muted" style={{ fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', maxWidth:200 }}>
          {p.asunto}
        </span>
        {p.notas && (
          <span style={{ fontSize:11, color:'#a3a3a3' }}>{p.notas.slice(0,40)}{p.notas.length>40?'…':''}</span>
        )}
      </td>
      <td>
        <span className="fw-semibold" style={{ fontSize:13, color:'#0a0a0a' }}>{formatMonto(p.monto)}</span>
      </td>
      <td>
        <span className="text-muted" style={{ fontSize:13 }}>{formatFecha(p.fecha)}</span>
      </td>
      <td><EstadoBadge estado={p.estado} /></td>
      <td>
        <div className="d-flex align-items-center gap-1 justify-content-end">
          {p.estado === 'borrador' && (
            <button onClick={() => onCambiarEstado(p.id, 'enviada')} title="Marcar enviada"
              style={{ ...ACTION_BTN, color:'#ca8a04', borderColor:'#ebebeb' }}>
              <FiSend size={13} />
            </button>
          )}
          {p.estado === 'enviada' && (
            <button onClick={() => onCambiarEstado(p.id, 'aceptada')} title="Marcar aceptada"
              style={{ ...ACTION_BTN, color:'#16a34a', borderColor:'#ebebeb' }}>
              <FiCheck size={13} />
            </button>
          )}
          <button onClick={() => generarPdfPropuesta(p)} title="Descargar PDF"
            style={{ ...ACTION_BTN, color:'#0a0a0a', borderColor:'#ebebeb' }}>
            <FiDownload size={13} />
          </button>
          <button onClick={() => onEditar(p)} title="Editar"
            style={{ ...ACTION_BTN, color:'#737373' }}>
            <FiEdit3 size={13} />
          </button>
          <button onClick={() => onEliminar(p)} title="Eliminar"
            style={{ ...ACTION_BTN, color:'#dc2626', borderColor:'#ebebeb' }}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Propuestas() {
  const toast = useToast()
  const [propuestas, setPropuestas] = useState([])
  const [stats, setStats] = useState({ borrador: 0, enviada: 0, aceptada: 0, rechazada: 0 })
  const [montoAceptado, setMontoAceptado] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [modalForm, setModalForm] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  async function cargar() {
    setCargando(true)
    const [{ data }, { stats: s, montoAceptado: m }] = await Promise.all([
      fetchPropuestas(),
      fetchPropuestaStats(),
    ])
    setPropuestas(data)
    setStats(s)
    setMontoAceptado(m)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function handleNueva() {
    const numero = await generarNumeroPropuesta()
    setModalForm({ ...EMPTY_FORM, numero, fecha: new Date().toISOString().slice(0, 10) })
  }

  function handleGuardado(propuesta) {
    setPropuestas(prev => {
      const idx = prev.findIndex(p => p.id === propuesta.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = propuesta; return next }
      return [propuesta, ...prev]
    })
    fetchPropuestaStats().then(({ stats: s, montoAceptado: m }) => { setStats(s); setMontoAceptado(m) })
  }

  async function handleCambiarEstado(id, estado) {
    const { data, error } = await actualizarPropuesta(id, { estado })
    if (error) { toast('Error al actualizar', 'error'); return }
    handleGuardado(data)
    toast(`Marcada como ${ESTADO_CFG[estado].label.toLowerCase()}`, 'success')
  }

  async function handleEliminarConfirm() {
    setEliminando(true)
    const { error } = await eliminarPropuesta(confirmEliminar.id)
    if (error) { toast('Error al eliminar', 'error'); setEliminando(false); return }
    setPropuestas(prev => prev.filter(p => p.id !== confirmEliminar.id))
    fetchPropuestaStats().then(({ stats: s, montoAceptado: m }) => { setStats(s); setMontoAceptado(m) })
    toast('Propuesta eliminada', 'error')
    setConfirmEliminar(null)
    setEliminando(false)
  }

  const lista = useMemo(() => {
    let r = filtroEstado === 'todos' ? propuestas : propuestas.filter(p => p.estado === filtroEstado)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      r = r.filter(p =>
        p.cliente_nombre?.toLowerCase().includes(q) ||
        p.asunto?.toLowerCase().includes(q) ||
        p.numero?.toLowerCase().includes(q)
      )
    }
    return r
  }, [propuestas, filtroEstado, busqueda])

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>Propuestas</h5>
          <p className="text-muted mb-0" style={{ fontSize:13 }}>
            {propuestas.length} propuesta{propuestas.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleNueva} style={{ fontSize:13 }}>
          <FiPlus size={15} />
          Nueva propuesta
        </button>
      </div>

      {/* KPI banner */}
      {!cargando && <KpiBanner stats={stats} montoAceptado={montoAceptado} total={propuestas.length} />}

      {/* Tabla card */}
      <div className="card stretch stretch-full">
        {/* Toolbar */}
        <div className="card-header flex-wrap gap-3" style={{ alignItems:'center' }}>
          {/* Búsqueda */}
          <div className="position-relative" style={{ minWidth: 220 }}>
            <FiSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#a3a3a3' }} />
            <input
              className="form-control form-control-sm"
              placeholder="Buscar cliente, asunto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft:30, fontSize:13 }}
            />
          </div>

          {/* Filtros estado */}
          <div className="d-flex gap-1 flex-wrap ms-auto">
            {['todos', ...ESTADOS].map(e => {
              const activo = filtroEstado === e
              const cfg = e !== 'todos' ? ESTADO_CFG[e] : null
              return (
                <button
                  key={e}
                  onClick={() => setFiltroEstado(e)}
                  style={{
                    fontSize:12, padding:'4px 12px', borderRadius:20,
                    border: activo ? 'none' : '1px solid #e0e4ef',
                    background: activo ? (cfg?.color ?? '#0a0a0a') : '#fff',
                    color: activo ? '#fff' : '#737373',
                    fontWeight: activo ? 700 : 400,
                    cursor:'pointer',
                    transition:'all .15s',
                    display:'inline-flex', alignItems:'center', gap:5,
                  }}
                >
                  {e === 'todos' ? 'Todos' : cfg.label}
                  <span style={{
                    background: activo ? 'rgba(255,255,255,.25)' : '#f5f5f5',
                    color: activo ? '#fff' : '#737373',
                    borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700,
                  }}>
                    {e === 'todos' ? propuestas.length : stats[e] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card-body p-0">
          {cargando ? (
            <div className="text-center py-5">
              <span className="spinner-border text-primary" />
              <p className="text-muted mt-3 mb-0" style={{ fontSize:13 }}>Cargando propuestas...</p>
            </div>
          ) : lista.length === 0 ? (
            <div className="text-center py-5" style={{ padding:'60px 20px' }}>
              <div style={{
                width:64, height:64, borderRadius:16,
                background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 16px', color:'#0a0a0a',
              }}>
                <FiFileText size={28} />
              </div>
              <h6 className="fw-bold mb-1" style={{ color:'#0a0a0a' }}>
                {busqueda ? 'Sin resultados' : filtroEstado === 'todos' ? 'Todavía no hay propuestas' : `Sin propuestas ${ESTADO_CFG[filtroEstado]?.label?.toLowerCase()}`}
              </h6>
              <p className="text-muted mb-3" style={{ fontSize:13 }}>
                {busqueda ? 'Probá con otro término de búsqueda.' : 'Creá tu primera propuesta para empezar a trackear el pipeline.'}
              </p>
              {!busqueda && filtroEstado === 'todos' && (
                <button className="btn btn-primary btn-sm" onClick={handleNueva}>
                  <FiPlus size={14} className="me-1" />
                  Crear primera propuesta
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table function-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width:100 }}>Número</th>
                    <th>Cliente</th>
                    <th>Asunto</th>
                    <th style={{ width:140 }}>Monto</th>
                    <th style={{ width:100 }}>Fecha</th>
                    <th style={{ width:120 }}>Estado</th>
                    <th style={{ width:110 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(p => (
                    <PropuestaRow
                      key={p.id}
                      p={p}
                      onEditar={setModalForm}
                      onEliminar={setConfirmEliminar}
                      onCambiarEstado={handleCambiarEstado}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {lista.length > 0 && (
          <div className="card-footer d-flex align-items-center justify-content-between" style={{ fontSize:12, color:'#a3a3a3' }}>
            <span>Mostrando {lista.length} de {propuestas.length}</span>
            <span>
              Pipeline activo: <strong style={{ color:'#0a0a0a' }}>{formatMonto(
                propuestas.filter(p => ['borrador','enviada'].includes(p.estado)).reduce((s,p) => s + Number(p.monto), 0)
              )}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modalForm && (
        <PropuestaModal
          inicial={modalForm?.id ? modalForm : null}
          onClose={() => setModalForm(null)}
          onGuardado={handleGuardado}
        />
      )}

      {/* Confirm eliminar */}
      {confirmEliminar && (
        <ConfirmModal
          title="Eliminar propuesta"
          message={`¿Eliminás la propuesta ${confirmEliminar.numero} de ${confirmEliminar.cliente_nombre}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={handleEliminarConfirm}
          onCancel={() => setConfirmEliminar(null)}
        />
      )}
    </div>
  )
}
