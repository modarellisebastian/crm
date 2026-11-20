import { useState } from 'react'
import { SCRAPER_URL, scraperHeaders } from '../lib/scraper'

const CIUDADES_POR_PROVINCIA = [
  { provincia: 'Buenos Aires (Zona Norte)', ciudades: ['San Isidro','Vicente López','San Fernando','Tigre','Pilar','Escobar','Malvinas Argentinas','San Miguel','José C. Paz'] },
  { provincia: 'Buenos Aires (interior)', ciudades: ['Azul','Campana','Chivilcoy','Junín','Lincoln','Luján','Mercedes','Necochea','Olavarría','Pergamino','San Nicolás de los Arroyos','San Pedro','Tandil','Tres Arroyos','Zárate','9 de Julio'] },
  { provincia: 'Córdoba', ciudades: ['Alta Gracia','Jesús María','Río Cuarto','San Francisco','Villa Carlos Paz','Villa María'] },
  { provincia: 'Santa Fe', ciudades: ['Esperanza','Rafaela','Reconquista','San Lorenzo','Venado Tuerto'] },
  { provincia: 'Entre Ríos', ciudades: ['Concordia','Concepción del Uruguay','Gualeguaychú'] },
  { provincia: 'Mendoza', ciudades: ['Luján de Cuyo','San Rafael'] },
  { provincia: 'Tucumán', ciudades: ['Concepción','Tafí Viejo','Yerba Buena'] },
  { provincia: 'Jujuy', ciudades: ['San Pedro de Jujuy'] },
  { provincia: 'Salta', ciudades: ['Orán','Tartagal'] },
  { provincia: 'Misiones', ciudades: ['Eldorado','Oberá'] },
  { provincia: 'Corrientes', ciudades: ['Goya'] },
  { provincia: 'Chaco', ciudades: ['Presidencia Roque Sáenz Peña'] },
  { provincia: 'Santiago del Estero', ciudades: ['La Banda'] },
  { provincia: 'Neuquén', ciudades: ['Cutral Co'] },
  { provincia: 'Río Negro', ciudades: ['Bariloche','Cipolletti','General Roca','Viedma'] },
  { provincia: 'Chubut', ciudades: ['Puerto Madryn','Trelew'] },
  { provincia: 'La Pampa', ciudades: ['General Pico','Santa Rosa'] },
  { provincia: 'San Luis', ciudades: ['Villa Mercedes'] },
  { provincia: 'La Rioja', ciudades: ['La Rioja'] },
  { provincia: 'Catamarca', ciudades: ['San Fernando del Valle de Catamarca'] },
  { provincia: 'Santa Cruz', ciudades: ['Caleta Olivia','Río Gallegos'] },
  { provincia: 'Tierra del Fuego', ciudades: ['Río Grande','Ushuaia'] },
]

const RUBROS = ['Gimnasio','Box CrossFit','Pilates','Yoga','Artes marciales','Taekwondo','Muay Thai','Natación','Funcional','Artes marciales mixtas','Inmobiliaria','Restaurante']
const OTRO_RUBRO = '__otro'
const PAISES = [{ code: 'AR', label: 'Argentina' },{ code: 'ES', label: 'España' },{ code: 'MX', label: 'México' },{ code: 'CL', label: 'Chile' },{ code: 'CO', label: 'Colombia' },{ code: 'UY', label: 'Uruguay' }]

export default function Scraper() {
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [rubro, setRubro] = useState('')
  const [rubroLibre, setRubroLibre] = useState('')
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false)
  const [pais, setPais] = useState('AR')
  const [idioma, setIdioma] = useState('es')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  const rubroFinal = rubro === OTRO_RUBRO ? rubroLibre.trim() : rubro

  function handleCiudadChange(e) {
    const val = e.target.value
    if (!val) { setCiudad(''); setProvincia('') }
    else { const [c, p] = val.split('||'); setCiudad(c); setProvincia(p) }
    setResultado(null); setError(null)
  }

  async function handleBuscar(e) {
    e.preventDefault()
    if (!ciudad || !rubroFinal) return
    setCargando(true); setResultado(null); setError(null)
    try {
      const res = await fetch(`${SCRAPER_URL}/api/scrape`, {
        method: 'POST',
        headers: scraperHeaders(),
        body: JSON.stringify({ ciudad, provincia, rubro: rubroFinal, limite: 20, pais, idioma }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Error desconocido')
      else setResultado(data)
    } catch {
      setError('No se pudo conectar con el servidor del scraper.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h4 className="fw-semibold mb-1">Scraper de leads</h4>
      <p className="text-muted small mb-4">Buscá negocios en Google Maps y agregálos al pipeline.</p>

      <div className="card border">
        <div className="card-body d-flex flex-column gap-3">
          <form onSubmit={handleBuscar} className="d-flex flex-column gap-3">

            {/* Ciudad */}
            <div>
              <label className="form-label small fw-medium mb-1">Ciudad</label>
              <select className="form-select form-select-sm" value={ciudad ? `${ciudad}||${provincia}` : ''} onChange={handleCiudadChange} disabled={cargando}>
                <option value="">Seleccioná una ciudad…</option>
                {CIUDADES_POR_PROVINCIA.map(({ provincia: prov, ciudades }) => (
                  <optgroup key={prov} label={prov}>
                    {ciudades.map(c => <option key={`${c}||${prov}`} value={`${c}||${prov}`}>{c}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Rubro */}
            <div>
              <label className="form-label small fw-medium mb-1">Rubro</label>
              <select className="form-select form-select-sm" value={rubro} onChange={(e) => { setRubro(e.target.value); setResultado(null); setError(null) }} disabled={cargando}>
                <option value="">Seleccioná un rubro…</option>
                {RUBROS.map(r => <option key={r} value={r}>{r}</option>)}
                <option value={OTRO_RUBRO}>Otro (especificar)…</option>
              </select>
              {rubro === OTRO_RUBRO && (
                <input type="text" className="form-control form-control-sm mt-2"
                  value={rubroLibre} onChange={(e) => { setRubroLibre(e.target.value); setResultado(null); setError(null) }}
                  placeholder="Ej: Veterinaria, Peluquería…" disabled={cargando} />
              )}
            </div>

            {/* Avanzado */}
            <div>
              <button type="button" className="btn btn-link btn-sm p-0 text-muted" onClick={() => setMostrarAvanzado(v => !v)}>
                {mostrarAvanzado ? '− Ocultar opciones avanzadas' : '+ Opciones avanzadas (país / idioma)'}
              </button>
              {mostrarAvanzado && (
                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <label className="form-label small mb-1">País</label>
                    <select className="form-select form-select-sm" value={pais} onChange={(e) => setPais(e.target.value)} disabled={cargando}>
                      {PAISES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small mb-1">Idioma</label>
                    <input type="text" className="form-control form-control-sm" value={idioma} onChange={(e) => setIdioma(e.target.value)} placeholder="es" disabled={cargando} />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={!ciudad || !rubroFinal || cargando}>
              {cargando ? <><span className="spinner-border spinner-border-sm me-2" />Buscando…</> : 'Buscar leads'}
            </button>
          </form>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="alert alert-success mt-3">
          <strong>{resultado.insertados} lead{resultado.insertados !== 1 ? 's' : ''} nuevos</strong> en {ciudad}
          {resultado.duplicados > 0 && <> · {resultado.duplicados} duplicado{resultado.duplicados !== 1 ? 's' : ''} ignorado{resultado.duplicados !== 1 ? 's' : ''}</>}.
          {resultado.por_prioridad && (
            <div className="small mt-1 text-success">Alta: {resultado.por_prioridad.alta} · Media: {resultado.por_prioridad.media} · Baja: {resultado.por_prioridad.baja}</div>
          )}
        </div>
      )}

      {error && <div className="alert alert-danger mt-3 small">{error}</div>}
    </div>
  )
}
