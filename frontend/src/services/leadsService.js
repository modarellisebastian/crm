import { supabase } from '../lib/supabase'
import { SCRAPER_URL, scraperHeaders } from '../lib/scraper'

export async function fetchContactadosParaAutoTransicion() {
  const { data } = await supabase
    .from('leads')
    .select('id, fecha_ultimo_movimiento, created_at')
    .eq('estado', 'contactado')
  return data ?? []
}

export async function marcarLeadsSinRespuesta(ids, fecha = new Date().toISOString()) {
  return supabase
    .from('leads')
    .update({ estado: 'sin_respuesta', fecha_ultimo_movimiento: fecha })
    .in('id', ids)
}

export async function countLeadsTotales() {
  return supabase.from('leads').select('*', { count: 'exact', head: true })
}

export async function countLeadsDesde(isoDesde) {
  return supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', isoDesde)
}

export async function countLeadsEnEstados(estados) {
  return supabase.from('leads').select('*', { count: 'exact', head: true }).in('estado', estados)
}

export async function countLeadsCerradosEnRango(inicio, fin) {
  return supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'cerrado')
    .gte('fecha_ultimo_movimiento', inicio)
    .lte('fecha_ultimo_movimiento', fin)
}

export async function fetchUltimosLeads(limite) {
  const { data } = await supabase
    .from('leads')
    .select('id, nombre, rubro, ciudad, estado')
    .order('created_at', { ascending: false })
    .limit(limite)
  return data ?? []
}

export async function fetchColaDeHoy(limite = 60) {
  return supabase
    .from('leads')
    .select('id, nombre, ciudad, rubro, whatsapp, instagram, score, prioridad, estado, created_at')
    .eq('estado', 'nuevo')
    .not('whatsapp', 'is', null)
    .order('score', { ascending: false })
    .limit(limite)
}

export async function marcarLeadContactado(id) {
  const ahora = new Date().toISOString()
  return supabase
    .from('leads')
    .update({ estado: 'contactado', fecha_contacto: ahora, fecha_ultimo_movimiento: ahora })
    .eq('id', id)
}

export async function marcarLeadDescartado(id) {
  return supabase
    .from('leads')
    .update({ estado: 'descartado', fecha_ultimo_movimiento: new Date().toISOString() })
    .eq('id', id)
}

export async function fetchLeadsParaReportes() {
  return supabase
    .from('leads')
    .select('id, estado, ciudad, prioridad, created_at, fecha_ultimo_movimiento, whatsapp, instagram, tiene_web')
}

export async function fetchLeadsConClientes() {
  return Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('lead_id').not('lead_id', 'is', null),
  ])
}

export async function actualizarLead(id, payload) {
  return supabase.from('leads').update(payload).eq('id', id).select().single()
}

export async function actualizarMovimientoLead(id, payload) {
  return supabase
    .from('leads')
    .update({ ...payload, fecha_ultimo_movimiento: new Date().toISOString() })
    .eq('id', id)
}

export async function eliminarLead(id) {
  return supabase.from('leads').delete().eq('id', id)
}

export async function eliminarLeads(ids) {
  return supabase.from('leads').delete().in('id', ids)
}

export async function buscarInstagram({ leadId, nombre, ciudad }) {
  const res = await fetch(`${SCRAPER_URL}/api/enriquecer-instagram`, {
    method: 'POST',
    headers: scraperHeaders(),
    body: JSON.stringify({ leadId, nombre, ciudad }),
  })
  return res.json()
}
