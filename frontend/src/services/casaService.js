import { supabase } from '../lib/supabase'

export async function fetchUltimosSaldos() {
  return supabase.from('casa_saldos').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
}

export async function crearSaldos(payload) {
  return supabase.from('casa_saldos').insert(payload).select().single()
}

export async function actualizarSaldos(id, payload) {
  return supabase.from('casa_saldos').update(payload).eq('id', id).select().single()
}

export async function fetchMovimientosDelMes(mes) {
  return supabase.from('casa_movimientos').select('*').eq('mes', mes).order('created_at')
}

export async function crearMovimiento(mes, payload) {
  return supabase.from('casa_movimientos').insert({ mes, ...payload }).select().single()
}

export async function actualizarMovimiento(id, payload) {
  return supabase.from('casa_movimientos').update(payload).eq('id', id).select().single()
}

export async function actualizarResueltoMovimiento(id, resuelto) {
  return supabase.from('casa_movimientos').update({ resuelto }).eq('id', id)
}

export async function eliminarMovimiento(id) {
  return supabase.from('casa_movimientos').delete().eq('id', id)
}
