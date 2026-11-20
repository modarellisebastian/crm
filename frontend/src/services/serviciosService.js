import { supabase } from '../lib/supabase'

export async function fetchServiciosDeCliente(clientId) {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function crearServicio(payload) {
  return supabase.from('servicios').insert(payload).select().single()
}

export async function actualizarServicio(id, payload) {
  return supabase.from('servicios').update(payload).eq('id', id).select().single()
}

export async function eliminarServicio(id) {
  return supabase.from('servicios').delete().eq('id', id)
}

export const FRECUENCIAS = ['mensual', 'bimestral', 'trimestral', 'semestral', 'anual']
export const FRECUENCIA_LABEL = {
  mensual:    'Mensual',
  bimestral:  'Bimestral',
  trimestral: 'Trimestral',
  semestral:  'Semestral',
  anual:      'Anual',
}
