import { useState } from 'react'

// { provincia, ciudades[] } — sweet spot: 50k–200k habitantes
// Se excluyen ciudades grandes (CABA, GBA, Córdoba, Rosario, Mar del Plata, Mendoza,
// Tucumán, Salta, Jujuy, Posadas, Corrientes, Resistencia, Neuquén, Paraná, San Juan, Formosa)
// donde la competencia de otros vendors es alta y abundan las cadenas.
// También se excluyen ciudades <40k donde hay muy pocos gimnasios para prospectar.
const CIUDADES_POR_PROVINCIA = [
  {
    // Excluida del criterio "sweet spot" de gimnasios (alta competencia/cadenas),
    // pero útil para rubros como inmobiliaria y restaurantes.
    provincia: 'Buenos Aires (Zona Norte)',
    ciudades: [
      'San Isidro',
      'Vicente López',
      'San Fernando',
      'Tigre',
      'Pilar',
      'Escobar',
      'Malvinas Argentinas',
      'San Miguel',
      'José C. Paz',
    ],
  },
  {
    provincia: 'Buenos Aires (interior)',
    // 50k–200k: mercado con gimnasios suficientes pero sin saturación de vendors
    ciudades: [
      'Azul',        // ~65k
      'Campana',     // ~100k
      'Chivilcoy',   // ~65k
      'Junín',       // ~100k
      'Lincoln',     // ~42k
      'Luján',       // ~115k
      'Mercedes',    // ~65k
      'Necochea',    // ~90k
      'Olavarría',   // ~100k
      'Pergamino',   // ~110k
      'San Nicolás de los Arroyos', // ~140k
      'San Pedro',   // ~60k
      'Tandil',      // ~130k
      'Tres Arroyos',// ~55k
      'Zárate',      // ~120k
      '9 de Julio',  // ~50k
    ],
  },
  {
    provincia: 'Córdoba',
    ciudades: [
      'Alta Gracia',     // ~60k
      'Jesús María',     // ~35k — incluida por ser ciudad universitaria activa
      'Río Cuarto',      // ~180k
      'San Francisco',   // ~65k
      'Villa Carlos Paz',// ~70k
      'Villa María',     // ~100k
    ],
  },
  {
    provincia: 'Santa Fe',
    ciudades: [
      'Esperanza',    // ~55k
      'Rafaela',      // ~110k
      'Reconquista',  // ~80k
      'San Lorenzo',  // ~50k
      'Venado Tuerto',// ~90k
    ],
  },
  {
    provincia: 'Entre Ríos',
    ciudades: [
      'Concordia',              // ~170k
      'Concepción del Uruguay', // ~80k
      'Gualeguaychú',           // ~90k
    ],
  },
  {
    provincia: 'Mendoza',
    ciudades: [
      'Luján de Cuyo', // ~120k
      'San Rafael',    // ~110k
    ],
  },
  {
    provincia: 'Tucumán',
    ciudades: [
      'Concepción', // ~50k
      'Tafí Viejo', // ~120k
      'Yerba Buena',// ~80k
    ],
  },
  {
    provincia: 'Jujuy',
    ciudades: [
      'San Pedro de Jujuy', // ~75k
    ],
  },
  {
    provincia: 'Salta',
    ciudades: [
      'Orán',     // ~75k
      'Tartagal', // ~65k
    ],
  },
  {
    provincia: 'Misiones',
    ciudades: [
      'Eldorado', // ~75k
      'Oberá',    // ~70k
    ],
  },
  {
    provincia: 'Corrientes',
    ciudades: [
      'Goya', // ~85k
    ],
  },
  {
    provincia: 'Chaco',
    ciudades: [
      'Presidencia Roque Sáenz Peña', // ~110k
    ],
  },
  {
    provincia: 'Santiago del Estero',
    ciudades: [
      'La Banda', // ~120k
    ],
  },
  {
    provincia: 'Neuquén',
    ciudades: [
      'Cutral Co', // ~50k
    ],
  },
  {
    provincia: 'Río Negro',
    ciudades: [
      'Bariloche',    // ~130k
      'Cipolletti',   // ~100k
      'General Roca', // ~90k
      'Viedma',       // ~70k
    ],
  },
  {
    provincia: 'Chubut',
    ciudades: [
      'Puerto Madryn', // ~110k
      'Trelew',        // ~115k
    ],
  },
  {
    provincia: 'La Pampa',
    ciudades: [
      'General Pico', // ~65k
      'Santa Rosa',   // ~110k
    ],
  },
  {
    provincia: 'San Luis',
    ciudades: [
      'Villa Mercedes', // ~110k
    ],
  },
  {
    provincia: 'La Rioja',
    ciudades: [
      'La Rioja', // ~180k
    ],
  },
  {
    provincia: 'Catamarca',
    ciudades: [
      'San Fernando del Valle de Catamarca', // ~190k
    ],
  },
  {
    provincia: 'Santa Cruz',
    ciudades: [
      'Caleta Olivia', // ~50k
      'Río Gallegos',  // ~110k
    ],
  },
  {
    provincia: 'Tierra del Fuego',
    ciudades: [
      'Río Grande', // ~100k
      'Ushuaia',    // ~70k
    ],
  },
]

// Rubros orientados a GymApp — todos son negocios independientes
// con gestión de socios/clientes recurrentes y pagos periódicos
const RUBROS = [
  'Gimnasio',
  'Box CrossFit',
  'Pilates',
  'Yoga',
  'Artes marciales',
  'Taekwondo',
  'Muay Thai',
  'Natación',
  'Funcional',
  'Artes marciales mixtas',
  // Rubros para venta de webs
  'Inmobiliaria',
  'Restaurante',
]
const SCRAPER_URL = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3005'

export default function Scraper() {
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [rubro, setRubro] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)

  function handleCiudadChange(e) {
    const val = e.target.value
    if (!val) {
      setCiudad('')
      setProvincia('')
    } else {
      const [c, p] = val.split('||')
      setCiudad(c)
      setProvincia(p)
    }
    setResultado(null)
    setError(null)
  }

  async function handleBuscar(e) {
    e.preventDefault()
    if (!ciudad || !rubro) return

    setCargando(true)
    setResultado(null)
    setError(null)

    try {
      const res = await fetch(`${SCRAPER_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ciudad, provincia, rubro, limite: 20 }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error desconocido')
      } else {
        setResultado(data)
      }
    } catch {
      setError('No se pudo conectar con el servidor del scraper.')
    } finally {
      setCargando(false)
    }
  }

  const puedeEnviar = ciudad && rubro && !cargando

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Scraper de leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Buscá negocios en Google Maps y agregálos automáticamente al pipeline.
        </p>
      </div>

      <form onSubmit={handleBuscar} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Ciudad */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700" htmlFor="ciudad">
            Ciudad
          </label>
          <select
            id="ciudad"
            value={ciudad ? `${ciudad}||${provincia}` : ''}
            onChange={handleCiudadChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            disabled={cargando}
          >
            <option value="">Seleccioná una ciudad…</option>
            {CIUDADES_POR_PROVINCIA.map(({ provincia: prov, ciudades }) => (
              <optgroup key={prov} label={prov}>
                {ciudades.map((c) => (
                  <option key={`${c}||${prov}`} value={`${c}||${prov}`}>{c}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Rubro */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700" htmlFor="rubro">
            Rubro
          </label>
          <select
            id="rubro"
            value={rubro}
            onChange={(e) => { setRubro(e.target.value); setResultado(null); setError(null) }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            disabled={cargando}
          >
            <option value="">Seleccioná un rubro…</option>
            {RUBROS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={!puedeEnviar}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Buscando…
            </>
          ) : (
            'Buscar leads'
          )}
        </button>
      </form>

      {/* Resultado */}
      {resultado && (
        <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <span className="mt-0.5 text-green-500">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="text-sm text-green-800">
            <span className="font-semibold">{resultado.insertados} lead{resultado.insertados !== 1 ? 's' : ''} nuevos</span>
            {' '}en <span className="font-semibold">{ciudad}</span>
            {resultado.duplicados > 0 && (
              <> · {resultado.duplicados} duplicado{resultado.duplicados !== 1 ? 's' : ''} ignorado{resultado.duplicados !== 1 ? 's' : ''}</>
            )}.
            {(resultado.descartados_cerrados > 0 || resultado.descartados_sin_contacto > 0 || resultado.descartados_fuera_ciudad > 0 || resultado.descartados_cadena > 0 || resultado.descartados_sin_canal_digital > 0) && (
              <span className="block mt-1 text-green-700 text-xs">
                Descartados: {[
                  resultado.descartados_cerrados        > 0 && `${resultado.descartados_cerrados} cerrados`,
                  resultado.descartados_sin_contacto    > 0 && `${resultado.descartados_sin_contacto} sin contacto`,
                  resultado.descartados_fuera_ciudad    > 0 && `${resultado.descartados_fuera_ciudad} fuera de ciudad`,
                  resultado.descartados_cadena          > 0 && `${resultado.descartados_cadena} cadenas`,
                  resultado.descartados_sin_canal_digital > 0 && `${resultado.descartados_sin_canal_digital} sin canal digital`,
                ].filter(Boolean).join(' · ')}
              </span>
            )}
            {resultado.por_prioridad && (
              <span className="block mt-1 text-green-700 text-xs">
                Alta: {resultado.por_prioridad.alta} · Media: {resultado.por_prioridad.media} · Baja: {resultado.por_prioridad.baja}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <span className="mt-0.5 text-red-400">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
