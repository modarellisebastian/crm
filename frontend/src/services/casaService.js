import { supabase } from '../lib/supabase'

export async function fetchUltimosSaldos() {
  return supabase.from('casa_saldos').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
}

export async function fetchGastosDelMes(mes) {
  return supabase.from('casa_gastos_fijos').select('*').eq('mes', mes).order('created_at')
}

export async function fetchIngresosDelMes(mes) {
  return supabase.from('casa_ingresos').select('*').eq('mes', mes).order('created_at')
}

export async function crearSaldos(payload) {
  return supabase.from('casa_saldos').insert(payload).select().single()
}

export async function actualizarSaldos(id, payload) {
  return supabase.from('casa_saldos').update(payload).eq('id', id).select().single()
}

export async function crearGasto(mes, payload) {
  return supabase.from('casa_gastos_fijos').insert({ mes, ...payload }).select().single()
}

export async function actualizarGasto(id, payload) {
  return supabase.from('casa_gastos_fijos').update(payload).eq('id', id).select().single()
}

export async function actualizarPagadoGasto(id, pagado) {
  return supabase.from('casa_gastos_fijos').update({ pagado }).eq('id', id)
}

export async function eliminarGasto(id) {
  return supabase.from('casa_gastos_fijos').delete().eq('id', id)
}

export async function crearIngreso(mes, payload) {
  return supabase.from('casa_ingresos').insert({ mes, ...payload }).select().single()
}

export async function actualizarIngreso(id, payload) {
  return supabase.from('casa_ingresos').update(payload).eq('id', id).select().single()
}

export async function actualizarCobradoIngreso(id, cobrado) {
  return supabase.from('casa_ingresos').update({ cobrado }).eq('id', id)
}

export async function eliminarIngreso(id) {
  return supabase.from('casa_ingresos').delete().eq('id', id)
}
