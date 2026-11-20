import { Router } from 'express'
import axios from 'axios'
import { supabase } from '../lib/supabase.js'

const router = Router()

const APIFY_ACTOR_ID = 'compass~crawler-google-places'

const LINKTREE_DOMAINS = new Set(['linktr.ee', 'bento.me', 'beacons.ai', 'bio.link', 'tap.bio'])

// Hosts que parecen web pero son perfiles de Google Business u otros no reales
const HOSTS_IGNORADOS = new Set(['g.dev', 'goo.gl'])

// Nombres de país para armar el texto de búsqueda (independiente del countryCode
// que se le pasa a Apify, que sí acepta cualquier ISO-3166 aunque no esté acá)
const PAIS_NOMBRE = { AR: 'Argentina', ES: 'España', MX: 'México', CL: 'Chile', CO: 'Colombia', UY: 'Uruguay' }

// Cadenas/franquicias a excluir — configurable por ciudad+rubro en scraper_config.excluir_keywords,
// vacío por defecto (no asume ningún rubro en particular)
function esCadena(nombre, excluirKeywords) {
  if (!nombre || !excluirKeywords?.length) return false
  const lower = nombre.toLowerCase()
  return excluirKeywords.some((kw) => lower.includes(kw.toLowerCase()))
}

function clasificarPresenciaDigital(websiteUrl) {
  const vacio = { url_web: null, instagram: null, facebook: null, linktree: null }

  if (!websiteUrl) return { ...vacio, tipo_presencia: 'ninguna' }

  let url
  try {
    url = new URL(websiteUrl)
  } catch {
    return { ...vacio, tipo_presencia: 'ninguna' }
  }

  const hostname = url.hostname.replace(/^www\./, '').toLowerCase()
  const pathname = url.pathname.replace(/\/+$/, '')

  if (HOSTS_IGNORADOS.has(hostname)) {
    return { ...vacio, tipo_presencia: 'ninguna' }
  }

  if (hostname === 'instagram.com' || hostname === 'instagr.am') {
    const username = pathname.split('/').filter(Boolean)[0] || null
    return { ...vacio, instagram: username, tipo_presencia: 'instagram' }
  }

  if (hostname === 'facebook.com' || hostname === 'fb.me' || hostname === 'm.facebook.com') {
    return { ...vacio, facebook: websiteUrl, tipo_presencia: 'facebook' }
  }

  if (LINKTREE_DOMAINS.has(hostname)) {
    return { ...vacio, linktree: websiteUrl, tipo_presencia: 'linktree' }
  }

  return { ...vacio, url_web: websiteUrl, tipo_presencia: 'web_propia' }
}

function extraerWhatsAppValido(phone, phoneUnformatted) {
  for (const raw of [phoneUnformatted, phone]) {
    if (!raw) continue
    let digits = raw.replace(/\D/g, '')

    // Quitar prefijo 00 internacional
    if (digits.startsWith('00')) digits = digits.slice(2)

    // Formato canónico: 549 + 10 dígitos = 13 dígitos
    if (/^549\d{10}$/.test(digits)) return digits

    // Sin el 9 móvil: 54 + 10 dígitos (Google Maps a veces omite el 9)
    if (/^54\d{10}$/.test(digits)) return `549${digits.slice(2)}`

    // Solo número local: 10 dígitos sin código de país
    if (/^\d{10}$/.test(digits)) return `549${digits}`

    // Con trunk 0: 0 + 10 dígitos (ej: 01123456789)
    if (/^0\d{10}$/.test(digits)) return `549${digits.slice(1)}`

    // Formato viejo con 15: 0 + área (2-4 dígitos) + 15 + número (6-8 dígitos)
    const m = digits.match(/^0(\d{2,4})15(\d{6,8})$/)
    if (m) {
      const candidate = `549${m[1]}${m[2]}`
      if (/^549\d{10}$/.test(candidate)) return candidate
    }
  }
  return null
}

function calcularScore(lead, umbrales) {
  let score = 0

  // Descarte inmediato: cadenas conocidas
  if (lead.es_cadena) return 0

  if (lead.whatsapp)                               score += 20
  if (lead.instagram)                              score += 20
  if (lead.linktree)                               score += 10
  if (lead.tipo_presencia === 'web_propia')        score += 5

  if (lead.reviews_count != null) {
    const { sweetMin, sweetMax, grandeMax } = umbrales
    if      (lead.reviews_count >= sweetMin && lead.reviews_count <= sweetMax) score += 20  // sweet spot: establecido pero no cadena
    else if (lead.reviews_count > sweetMax && lead.reviews_count <= grandeMax) score += 5   // grande, puede tener software
    else if (lead.reviews_count > grandeMax)                                  score -= 30  // muy probablemente cadena o franquicia
    else if (lead.reviews_count >= 5)                                         score += 5
    else                                                                      score -= 15
  }

  if (lead.rating != null && lead.rating >= 4.0)          score += 10
  if (lead.image_count != null && lead.image_count >= 10) score += 5
  if (lead.telefono)                                       score += 5

  // Penalizaciones
  if (!lead.instagram && lead.tipo_presencia !== 'web_propia' && !lead.linktree) score -= 10
  if (lead.telefono && !lead.whatsapp && !lead.instagram && !lead.url_web && !lead.linktree && !lead.facebook) score -= 5

  return Math.max(0, Math.min(100, score))
}

// Alta: independiente, tamaño medio (sweet spot de reviews), contactable por WhatsApp e Instagram
function calcularPrioridad(lead, umbrales) {
  if (lead.es_cadena) return 'baja'

  const reviewsOk = lead.reviews_count != null && lead.reviews_count >= umbrales.sweetMin && lead.reviews_count <= umbrales.sweetMax
  const contactoDoble = lead.whatsapp && lead.instagram

  if (reviewsOk && contactoDoble && lead.score >= 55) return 'alta'
  if (lead.score >= 35) return 'media'
  return 'baja'
}

function mapearResultado(item, rubro, ciudad, excluirKeywords, umbrales) {
  const presencia  = clasificarPresenciaDigital(item.website)
  const whatsapp   = extraerWhatsAppValido(item.phone, item.phoneUnformatted)
  const nombre     = item.title || null

  const lead = {
    nombre,
    rubro,
    ciudad,
    es_cadena:          esCadena(nombre, excluirKeywords),
    tipo_presencia:     presencia.tipo_presencia,
    tiene_web:          presencia.tipo_presencia === 'web_propia',
    url_web:            presencia.url_web,
    instagram:          presencia.instagram,
    facebook:           presencia.facebook,
    linktree:           presencia.linktree,
    telefono:           item.phone || item.phoneUnformatted || null,
    whatsapp,
    email:              null,
    rating:             item.totalScore      ?? null,
    reviews_count:      item.reviewsCount    ?? null,
    image_count:        item.imagesCount     ?? null,
    categoria_google:   item.categoryName    ?? null,
    direccion:          item.address         ?? null,
    lat:                item.location?.lat   ?? null,
    lng:                item.location?.lng   ?? null,
    descripcion_google: item.description     ?? null,
    cerrado_permanente: Boolean(item.permanentlyClosed),
    estado:             'nuevo',
    place_id:           item.placeId         || null,
  }

  lead.score     = calcularScore(lead, umbrales)
  lead.prioridad = calcularPrioridad(lead, umbrales)
  return lead
}

router.post('/scrape', async (req, res) => {
  const { ciudad, rubro, limite, provincia } = req.body

  if (!ciudad || !rubro) {
    return res.status(400).json({ error: 'ciudad y rubro son requeridos' })
  }

  // Configuración guardada para este ciudad+rubro (keywords a excluir, umbrales de
  // scoring, país/idioma) — si no existe todavía, se usan los defaults genéricos.
  const { data: config } = await supabase
    .from('scraper_config')
    .select('*')
    .eq('ciudad', ciudad)
    .eq('rubro', rubro)
    .maybeSingle()

  const pais   = (req.body.pais   || config?.pais   || 'AR').toUpperCase()
  const idioma =  req.body.idioma || config?.idioma || 'es'
  const excluirKeywords = config?.excluir_keywords ?? []
  const umbrales = {
    sweetMin:  config?.reviews_sweet_spot_min ?? 20,
    sweetMax:  config?.reviews_sweet_spot_max ?? 150,
    grandeMax: config?.reviews_grande_max     ?? 300,
  }

  const cantidad   = Math.min(Number(limite) || 20, 50)
  const paisNombre = PAIS_NOMBRE[pais]
  const query      = [rubro, 'en', [ciudad, provincia, paisNombre].filter(Boolean).join(', ')].join(' ')

  let resultados
  try {
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`,
      {
        searchStringsArray:        [query],
        maxCrawledPlacesPerSearch: cantidad,
        language:                  idioma,
        countryCode:               pais.toLowerCase(),
        includeHistogram:          false,
        includeOpeningHours:       true,
        includePeopleAlsoSearch:   false,
      },
      {
        params:  { token: process.env.APIFY_API_TOKEN, memory: 256 },
        timeout: 300_000,
      }
    )
    resultados = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    const mensaje = err.response?.data?.error?.message || err.message
    return res.status(502).json({ error: `Apify error: ${mensaje}` })
  }

  // Log del primer item crudo para verificar nombres de campos (totalScore, imagesCount, etc.)
  if (resultados.length > 0) {
    console.log('[scraper] primer item raw:', JSON.stringify(resultados[0], null, 2))
  }

  // Contadores de descarte
  let descartados_cerrados          = 0
  let descartados_sin_contacto      = 0
  let descartados_fuera_ciudad      = 0
  let descartados_sin_canal_digital = 0
  let descartados_cadena            = 0

  // Filtros pre-mapeo
  const preMapeo = resultados.filter((item) => {
    if (item.permanentlyClosed || item.temporarilyClosed) {
      descartados_cerrados++
      return false
    }
    if (!item.phone && !item.phoneUnformatted && !item.website) {
      descartados_sin_contacto++
      return false
    }
    return true
  })

  const respuestaVacia = {
    insertados: 0, duplicados: 0,
    descartados_cerrados, descartados_sin_contacto,
    descartados_fuera_ciudad, descartados_sin_canal_digital, descartados_cadena,
    por_prioridad: { alta: 0, media: 0, baja: 0 },
  }

  if (!preMapeo.length) return res.json(respuestaVacia)

  // Mapeo
  const mapeados = preMapeo.map((item) => mapearResultado(item, rubro, ciudad, excluirKeywords, umbrales))

  // Filtro geográfico post-mapeo: descartar si la dirección no menciona la ciudad
  const ciudadLower = ciudad.toLowerCase()
  const filtradosGeo = mapeados.filter((l) => {
    if (l.direccion && !l.direccion.toLowerCase().includes(ciudadLower)) {
      descartados_fuera_ciudad++
      return false
    }
    return true
  })

  // Filtro cadenas: descartar cadenas/franquicias conocidas (configurable por ciudad+rubro)
  const filtradosCadena = filtradosGeo.filter((l) => {
    if (l.es_cadena) {
      descartados_cadena++
      return false
    }
    return true
  })

  // Filtro canal digital: descartar si no tiene ningún canal para contactar
  const leads = filtradosCadena.filter((l) => {
    if (!l.whatsapp && !l.instagram && !l.facebook && !l.linktree && !l.tiene_web) {
      descartados_sin_canal_digital++
      return false
    }
    return true
  })

  if (!leads.length) return res.json({ ...respuestaVacia, descartados_cerrados, descartados_sin_contacto, descartados_fuera_ciudad, descartados_cadena, descartados_sin_canal_digital })

  // Verificar duplicados contra Supabase
  const placeIds = leads.map((l) => l.place_id).filter(Boolean)
  const nombres  = leads.map((l) => l.nombre).filter(Boolean)

  const [{ data: existentesPid }, { data: existentesNombre }] = await Promise.all([
    placeIds.length
      ? supabase.from('leads').select('place_id').in('place_id', placeIds)
      : Promise.resolve({ data: [] }),
    supabase.from('leads').select('nombre, ciudad').eq('ciudad', ciudad).in('nombre', nombres),
  ])

  const setPids    = new Set((existentesPid   ?? []).map((e) => e.place_id))
  const setNombres = new Set((existentesNombre ?? []).map((e) => `${e.nombre}||${e.ciudad}`))

  const vistoPids    = new Set()
  const vistoNombres = new Set()

  const nuevos = leads.filter((l) => {
    if (!l.nombre) return false
    if (l.place_id) {
      if (setPids.has(l.place_id) || vistoPids.has(l.place_id)) return false
      vistoPids.add(l.place_id)
    }
    const clave = `${l.nombre}||${l.ciudad}`
    if (setNombres.has(clave) || vistoNombres.has(clave)) return false
    vistoNombres.add(clave)
    return true
  })
  const duplicados = leads.length - nuevos.length

  let insertados = 0
  let insertedIds = []
  if (nuevos.length > 0) {
    // es_cadena es un campo interno de scoring, no una columna de la tabla leads
    const paraInsertar = nuevos.map(({ es_cadena, ...resto }) => resto)
    const { data: insertedRows, error: errInsert } = await supabase
      .from('leads')
      .insert(paraInsertar)
      .select('id, nombre, ciudad, instagram')
    if (errInsert) {
      return res.status(500).json({ error: `Insert error: ${errInsert.message}` })
    }
    insertados = nuevos.length
    insertedIds = insertedRows ?? []
  }

  await supabase
    .from('scraper_config')
    .upsert(
      { ciudad, rubro, ultima_ejecucion: new Date().toISOString(), pais, idioma },
      { onConflict: 'ciudad,rubro' }
    )

  const por_prioridad = { alta: 0, media: 0, baja: 0 }
  for (const l of nuevos) por_prioridad[l.prioridad]++

  // Enriquecer Instagram en background para leads sin Instagram detectado
  // Se dispara sin await para no bloquear la respuesta al frontend
  const sinIG = insertedIds.filter((r) => !r.instagram)
  if (sinIG.length > 0) {
    Promise.allSettled(
      sinIG.map((r) => enriquecerInstagramFn({ leadId: r.id, nombre: r.nombre, ciudad: r.ciudad }))
    ).then((results) => {
      const encontrados = results.filter((r) => r.status === 'fulfilled' && r.value.encontrado).length
      console.log(`[scraper] enriquecimiento IG: ${encontrados}/${sinIG.length} encontrados`)
    })
  }

  return res.json({
    insertados, duplicados,
    descartados_cerrados, descartados_sin_contacto,
    descartados_fuera_ciudad, descartados_cadena, descartados_sin_canal_digital,
    por_prioridad,
  })
})

// ─── Enriquecimiento de Instagram ────────────────────────────────────────────
// Busca en Google site:instagram.com "[nombre]" "[ciudad]" y extrae el username

const IG_ACTOR_ID = 'apify~google-search-scraper'
const IG_BLACKLIST = new Set(['p', 'explore', 'reel', 'tv', 'stories', 'accounts', 'directory', 'about', 'legal'])

function extraerUsernameIG(url) {
  try {
    const { hostname, pathname } = new URL(url)
    if (!hostname.includes('instagram.com')) return null
    const segmento = pathname.split('/').filter(Boolean)[0]
    if (!segmento || IG_BLACKLIST.has(segmento)) return null
    if (/^[a-zA-Z0-9_.]{1,30}$/.test(segmento)) return segmento
  } catch {}
  return null
}

// Lógica central reutilizable (sin HTTP response)
async function enriquecerInstagramFn({ leadId, nombre, ciudad }) {
  const query = ciudad
    ? `site:instagram.com "${nombre}" "${ciudad}"`
    : `site:instagram.com "${nombre}" Argentina`

  let resultados
  try {
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${IG_ACTOR_ID}/run-sync-get-dataset-items`,
      {
        queries:          query,
        maxPagesPerQuery: 1,
        resultsPerPage:   5,
        languageCode:     'es',
        countryCode:      'ar',
      },
      {
        params:  { token: process.env.APIFY_API_TOKEN, memory: 128 },
        timeout: 90_000,
      }
    )
    resultados = Array.isArray(response.data) ? response.data : []
  } catch {
    return { instagram: null, encontrado: false }
  }

  let instagram = null
  for (const pagina of resultados) {
    for (const item of (pagina.organicResults ?? [])) {
      const candidato = extraerUsernameIG(item.url ?? '')
      if (candidato) { instagram = candidato; break }
    }
    if (instagram) break
  }

  if (instagram) {
    await supabase.from('leads').update({ instagram }).eq('id', leadId)
  }

  return { instagram, encontrado: !!instagram }
}

router.post('/enriquecer-instagram', async (req, res) => {
  const { leadId, nombre, ciudad } = req.body
  if (!leadId || !nombre) {
    return res.status(400).json({ error: 'leadId y nombre son requeridos' })
  }
  const resultado = await enriquecerInstagramFn({ leadId, nombre, ciudad })
  return res.json(resultado)
})

export default router
