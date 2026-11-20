import { supabase } from '../lib/supabase'

const SELECT_COMPLETO = '*, leads(nombre, rubro, ciudad)'

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

// ─── notas de cliente ─────────────────────────────────────────────────────────

export async function fetchClientNotes(clientId) {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function addClientNote(clientId, texto) {
  return supabase.from('client_notes').insert({ client_id: clientId, texto }).select().single()
}

export async function deleteClientNote(id) {
  return supabase.from('client_notes').delete().eq('id', id)
}
