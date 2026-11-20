import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPlus, FiUsers, FiRepeat, FiAlertTriangle, FiDollarSign, FiEdit3, FiTrash2, FiExternalLink } from 'react-icons/fi'
import { fetchClientesCompletos, eliminarCliente } from '../../services/clientsService'
import { useToast } from '../../context/ToastProvider'
import ModalCliente from './ModalCliente'
import ConfirmModal from '../../components/ConfirmModal'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatARS(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

function diasHasta(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, progressN = 1 }) {
  return (
    <div className="col-xl-3 col-md-6">
      <div className="card stretch stretch-full short-info-card h-100">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="avatar-text avatar-lg bg-gray-200 icon" style={{ color }}>{icon}</div>
            <div>
              <div className="fs-4 fw-bold text-dark">{value}</div>
              <p className="fs-13 fw-semibold text-muted mb-0">{label}</p>
            </div>
          </div>
          <div className="progress ht-3">
            <div className={`progress-bar progress-${progressN}`} style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── fila simplificada ────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#0a0a0a','#16a34a','#ca8a04','#dc2626','#8b5cf6','#06b6d4','#ec4899']
function avatarColor(str) {
  let h = 0; for (const c of (str||'')) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const ACTION_BTN = {
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:30, height:30, borderRadius:'50%',
  border:'1px solid #e8eaf0', background:'#fff',
  cursor:'pointer', flexShrink:0,
}

function FilaCliente({ cliente, onEditar, onEliminar }) {
  const navigate = useNavigate()
  const cobros = cliente.cobros ?? []
  const pendienteARS = cobros.filter(c => !c.pagado && c.moneda === 'ars').reduce((s,c) => s + c.monto, 0)
  const pendienteUSD = cobros.filter(c => !c.pagado && c.moneda === 'usd').reduce((s,c) => s + c.monto, 0)
  const proxVenc = cobros.filter(c => !c.pagado && c.fecha_vencimiento).sort((a,b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))[0]
  const dias = diasHasta(proxVenc?.fecha_vencimiento)
  const color = avatarColor(cliente.nombre)
  const inicial = (cliente.nombre?.[0] ?? '?').toUpperCase()

  return (
    <tr className="single-item chat-single-item">
      {/* Cliente */}
      <td>
        <div className="d-flex align-items-center gap-3">
          <div style={{ width:36, height:36, borderRadius:'50%', background: color+'22', color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
            {inicial}
          </div>
          <div>
            <button
              onClick={() => navigate(`/clientes/${cliente.id}`)}
              style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontWeight:600, fontSize:14, color:'#0a0a0a', textAlign:'left' }}
            >
              {cliente.nombre}
            </button>
            {cliente.rubro && <p className="mb-0 text-muted" style={{ fontSize:11 }}>{cliente.rubro}</p>}
          </div>
        </div>
      </td>

      {/* Tipo */}
      <td>
        {cliente.tipo === 'recurrente'
          ? <span className="badge bg-light-success text-success" style={{ fontSize:11 }}><FiRepeat size={10} className="me-1" />Recurrente</span>
          : <span className="badge bg-light-secondary text-secondary" style={{ fontSize:11 }}>Puntual</span>
        }
      </td>

      {/* Ciudad */}
      <td className="text-muted" style={{ fontSize:13 }}>{cliente.ciudad || '—'}</td>

      {/* Pendiente */}
      <td>
        {pendienteARS > 0 && <p className="fw-semibold mb-0 text-warning" style={{ fontSize:13 }}>{formatARS(pendienteARS)}</p>}
        {pendienteUSD > 0 && <p className="fw-semibold mb-0 text-primary" style={{ fontSize:13 }}>U$D {pendienteUSD.toFixed(0)}</p>}
        {pendienteARS === 0 && pendienteUSD === 0 && <span className="badge bg-light-success text-success" style={{ fontSize:11 }}>Al día</span>}
      </td>

      {/* Próx vencimiento */}
      <td>
        {proxVenc && dias !== null ? (
          <span className={`badge ${dias < 0 ? 'bg-light-danger text-danger' : dias <= 7 ? 'bg-light-warning text-warning' : 'bg-light-secondary text-secondary'}`} style={{ fontSize:11 }}>
            {dias < 0 ? `Vencido ${Math.abs(dias)}d` : dias === 0 ? 'Hoy' : `${dias}d`}
          </span>
        ) : <span className="text-muted" style={{ fontSize:13 }}>—</span>}
      </td>

      {/* Acciones */}
      <td>
        <div className="d-flex align-items-center gap-1 justify-content-end">
          <button onClick={() => navigate(`/clientes/${cliente.id}`)} style={{ ...ACTION_BTN, color:'#0a0a0a', borderColor:'#ebebeb' }} title="Ver detalle">
            <FiExternalLink size={13} />
          </button>
          <button onClick={() => onEditar(cliente)} style={{ ...ACTION_BTN, color:'#737373' }} title="Editar">
            <FiEdit3 size={13} />
          </button>
          <button onClick={() => onEliminar(cliente)} style={{ ...ACTION_BTN, color:'#dc2626', borderColor:'#ebebeb' }} title="Eliminar">
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function Clientes() {
  const toast = useToast()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCliente, setModalCliente] = useState(null)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    fetchClientesCompletos().then(({ data }) => { setClientes(data ?? []); setLoading(false) })
  }, [])

  function handleClienteGuardado(c) {
    setClientes(prev => {
      const idx = prev.findIndex(x => x.id === c.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...prev[idx], ...c }; return n }
      return [c, ...prev]
    })
    setModalCliente(null)
  }

  async function handleEliminarConfirm() {
    setEliminando(true)
    const { error } = await eliminarCliente(confirmEliminar.id)
    if (error) { toast('Error al eliminar', 'error') }
    else { setClientes(prev => prev.filter(c => c.id !== confirmEliminar.id)); toast('Cliente eliminado', 'error') }
    setConfirmEliminar(null)
    setEliminando(false)
  }

  const lista = filtro === 'todos' ? clientes : clientes.filter(c => c.tipo === filtro)
  const cobrosFlat = clientes.flatMap(c => c.cobros ?? [])
  const pendienteARS = cobrosFlat.filter(c => !c.pagado && c.moneda === 'ars').reduce((s,c) => s + c.monto, 0)
  const pendienteUSD = cobrosFlat.filter(c => !c.pagado && c.moneda === 'usd').reduce((s,c) => s + c.monto, 0)
  const recurrentes = clientes.filter(c => c.tipo === 'recurrente').length

  const vencHoy = cobrosFlat.filter(c => {
    if (c.pagado || !c.fecha_vencimiento) return false
    return diasHasta(c.fecha_vencimiento) !== null && diasHasta(c.fecha_vencimiento) <= 7
  }).length

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>Clientes</h5>
          <p className="text-muted mb-0" style={{ fontSize:13 }}>{clientes.length} clientes en total</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" style={{ fontSize:13 }} onClick={() => setModalCliente({})}>
          <FiPlus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <StatCard icon={<FiUsers size={18}/>}         label="Total clientes"     value={clientes.length}  color="#0a0a0a" progressN={1} />
        <StatCard icon={<FiRepeat size={18}/>}         label="Recurrentes"        value={recurrentes}      color="#16a34a" progressN={2} />
        <StatCard icon={<FiDollarSign size={18}/>}     label="Pendiente ARS"      value={formatARS(pendienteARS)} color="#ca8a04" progressN={3} />
        <StatCard icon={<FiAlertTriangle size={18}/>}  label="Vencen esta semana" value={vencHoy}          color="#dc2626" progressN={4} />
      </div>

      {/* Tabla */}
      <div className="card stretch stretch-full">
        <div className="card-header d-flex align-items-center gap-3 flex-wrap justify-content-between">
          <h6 className="card-title mb-0">Listado</h6>
          <div className="d-flex gap-1">
            {[['todos','Todos'], ['recurrente','Recurrentes'], ['puntual','Puntuales']].map(([val, label]) => (
              <button key={val} onClick={() => setFiltro(val)}
                className={`btn btn-sm ${filtro === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize:12, borderRadius:20, padding:'3px 12px' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
          ) : lista.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiUsers size={36} className="mb-3 opacity-50 d-block mx-auto" />
              <p className="fw-semibold mb-1">No hay clientes todavía</p>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setModalCliente({})}>
                Crear primer cliente
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table function-table mb-0">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th style={{ width:110 }}>Tipo</th>
                    <th style={{ width:120 }}>Ciudad</th>
                    <th style={{ width:160 }}>Pendiente</th>
                    <th style={{ width:120 }}>Próx. venc.</th>
                    <th style={{ width:100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => (
                    <FilaCliente key={c.id} cliente={c} onEditar={c => setModalCliente({ cliente: c })} onEliminar={setConfirmEliminar} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalCliente !== null && (
        <ModalCliente
          clienteInicial={modalCliente?.cliente ?? null}
          onClose={() => setModalCliente(null)}
          onGuardado={handleClienteGuardado}
        />
      )}

      {confirmEliminar && (
        <ConfirmModal
          title="Eliminar cliente"
          message={`¿Eliminás a "${confirmEliminar.nombre}"? Se borrarán también sus servicios y cobros.`}
          confirmLabel="Eliminar"
          loading={eliminando}
          onConfirm={handleEliminarConfirm}
          onCancel={() => setConfirmEliminar(null)}
        />
      )}
    </div>
  )
}
