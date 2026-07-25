import { supabase } from '../lib/supabase'

export async function crearServicios(servicios) {
  return supabase.from('servicios').insert(servicios)
}

export async function eliminarServicios(ids) {
  return supabase.from('servicios').delete().in('id', ids)
}
