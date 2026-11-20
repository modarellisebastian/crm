import { useEffect, useState } from 'react'
import { FiX, FiSave, FiUser, FiFileText, FiGlobe } from 'react-icons/fi'
import { crearCliente, actualizarCliente } from '../../services/clientsService'
import { useToast } from '../../context/ToastProvider'

const EMPTY = {
  nombre: '', rubro: '', ciudad: '', tipo: 'puntual',
  email: '', telefono: '', instagram: '',
  cuit: '', direccion: '', condicion_iva: 'monotributo',
  web: '', url_sitio_entregado: '',
  notas: '',
}

const CONDICIONES = ['monotributo', 'responsable_inscripto', 'consumidor_final', 'exento']
const CONDICION_LABEL = {
  monotributo:          'Monotributista',
  responsable_inscripto:'Resp. Inscripto',
  consumidor_final:     'Consumidor Final',
  exento:               'Exento',
}

export default function ModalCliente({ clienteInicial, onClose, onGuardado }) {
  const toast = useToast()
  const esEdicion = !!clienteInicial?.id
  const [form, setForm] = useState(clienteInicial?.id
    ? { ...EMPTY, ...clienteInicial }
    : { ...EMPTY }
  )
  const [guardando, setGuardando] = useState(false)
  const [tab, setTab] = useState('info')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setGuardando(true)
    const payload = {
      nombre:               form.nombre.trim(),
      rubro:                form.rubro.trim() || null,
      ciudad:               form.ciudad.trim() || null,
      tipo:                 form.tipo,
      email:                form.email.trim() || null,
      telefono:             form.telefono.trim() || null,
      instagram:            form.instagram.trim() || null,
      cuit:                 form.cuit.trim() || null,
      direccion:            form.direccion.trim() || null,
      condicion_iva:        form.condicion_iva || null,
      web:                  form.web.trim() || null,
      url_sitio_entregado:  form.url_sitio_entregado.trim() || null,
      notas:                form.notas.trim() || null,
    }
    if (esEdicion) {
      const { error } = await actualizarCliente(clienteInicial.id, payload)
      if (error) { toast('Error al guardar', 'error'); setGuardando(false); return }
      onGuardado({ ...clienteInicial, ...payload })
      toast('Cliente actualizado', 'success')
    } else {
      const { data, error } = await crearCliente(payload)
      if (error) { toast('Error al crear', 'error'); setGuardando(false); return }
      onGuardado(data)
      toast('Cliente creado', 'success')
    }
    onClose()
  }

  const tabs = [
    { key: 'info',      label: 'Info',         icon: <FiUser size={13} /> },
    { key: 'factura',   label: 'Facturación',  icon: <FiFileText size={13} /> },
    { key: 'web',       label: 'Web',          icon: <FiGlobe size={13} /> },
  ]

  const Label = ({ children }) => (
    <label className="form-label fw-semibold mb-1" style={{ fontSize:11, color:'#737373', textTransform:'uppercase', letterSpacing:.5 }}>
      {children}
    </label>
  )

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:1050, backdropFilter:'blur(3px)' }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:520, maxWidth:'calc(100vw - 32px)',
        background:'#fff', borderRadius:16,
        zIndex:1051, boxShadow:'0 24px 80px rgba(0,0,0,.22)',
        animation:'fadeScaleIn .15s ease',
        maxHeight:'90vh', overflowY:'auto',
      }}>
        <style>{`@keyframes fadeScaleIn{from{opacity:0;transform:translate(-50%,-50%) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <div>
            <h6 className="fw-bold mb-0" style={{ color:'#0a0a0a' }}>
              {esEdicion ? `Editar — ${clienteInicial.nombre}` : 'Nuevo cliente'}
            </h6>
            <p className="text-muted mb-0" style={{ fontSize:12 }}>
              {esEdicion ? 'Modificá los datos del cliente' : 'Completá los datos básicos. Servicios y cobros se gestionan desde el detalle.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#737373' }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Tab nav */}
        <div className="px-4 pt-3">
          <ul className="nav nav-tabs border-0 gap-2">
            {tabs.map(t => (
              <li key={t.key} className="nav-item">
                <button
                  className={`nav-link d-flex align-items-center gap-1 border-0 ${tab === t.key ? 'active fw-semibold' : 'text-muted'}`}
                  style={{ fontSize:13, background:'none', borderBottom: tab === t.key ? '2px solid #0a0a0a' : '2px solid transparent', borderRadius:0, cursor:'pointer', padding:'6px 4px' }}
                  onClick={() => setTab(t.key)}
                >
                  {t.icon} {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">

            {/* TAB: Info */}
            {tab === 'info' && (
              <div className="d-flex flex-column gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <input className="form-control" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Holahello" style={{ fontSize:14 }} />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <Label>Rubro</Label>
                    <input className="form-control" value={form.rubro} onChange={e => set('rubro', e.target.value)} placeholder="Ej: Fitness" style={{ fontSize:14 }} />
                  </div>
                  <div className="col-6">
                    <Label>Ciudad</Label>
                    <input className="form-control" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Ej: Buenos Aires" style={{ fontSize:14 }} />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <Label>Tipo de cliente</Label>
                  <div className="d-flex gap-2">
                    {[['recurrente','Recurrente','Paga todos los meses o con frecuencia fija'],
                      ['puntual','Puntual','Trabajos específicos o esporádicos']].map(([val, label, desc]) => (
                      <button
                        key={val} type="button"
                        onClick={() => set('tipo', val)}
                        className="flex-1"
                        style={{
                          flex:1, border: form.tipo === val ? '2px solid #0a0a0a' : '1px solid #e0e4ef',
                          borderRadius:10, padding:'10px 14px', background: form.tipo === val ? '#f5f5f5' : '#fff',
                          cursor:'pointer', textAlign:'left',
                        }}
                      >
                        <p className="fw-bold mb-0" style={{ fontSize:13, color: form.tipo === val ? '#0a0a0a' : '#0a0a0a' }}>{label}</p>
                        <p className="mb-0 text-muted" style={{ fontSize:11 }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <Label>Email</Label>
                    <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} placeholder="mail@ejemplo.com" style={{ fontSize:14 }} />
                  </div>
                  <div className="col-6">
                    <Label>Teléfono</Label>
                    <input className="form-control" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 11..." style={{ fontSize:14 }} />
                  </div>
                </div>
                <div>
                  <Label>Instagram</Label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ fontSize:13 }}>@</span>
                    <input className="form-control" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="usuario" style={{ fontSize:14 }} />
                  </div>
                </div>
                <div>
                  <Label>Notas internas</Label>
                  <textarea className="form-control" rows={3} value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones generales..." style={{ fontSize:14, resize:'none' }} />
                </div>
              </div>
            )}

            {/* TAB: Facturación */}
            {tab === 'factura' && (
              <div className="d-flex flex-column gap-3">
                <div>
                  <Label>CUIT / CUIL</Label>
                  <input className="form-control" value={form.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" style={{ fontSize:14 }} />
                </div>
                <div>
                  <Label>Dirección fiscal</Label>
                  <input className="form-control" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Av. Corrientes 1234, CABA" style={{ fontSize:14 }} />
                </div>
                <div>
                  <Label>Condición IVA</Label>
                  <div className="row g-2">
                    {CONDICIONES.map(c => (
                      <div key={c} className="col-6">
                        <button
                          type="button"
                          onClick={() => set('condicion_iva', c)}
                          style={{
                            width:'100%', border: form.condicion_iva === c ? '2px solid #0a0a0a' : '1px solid #e0e4ef',
                            borderRadius:8, padding:'8px 12px', background: form.condicion_iva === c ? '#f5f5f5' : '#fff',
                            cursor:'pointer', fontSize:13, fontWeight: form.condicion_iva === c ? 600 : 400,
                            color: form.condicion_iva === c ? '#0a0a0a' : '#737373',
                          }}
                        >
                          {CONDICION_LABEL[c]}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Web */}
            {tab === 'web' && (
              <div className="d-flex flex-column gap-3">
                <div>
                  <Label>Sitio entregado (URL)</Label>
                  <input type="url" className="form-control" value={form.url_sitio_entregado} onChange={e => set('url_sitio_entregado', e.target.value)} placeholder="https://sitio.com" style={{ fontSize:14 }} />
                </div>
                <div>
                  <Label>Web corporativa / otra URL</Label>
                  <input type="url" className="form-control" value={form.web} onChange={e => set('web', e.target.value)} placeholder="https://..." style={{ fontSize:14 }} />
                </div>
                <div>
                  <Label>URL demo / Stitch</Label>
                  <input type="url" className="form-control" value={form.url_demo_stitch || ''} onChange={e => set('url_demo_stitch', e.target.value)} placeholder="https://..." style={{ fontSize:14 }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="d-flex gap-2 justify-content-end px-4 pb-4 border-top pt-3">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2" disabled={guardando}>
              {guardando ? <span className="spinner-border spinner-border-sm" /> : <FiSave size={14} />}
              {esEdicion ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
