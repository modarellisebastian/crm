import { supabase } from '../lib/supabase'

export async function fetchPaymentsConCliente() {
  return supabase.from('payments').select('*, clients(nombre)').order('fecha_cobro', { ascending: false })
}

export async function fetchMontosFacturadosEnRango(desde, hasta) {
  return supabase.from('payments').select('monto').gte('fecha_cobro', desde).lte('fecha_cobro', hasta)
}

export async function fetchMontosPendientes() {
  return supabase.from('payments').select('monto').eq('pagado', false)
}

export async function crearPayment(payload) {
  return supabase.from('payments').insert(payload).select('*, clients(nombre)').single()
}

export async function crearPaymentDeCliente(payload) {
  return supabase.from('payments').insert(payload).select().single()
}

export async function actualizarPagado(id, pagado) {
  return supabase.from('payments').update({ pagado }).eq('id', id)
}

export async function eliminarPayment(id) {
  return supabase.from('payments').delete().eq('id', id)
}
