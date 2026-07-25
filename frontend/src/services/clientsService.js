import { supabase } from '../lib/supabase'

const SELECT_COMPLETO = '*, leads(nombre, rubro, ciudad), payments(*), servicios(*)'

export async function fetchClientesParaSelect() {
  return supabase.from('clients').select('id, nombre').order('nombre')
}

export async function fetchLeadIdsConCliente() {
  return supabase.from('clients').select('lead_id').not('lead_id', 'is', null)
}

export async function fetchClientesCompletos() {
  return supabase.from('clients').select(SELECT_COMPLETO).order('created_at', { ascending: false })
}

export async function fetchClienteCompleto(id) {
  return supabase.from('clients').select(SELECT_COMPLETO).eq('id', id).single()
}

export async function crearClienteDesdeLead(lead, datos) {
  return supabase
    .from('clients')
    .insert({ lead_id: lead.id, nombre: lead.nombre, ...datos })
    .select()
    .single()
}

export async function crearCliente(payload) {
  return supabase.from('clients').insert(payload).select().single()
}

export async function actualizarCliente(id, payload) {
  return supabase.from('clients').update(payload).eq('id', id)
}

export async function eliminarCliente(id) {
  return supabase.from('clients').delete().eq('id', id)
}
