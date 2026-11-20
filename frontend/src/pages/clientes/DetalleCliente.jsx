import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FiArrowLeft, FiEdit3, FiSave, FiX, FiPlus, FiTrash2,
  FiCheck, FiDollarSign, FiInfo, FiFileText, FiMessageSquare,
  FiRepeat, FiSend, FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi'
import { fetchClienteCompleto, actualizarCliente, fetchClientNotes, addClientNote, deleteClientNote } from '../../services/clientsService'
import { fetchServiciosDeCliente, crearServicio, actualizarServicio, eliminarServicio, FRECUENCIAS, FRECUENCIA_LABEL } from '../../services/serviciosService'
import { fetchCobrosDeCliente, crearCobro, eliminarCobro, marcarPagado, desmarcarPagado, cobroDesdeServicio } from '../../services/cobrosService'
import { fetchPropuestasByCliente } from '../../services/propuestasService'
import { useToast } from '../../context/ToastProvider'
import ConfirmModal from '../../components/ConfirmModal'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n) { return Number(n).toLocaleString('es-AR', { style:'currency', currency:'ARS', minimumFractionDigits:0 }) }
function fmtUSD(n) { return `U$D ${Number(n).toLocaleString('es-AR', { minimumFractionDigits:0 })}` }
function fmtMonto(m, moneda) { return moneda === 'usd' ? fmtUSD(m) : fmtARS(m) }

function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff/86400)} días`
  return fmtFecha(iso.slice(0, 10))
}

function diasHasta(iso) {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

const AVATAR_COLORS = ['#0a0a0a','#16a34a','#ca8a04','#dc2626','#8b5cf6','#06b6d4','#ec4899']
function avatarColor(str) {
  let h = 0; for (const c of (str||'')) h = (h*31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const ESTADO_PROP = {
  borrador:  { label:'Borrador',  bg:'#f5f5f5', color:'#0a0a0a' },
  enviada:   { label:'Enviada',   bg:'#f5f5f5', color:'#ca8a04' },
  aceptada:  { label:'Aceptada', bg:'#f5f5f5', color:'#16a34a' },
  rechazada: { label:'Rechazada',bg:'#f5f5f5', color:'#dc2626' },
}

// ─── tab nav ──────────────────────────────────────────────────────────────────

function TabNav({ tabs, activo, setActivo }) {
  return (
    <div className="d-flex gap-1 mb-4 p-1 rounded-3" style={{ background:'#f5f5f5', width:'fit-content' }}>
      {tabs.map(({ key, label, icon, badge }) => (
        <button
          key={key}
          onClick={() => setActivo(key)}
          className="d-flex align-items-center gap-2"
          style={{
            border: 'none', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: activo===key ? 600 : 400,
            background: activo===key ? '#fff' : 'transparent',
            color: activo===key ? '#0a0a0a' : '#737373',
            cursor: 'pointer',
            boxShadow: activo===key ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
            transition: 'all .15s',
          }}
        >
          <span style={{ color: activo===key ? '#0a0a0a' : '#a3a3a3' }}>{icon}</span>
          {label}
          {badge != null && badge > 0 && (
            <span style={{
              background: activo===key ? '#0a0a0a' : '#dde1ec',
              color: activo===key ? '#fff' : '#737373',
              borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700,
            }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB INFO
// ═══════════════════════════════════════════════════════════════════════════════

function TabInfo({ cliente, onActualizado }) {
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre: cliente.nombre??'', rubro: cliente.rubro??'', ciudad: cliente.ciudad??'',
    email: cliente.email??'', telefono: cliente.telefono??'', instagram: cliente.instagram??'',
    cuit: cliente.cuit??'', direccion: cliente.direccion??'', condicion_iva: cliente.condicion_iva??'',
    web: cliente.web??'', url_sitio_entregado: cliente.url_sitio_entregado??'',
    notas: cliente.notas??'',
  })
  const [guardando, setGuardando] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleGuardar() {
    setGuardando(true)
    const { error } = await actualizarCliente(cliente.id, form)
    if (error) { toast('Error al guardar', 'error') }
    else { onActualizado(form); setEditando(false); toast('Guardado', 'success') }
    setGuardando(false)
  }

  const F = ({ label, campo, type='text', placeholder='' }) => (
    <div>
      <p className="mb-1 fw-semibold" style={{ fontSize:11, color:'#a3a3a3', textTransform:'uppercase', letterSpacing:.5 }}>{label}</p>
      {editando
        ? <input type={type} className="form-control form-control-sm" value={form[campo]} onChange={e => set(campo, e.target.value)} placeholder={placeholder} style={{ fontSize:14 }} />
        : <p className="mb-0" style={{ fontSize:14, color: form[campo] ? '#0a0a0a' : '#a3a3a3' }}>{form[campo] || '—'}</p>
      }
    </div>
  )

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        {editando ? (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditando(false)}><FiX size={13} className="me-1"/>Cancelar</button>
            <button className="btn btn-primary btn-sm" onClick={handleGuardar} disabled={guardando}>
              {guardando ? <span className="spinner-border spinner-border-sm me-1" /> : <FiSave size={13} className="me-1"/>}Guardar
            </button>
          </div>
        ) : (
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditando(true)}><FiEdit3 size={13} className="me-1"/>Editar</button>
        )}
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header"><h6 className="card-title mb-0 fs-13">Contacto</h6></div>
            <div className="card-body d-flex flex-column gap-3">
              <F label="Nombre" campo="nombre" />
              <F label="Rubro" campo="rubro" />
              <F label="Ciudad" campo="ciudad" />
              <F label="Email" campo="email" type="email" />
              <F label="Teléfono" campo="telefono" />
              <div>
                <p className="mb-1 fw-semibold" style={{ fontSize:11, color:'#a3a3a3', textTransform:'uppercase', letterSpacing:.5 }}>Instagram</p>
                {editando
                  ? <div className="input-group input-group-sm"><span className="input-group-text">@</span><input className="form-control" value={form.instagram} onChange={e => set('instagram', e.target.value)} style={{ fontSize:14 }} /></div>
                  : form.instagram
                    ? <a href={`https://instagram.com/${form.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:14 }}>@{form.instagram}</a>
                    : <p className="mb-0 text-muted" style={{ fontSize:14 }}>—</p>
                }
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header"><h6 className="card-title mb-0 fs-13">Facturación</h6></div>
            <div className="card-body d-flex flex-column gap-3">
              <F label="CUIT / CUIL" campo="cuit" placeholder="20-12345678-9" />
              <F label="Dirección fiscal" campo="direccion" />
              <F label="Condición IVA" campo="condicion_iva" />
              <F label="Web / URL sitio" campo="url_sitio_entregado" type="url" />
              <div>
                <p className="mb-1 fw-semibold" style={{ fontSize:11, color:'#a3a3a3', textTransform:'uppercase', letterSpacing:.5 }}>Notas</p>
                {editando
                  ? <textarea className="form-control form-control-sm" rows={3} value={form.notas} onChange={e => set('notas', e.target.value)} style={{ fontSize:14, resize:'none' }} />
                  : <p className="mb-0" style={{ fontSize:14, color: form.notas ? '#0a0a0a' : '#a3a3a3', whiteSpace:'pre-wrap' }}>{form.notas || '—'}</p>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB SERVICIOS
// ═══════════════════════════════════════════════════════════════════════════════

const SERVICIO_VACIO = { nombre:'', descripcion:'', tipo:'recurrente', frecuencia:'mensual', monto:'', moneda:'ars', activo:true }

function ModalServicio({ clientId, inicial, onClose, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState(inicial ?? { ...SERVICIO_VACIO })
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!inicial?.id

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.monto) return
    setGuardando(true)
    const payload = { ...form, client_id: clientId, monto: Number(form.monto), frecuencia: form.tipo==='unico' ? null : form.frecuencia }
    if (esEdicion) {
      const { data, error } = await actualizarServicio(inicial.id, payload)
      if (error) { toast('Error', 'error'); setGuardando(false); return }
      onGuardado(data)
    } else {
      const { data, error } = await crearServicio(payload)
      if (error) { toast('Error', 'error'); setGuardando(false); return }
      onGuardado(data)
    }
    toast(esEdicion ? 'Servicio actualizado' : 'Servicio creado', 'success')
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1060, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:460, maxWidth:'calc(100vw - 32px)', background:'#fff', borderRadius:14, zIndex:1061, boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'fadeScaleIn .15s ease' }}>
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <h6 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>{esEdicion ? 'Editar servicio' : 'Nuevo servicio'}</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373' }}><FiX size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label fw-semibold" style={{ fontSize:12 }}>Nombre *</label>
              <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Mantenimiento web mensual" style={{ fontSize:14 }} />
            </div>
            <div>
              <label className="form-label fw-semibold" style={{ fontSize:12 }}>Tipo</label>
              <div className="d-flex gap-2">
                {[['recurrente','Recurrente'],['unico','Único']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('tipo', v)}
                    style={{ flex:1, border: form.tipo===v ? '2px solid #0a0a0a' : '1px solid #e0e4ef', borderRadius:8, padding:'8px', background: form.tipo===v ? '#f5f5f5' : '#fff', cursor:'pointer', fontSize:13, fontWeight: form.tipo===v?700:400, color: form.tipo===v?'#0a0a0a':'#737373' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {form.tipo === 'recurrente' && (
              <div>
                <label className="form-label fw-semibold" style={{ fontSize:12 }}>Frecuencia</label>
                <select className="form-select" value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)} style={{ fontSize:14 }}>
                  {FRECUENCIAS.map(f => <option key={f} value={f}>{FRECUENCIA_LABEL[f]}</option>)}
                </select>
              </div>
            )}
            <div className="row g-2">
              <div className="col-8">
                <label className="form-label fw-semibold" style={{ fontSize:12 }}>Monto *</label>
                <input type="number" min="0" required className="form-control" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0" style={{ fontSize:14 }} />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold" style={{ fontSize:12 }}>Moneda</label>
                <select className="form-select" value={form.moneda} onChange={e => set('moneda', e.target.value)} style={{ fontSize:14 }}>
                  <option value="ars">ARS $</option>
                  <option value="usd">USD U$D</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label fw-semibold" style={{ fontSize:12 }}>Descripción</label>
              <textarea className="form-control" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalle opcional..." style={{ fontSize:14, resize:'none' }} />
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-4">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
              {guardando ? <span className="spinner-border spinner-border-sm me-1" /> : null}
              {esEdicion ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function TabServicios({ clientId, onGenerarCobro }) {
  const toast = useToast()
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchServiciosDeCliente(clientId).then(({ data }) => { setServicios(data); setCargando(false) })
  }, [clientId])

  function onGuardado(s) {
    setServicios(prev => {
      const idx = prev.findIndex(x => x.id === s.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n }
      return [s, ...prev]
    })
  }

  async function handleEliminar(id) {
    await eliminarServicio(id)
    setServicios(prev => prev.filter(s => s.id !== id))
    setConfirmId(null)
    toast('Servicio eliminado', 'error')
  }

  if (cargando) return <div className="text-center py-4"><span className="spinner-border text-primary" /></div>

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setModal({})}>
          <FiPlus size={14} /> Agregar servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FiRepeat size={36} className="mb-3 opacity-50 d-block mx-auto" />
          <p className="fw-semibold mb-1">No hay servicios asignados</p>
          <p style={{ fontSize:13 }}>Agregá un servicio para poder generar cobros desde él.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>Agregar servicio</button>
        </div>
      ) : (
        <div className="row g-3">
          {servicios.map(s => (
            <div key={s.id} className="col-md-6">
              <div className="card h-100" style={{ border: s.activo ? '1px solid #e8eaf0' : '1px solid #f0f0f0', opacity: s.activo ? 1 : .6 }}>
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <p className="fw-bold mb-0" style={{ fontSize:14, color:'#0a0a0a' }}>{s.nombre}</p>
                      {s.descripcion && <p className="text-muted mb-0" style={{ fontSize:12 }}>{s.descripcion}</p>}
                    </div>
                    <div className="d-flex gap-1">
                      <button onClick={() => setModal(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373', padding:4 }}><FiEdit3 size={13} /></button>
                      <button onClick={() => setConfirmId(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4 }}><FiTrash2 size={13} /></button>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
                    <span className={`badge ${s.tipo === 'recurrente' ? 'bg-light-success text-success' : 'bg-light-secondary text-secondary'}`} style={{ fontSize:11 }}>
                      {s.tipo === 'recurrente' ? <><FiRepeat size={9} className="me-1"/>{FRECUENCIA_LABEL[s.frecuencia]}</> : 'Pago único'}
                    </span>
                    <span className="badge bg-light-primary text-primary" style={{ fontSize:11 }}>{s.moneda.toUpperCase()}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <p className="fw-bold mb-0" style={{ fontSize:18, color: s.moneda==='usd' ? '#0a0a0a' : '#16a34a' }}>
                      {fmtMonto(s.monto, s.moneda)}
                    </p>
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      style={{ fontSize:12 }}
                      onClick={() => onGenerarCobro(s)}
                    >
                      <FiDollarSign size={12} /> Cobrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalServicio clientId={clientId} inicial={modal?.id ? modal : null} onClose={() => setModal(null)} onGuardado={onGuardado} />
      )}
      {confirmId && (
        <ConfirmModal title="Eliminar servicio" message="¿Eliminás este servicio?" confirmLabel="Eliminar" onConfirm={() => handleEliminar(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB COBROS
// ═══════════════════════════════════════════════════════════════════════════════

function ModalPagarCobro({ cobro, clienteNombre, onClose, onPagado }) {
  const toast = useToast()
  const [tipoCambio, setTipoCambio] = useState('')
  const [loadingTC, setLoadingTC] = useState(false)
  const [pagando, setPagando] = useState(false)
  const esUSD = cobro.moneda === 'usd'
  const montoArs = esUSD && tipoCambio ? cobro.monto * Number(tipoCambio) : null

  // Auto-fetch dólar oficial al abrir si es USD
  useEffect(() => {
    if (!esUSD) return
    setLoadingTC(true)
    fetch('https://dolarapi.com/v1/dolares/oficial')
      .then(r => r.json())
      .then(d => { if (d?.venta) setTipoCambio(String(d.venta)) })
      .catch(() => {}) // silencioso si falla
      .finally(() => setLoadingTC(false))
  }, [esUSD])

  async function handlePagar() {
    if (esUSD && !tipoCambio) return
    setPagando(true)
    const { data, error } = await marcarPagado(cobro, clienteNombre, {
      tipo_cambio: esUSD ? Number(tipoCambio) : null,
      monto_ars: montoArs,
    })
    if (error) { toast('Error al registrar pago', 'error'); setPagando(false); return }
    onPagado(data)
    toast('¡Cobro registrado! Se creó el ingreso en Casa.', 'success')
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1060, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, maxWidth:'calc(100vw - 32px)', background:'#fff', borderRadius:14, zIndex:1061, boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'fadeScaleIn .15s ease' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>Registrar cobro</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373' }}><FiX size={16} /></button>
        </div>
        <div className="p-4">
          <div className="rounded p-3 mb-4" style={{ background:'#f5f5f5', border:'1px solid #e8eaf0' }}>
            <p className="text-muted mb-1" style={{ fontSize:12 }}>{cobro.descripcion}</p>
            <p className="fw-bold mb-0" style={{ fontSize:22, color: esUSD ? '#0a0a0a' : '#16a34a' }}>{fmtMonto(cobro.monto, cobro.moneda)}</p>
          </div>

          {esUSD && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label fw-semibold mb-0" style={{ fontSize:13 }}>Tipo de cambio (ARS por USD) *</label>
                {loadingTC
                  ? <span className="text-muted" style={{ fontSize:11 }}>Obteniendo dólar oficial…</span>
                  : tipoCambio
                    ? <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>✓ Dólar oficial</span>
                    : null
                }
              </div>
              <div className="input-group">
                <span className="input-group-text" style={{ fontSize:13 }}>$ ARS</span>
                <input type="number" min="1" className="form-control" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)} placeholder="Ej: 1050" style={{ fontSize:14 }} disabled={loadingTC} />
              </div>
              {montoArs && <p className="mt-2 mb-0 text-muted" style={{ fontSize:13 }}>= {fmtARS(montoArs)} en pesos</p>}
            </div>
          )}

          <p className="text-muted mb-4" style={{ fontSize:13 }}>
            Al confirmar se registrará automáticamente como <strong>ingreso en Finanzas Casa</strong>.
          </p>

          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn-success btn-sm d-flex align-items-center gap-2" onClick={handlePagar} disabled={pagando || (esUSD && !tipoCambio)}>
              {pagando ? <span className="spinner-border spinner-border-sm" /> : <FiCheck size={14} />}
              Confirmar cobro
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function TabCobros({ clientId, clienteNombre, cobroInicial }) {
  const toast = useToast()
  const [cobros, setCobros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalNuevo, setModalNuevo] = useState(null)
  const [modalPagar, setModalPagar] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    fetchCobrosDeCliente(clientId).then(({ data }) => { setCobros(data); setCargando(false) })
  }, [clientId])

  // Si se dispara un cobro desde tab Servicios, lo abrimos
  useEffect(() => {
    if (cobroInicial) setModalNuevo(cobroInicial)
  }, [cobroInicial])

  async function handleCrearCobro(form) {
    const { data, error } = await crearCobro(form)
    if (error) { toast('Error', 'error'); return }
    setCobros(prev => [data, ...prev])
    setModalNuevo(null)
    toast('Cobro generado', 'success')
  }

  function onPagado(cobroActualizado) {
    setCobros(prev => prev.map(c => c.id === cobroActualizado.id ? cobroActualizado : c))
    setModalPagar(null)
  }

  async function handleDesmarcar(cobro) {
    const { data } = await desmarcarPagado(cobro)
    if (data) setCobros(prev => prev.map(c => c.id === data.id ? data : c))
    toast('Marcado como pendiente', 'success')
  }

  async function handleEliminar(id) {
    await eliminarCobro(id)
    setCobros(prev => prev.filter(c => c.id !== id))
    setConfirmId(null)
    toast('Cobro eliminado', 'error')
  }

  const pendientes = cobros.filter(c => !c.pagado)
  const cobrados = cobros.filter(c => c.pagado)
  const totalPendienteARS = pendientes.filter(c => c.moneda==='ars').reduce((s,c) => s+c.monto, 0)
  const totalPendienteUSD = pendientes.filter(c => c.moneda==='usd').reduce((s,c) => s+c.monto, 0)

  if (cargando) return <div className="text-center py-4"><span className="spinner-border text-primary" /></div>

  return (
    <div>
      {/* Resumen + nuevo */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <div className="d-flex gap-3 flex-wrap">
          {totalPendienteARS > 0 && (
            <div className="rounded px-3 py-2" style={{ background:'#f5f5f5', border:'1px solid #ebebeb' }}>
              <p className="mb-0 fw-bold" style={{ color:'#ca8a04', fontSize:16 }}>{fmtARS(totalPendienteARS)}</p>
              <p className="mb-0 text-muted" style={{ fontSize:11 }}>pendiente ARS</p>
            </div>
          )}
          {totalPendienteUSD > 0 && (
            <div className="rounded px-3 py-2" style={{ background:'#f5f5f5', border:'1px solid #ebebeb' }}>
              <p className="mb-0 fw-bold" style={{ color:'#0a0a0a', fontSize:16 }}>{fmtUSD(totalPendienteUSD)}</p>
              <p className="mb-0 text-muted" style={{ fontSize:11 }}>pendiente USD</p>
            </div>
          )}
          {pendientes.length === 0 && cobros.length > 0 && (
            <span className="badge bg-light-success text-success align-self-center" style={{ fontSize:12 }}><FiCheck size={11} className="me-1"/>Al día</span>
          )}
        </div>
        <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={() => setModalNuevo({ client_id:clientId, descripcion:'', monto:'', moneda:'ars', fecha_vencimiento:'', pagado:false })}>
          <FiPlus size={14} /> Nuevo cobro
        </button>
      </div>

      {cobros.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FiDollarSign size={36} className="mb-3 opacity-50 d-block mx-auto" />
          <p className="fw-semibold mb-1">No hay cobros registrados</p>
          <p style={{ fontSize:13 }}>Generá cobros desde los servicios o creá uno manual.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table function-table mb-0">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style={{ width:120 }}>Monto</th>
                  <th style={{ width:110 }}>Vencimiento</th>
                  <th style={{ width:110 }}>Estado</th>
                  <th style={{ width:130 }}>Cobrado</th>
                  <th style={{ width:100 }}></th>
                </tr>
              </thead>
              <tbody>
                {cobros.map(c => {
                  const dias = diasHasta(c.fecha_vencimiento)
                  return (
                    <tr key={c.id} className="single-item">
                      <td>
                        <p className="fw-medium mb-0" style={{ fontSize:13, color:'#0a0a0a' }}>{c.descripcion}</p>
                        {c.servicios?.nombre && <p className="mb-0 text-muted" style={{ fontSize:11 }}>{c.servicios.nombre}</p>}
                      </td>
                      <td className="fw-semibold" style={{ fontSize:13, color: c.moneda==='usd' ? '#0a0a0a' : '#0a0a0a' }}>
                        {fmtMonto(c.monto, c.moneda)}
                        {c.monto_ars && c.moneda==='usd' && <p className="mb-0 text-muted" style={{ fontSize:11 }}>{fmtARS(c.monto_ars)}</p>}
                      </td>
                      <td>
                        {c.fecha_vencimiento ? (
                          <span className={`badge ${!c.pagado && dias !== null && dias < 0 ? 'bg-light-danger text-danger' : !c.pagado && dias !== null && dias <= 7 ? 'bg-light-warning text-warning' : 'bg-light-secondary text-secondary'}`} style={{ fontSize:11 }}>
                            {fmtFecha(c.fecha_vencimiento)}
                          </span>
                        ) : <span className="text-muted" style={{ fontSize:13 }}>—</span>}
                      </td>
                      <td>
                        {c.pagado
                          ? <span className="badge bg-light-success text-success" style={{ fontSize:11 }}><FiCheck size={10} className="me-1"/>Cobrado</span>
                          : <span className="badge bg-light-warning text-warning" style={{ fontSize:11 }}>Pendiente</span>
                        }
                      </td>
                      <td style={{ fontSize:12, color:'#a3a3a3' }}>
                        {c.pagado ? fmtFecha(c.fecha_cobro) : '—'}
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          {!c.pagado && (
                            <button onClick={() => setModalPagar(c)}
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              style={{ fontSize:11, padding:'3px 8px' }}>
                              <FiCheck size={11} /> Cobrar
                            </button>
                          )}
                          {c.pagado && (
                            <button onClick={() => handleDesmarcar(c)} title="Deshacer cobro"
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#a3a3a3', padding:4 }}>
                              <FiRefreshCw size={12} />
                            </button>
                          )}
                          <button onClick={() => setConfirmId(c.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4 }}><FiTrash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal nuevo cobro manual */}
      {modalNuevo && !modalNuevo.id && (
        <ModalNuevoCobro form={modalNuevo} onClose={() => setModalNuevo(null)} onGuardar={handleCrearCobro} />
      )}

      {/* Modal confirmar pago */}
      {modalPagar && (
        <ModalPagarCobro cobro={modalPagar} clienteNombre={clienteNombre} onClose={() => setModalPagar(null)} onPagado={onPagado} />
      )}

      {confirmId && (
        <ConfirmModal title="Eliminar cobro" message="¿Eliminás este cobro? Si ya fue pagado, el ingreso en Casa no se borra automáticamente." confirmLabel="Eliminar" onConfirm={() => handleEliminar(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
    </div>
  )
}

function ModalNuevoCobro({ form: formInicial, onClose, onGuardar }) {
  const [form, setForm] = useState({ ...formInicial, descripcion: formInicial.descripcion || '', monto: formInicial.monto || '', moneda: formInicial.moneda || 'ars', fecha_vencimiento: formInicial.fecha_vencimiento || '' })
  const [guardando, setGuardando] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.descripcion.trim() || !form.monto) return
    setGuardando(true)
    const payload = {
      client_id:        form.client_id,
      servicio_id:      form.servicio_id ?? null,
      descripcion:      form.descripcion.trim(),
      monto:            Number(form.monto),
      moneda:           form.moneda,
      fecha_vencimiento: form.fecha_vencimiento || null,
      pagado:           false,
      notas:            form.notas ?? null,
    }
    await onGuardar(payload)
    setGuardando(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1060, backdropFilter:'blur(3px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:440, maxWidth:'calc(100vw - 32px)', background:'#fff', borderRadius:14, zIndex:1061, boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'fadeScaleIn .15s ease' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>Nuevo cobro</h6>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373' }}><FiX size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label fw-semibold" style={{ fontSize:12 }}>Descripción *</label>
              <input className="form-control" required value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej: Mantenimiento agosto 2026" style={{ fontSize:14 }} />
            </div>
            <div className="row g-2">
              <div className="col-8">
                <label className="form-label fw-semibold" style={{ fontSize:12 }}>Monto *</label>
                <input type="number" min="0" required className="form-control" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="0" style={{ fontSize:14 }} />
              </div>
              <div className="col-4">
                <label className="form-label fw-semibold" style={{ fontSize:12 }}>Moneda</label>
                <select className="form-select" value={form.moneda} onChange={e => set('moneda', e.target.value)} style={{ fontSize:14 }}>
                  <option value="ars">ARS</option>
                  <option value="usd">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label fw-semibold" style={{ fontSize:12 }}>Fecha de vencimiento</label>
              <input type="date" className="form-control" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} style={{ fontSize:14 }} />
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-4">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
              {guardando ? <span className="spinner-border spinner-border-sm me-1" /> : null}Guardar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB PROPUESTAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabPropuestas({ clienteNombre }) {
  const [propuestas, setPropuestas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchPropuestasByCliente(clienteNombre).then(({ data }) => { setPropuestas(data); setCargando(false) })
  }, [clienteNombre])

  if (cargando) return <div className="text-center py-4"><span className="spinner-border text-primary" /></div>

  if (propuestas.length === 0) return (
    <div className="text-center py-5 text-muted">
      <FiFileText size={36} className="mb-3 opacity-50 d-block mx-auto" />
      <p className="fw-semibold mb-1">No hay propuestas para este cliente</p>
      <Link to="/propuestas" className="btn btn-primary btn-sm mt-2">Ir a Propuestas</Link>
    </div>
  )

  return (
    <div className="d-flex flex-column gap-3">
      {propuestas.map(p => {
        const cfg = ESTADO_PROP[p.estado] ?? { label:p.estado, bg:'#f5f5f5', color:'#737373' }
        return (
          <div key={p.id} className="card" style={{ border:'1px solid #e8eaf0' }}>
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold" style={{ color:'#0a0a0a', fontSize:13 }}>{p.numero}</span>
                    <span className="badge" style={{ background:cfg.bg, color:cfg.color, fontSize:11 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color, display:'inline-block', marginRight:4 }} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="fw-medium mb-0" style={{ fontSize:14, color:'#0a0a0a' }}>{p.asunto}</p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="fw-bold mb-0" style={{ fontSize:16, color:'#0a0a0a' }}>{fmtARS(p.monto)}</p>
                  <p className="mb-0 text-muted" style={{ fontSize:12 }}>{p.fecha ? fmtFecha(p.fecha) : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB NOTAS
// ═══════════════════════════════════════════════════════════════════════════════

function TabNotas({ clienteId }) {
  const toast = useToast()
  const [notas, setNotas] = useState([])
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetchClientNotes(clienteId).then(({ data }) => { setNotas(data); setCargando(false) })
  }, [clienteId])

  async function handleAgregar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    setGuardando(true)
    const { data, error } = await addClientNote(clienteId, texto.trim())
    if (error) { toast('Error', 'error') }
    else { setNotas(prev => [data, ...prev]); setTexto('') }
    setGuardando(false)
  }

  if (cargando) return <div className="text-center py-4"><span className="spinner-border text-primary" /></div>

  return (
    <div className="row g-4">
      <div className="col-md-5">
        <div className="card">
          <div className="card-header"><h6 className="card-title mb-0 fs-13">Nueva nota</h6></div>
          <div className="card-body">
            <form onSubmit={handleAgregar}>
              <textarea className="form-control mb-3" rows={4} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Reunión, acuerdo, seguimiento..." style={{ fontSize:14, resize:'none' }} />
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary btn-sm d-flex align-items-center gap-2" disabled={guardando || !texto.trim()}>
                  {guardando ? <span className="spinner-border spinner-border-sm" /> : <FiSend size={13} />}
                  Guardar nota
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="col-md-7">
        {notas.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiMessageSquare size={32} className="mb-2 opacity-50 d-block mx-auto" />
            <p className="mb-0">No hay notas todavía</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notas.map(n => (
              <div key={n.id} className="d-flex gap-3">
                <div className="d-flex flex-column align-items-center" style={{ flexShrink:0 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#0a0a0a', marginTop:5, flexShrink:0 }} />
                  <div style={{ width:2, flex:1, background:'#e8eaf0', marginTop:4 }} />
                </div>
                <div className="flex-grow-1 pb-2">
                  <div className="card" style={{ border:'1px solid #e8eaf0' }}>
                    <div className="card-body py-2 px-3">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <p className="mb-0" style={{ fontSize:13, color:'#0a0a0a', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{n.texto}</p>
                        <button onClick={async () => { await deleteClientNote(n.id); setNotas(prev => prev.filter(x => x.id !== n.id)) }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#a3a3a3', padding:2, flexShrink:0 }}>
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                      <p className="mb-0 mt-1" style={{ fontSize:11, color:'#a3a3a3' }}>{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function DetalleCliente() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [tabActivo, setTabActivo] = useState('info')
  const [cobroDesdeServicioData, setCobroDesdeServicioData] = useState(null)

  useEffect(() => {
    fetchClienteCompleto(id).then(({ data, error }) => {
      if (error || !data) { toast('Cliente no encontrado', 'error'); navigate('/clientes'); return }
      setCliente(data)
      setCargando(false)
    })
  }, [id])

  function handleInfoActualizada(cambios) { setCliente(prev => ({ ...prev, ...cambios })) }

  function handleGenerarCobro(servicio) {
    const cobro = cobroDesdeServicio(servicio, id)
    setCobroDesdeServicioData(cobro)
    setTabActivo('cobros')
  }

  if (cargando) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight:300 }}>
      <span className="spinner-border text-primary" />
    </div>
  )

  const cobros = cliente.cobros ?? []
  const pendienteARS = cobros.filter(c => !c.pagado && c.moneda==='ars').reduce((s,c) => s+c.monto, 0)
  const pendienteUSD = cobros.filter(c => !c.pagado && c.moneda==='usd').reduce((s,c) => s+c.monto, 0)
  const cobradoTotal = cobros.filter(c => c.pagado && c.moneda==='ars').reduce((s,c) => s+c.monto, 0) +
                       cobros.filter(c => c.pagado && c.monto_ars).reduce((s,c) => s+c.monto_ars, 0)
  const color = avatarColor(cliente.nombre)

  const tabs = [
    { key:'info',       label:'Información',  icon:<FiInfo size={13}/> },
    { key:'servicios',  label:'Servicios',    icon:<FiRepeat size={13}/>, badge: (cliente.servicios??[]).length },
    { key:'cobros',     label:'Cobros',       icon:<FiDollarSign size={13}/>, badge: cobros.filter(c=>!c.pagado).length },
    { key:'propuestas', label:'Propuestas',   icon:<FiFileText size={13}/> },
    { key:'notas',      label:'Notas',        icon:<FiMessageSquare size={13}/> },
  ]

  return (
    <div className="p-4">
      {/* Breadcrumb */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button onClick={() => navigate('/clientes')} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize:12 }}>
          <FiArrowLeft size={13} /> Clientes
        </button>
        <span className="text-muted" style={{ fontSize:13 }}>/</span>
        <span style={{ fontSize:13, color:'#0a0a0a', fontWeight:600 }}>{cliente.nombre}</span>
      </div>

      {/* Header */}
      <div className="card mb-4" style={{ borderLeft: `4px solid ${color}`, borderRadius: 12 }}>
        <div className="card-body py-3">
          <div className="d-flex align-items-center gap-4 flex-wrap">

            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: color + '18', color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, flexShrink: 0,
              border: `2px solid ${color}30`,
            }}>
              {(cliente.nombre?.[0] ?? '?').toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h5 className="fw-bold mb-0" style={{ color: '#0a0a0a' }}>{cliente.nombre}</h5>
                {cliente.tipo === 'recurrente'
                  ? <span className="badge bg-light-success text-success" style={{ fontSize: 11 }}><FiRepeat size={9} className="me-1" />Recurrente</span>
                  : <span className="badge bg-light-secondary text-secondary" style={{ fontSize: 11 }}>Puntual</span>}
              </div>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {cliente.rubro && <span className="text-muted" style={{ fontSize: 13 }}>{cliente.rubro}</span>}
                {cliente.ciudad && <span className="text-muted" style={{ fontSize: 13 }}>📍 {cliente.ciudad}</span>}
                {cliente.email && <a href={`mailto:${cliente.email}`} className="text-muted" style={{ fontSize: 13 }}>{cliente.email}</a>}
                {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="text-muted" style={{ fontSize: 13 }}>{cliente.telefono}</a>}
              </div>
            </div>

            {/* KPIs */}
            <div className="d-flex gap-2 flex-wrap">
              {pendienteARS > 0 && (
                <div className="text-center px-3 py-2 rounded-3" style={{ background: '#f5f5f5', border: '1px solid #ebebeb', minWidth: 90 }}>
                  <p className="fw-bold mb-0" style={{ fontSize: 15, color: '#ca8a04' }}>{fmtARS(pendienteARS)}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: 11 }}>pendiente</p>
                </div>
              )}
              {pendienteUSD > 0 && (
                <div className="text-center px-3 py-2 rounded-3" style={{ background: '#f5f5f5', border: '1px solid #ebebeb', minWidth: 90 }}>
                  <p className="fw-bold mb-0" style={{ fontSize: 15, color: '#0a0a0a' }}>{fmtUSD(pendienteUSD)}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: 11 }}>pendiente USD</p>
                </div>
              )}
              {cobradoTotal > 0 && (
                <div className="text-center px-3 py-2 rounded-3" style={{ background: '#f5f5f5', border: '1px solid #ebebeb', minWidth: 90 }}>
                  <p className="fw-bold mb-0" style={{ fontSize: 15, color: '#16a34a' }}>{fmtARS(cobradoTotal)}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: 11 }}>cobrado</p>
                </div>
              )}
              {pendienteARS === 0 && pendienteUSD === 0 && cobradoTotal === 0 && (
                <span className="badge bg-light-secondary text-secondary align-self-center" style={{ fontSize: 12 }}>Sin cobros</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TabNav tabs={tabs} activo={tabActivo} setActivo={t => { setTabActivo(t); if (t !== 'cobros') setCobroDesdeServicioData(null) }} />

      {tabActivo === 'info'       && <TabInfo cliente={cliente} onActualizado={handleInfoActualizada} />}
      {tabActivo === 'servicios'  && <TabServicios clientId={id} onGenerarCobro={handleGenerarCobro} />}
      {tabActivo === 'cobros'     && <TabCobros clientId={id} clienteNombre={cliente.nombre} cobroInicial={cobroDesdeServicioData} />}
      {tabActivo === 'propuestas' && <TabPropuestas clienteNombre={cliente.nombre} />}
      {tabActivo === 'notas'      && <TabNotas clienteId={id} />}
    </div>
  )
}
