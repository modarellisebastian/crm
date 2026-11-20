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

// Duplica los movimientos de un mes a otro (nombre, tipo, categoría, moneda,
// monto, vencimiento) reseteando `resuelto` a false — para no tener que cargar
// a mano los mismos gastos/ingresos recurrentes todos los meses.
export async function copiarMovimientosDeMes(mesOrigen, mesDestino) {
  const { data: origen, error: errFetch } = await supabase
    .from('casa_movimientos')
    .select('nombre, tipo_movimiento, categoria, moneda, monto, vencimiento_dia, notas')
    .eq('mes', mesOrigen)

  if (errFetch) return { data: null, error: errFetch }
  if (!origen?.length) return { data: [], error: null }

  const nuevos = origen.map((m) => ({ ...m, mes: mesDestino, resuelto: false }))
  return supabase.from('casa_movimientos').insert(nuevos).select()
}

// Igual que copiarMovimientosDeMes pero filtra por tipo ('egreso' o 'ingreso')
export async function copiarMovimientosPorTipo(mesOrigen, mesDestino, tipo) {
  const { data: origen, error: errFetch } = await supabase
    .from('casa_movimientos')
    .select('nombre, tipo_movimiento, categoria, moneda, monto, vencimiento_dia, notas')
    .eq('mes', mesOrigen)
    .eq('tipo_movimiento', tipo)

  if (errFetch) return { data: null, error: errFetch }
  if (!origen?.length) return { data: [], error: null }

  const nuevos = origen.map((m) => ({ ...m, mes: mesDestino, resuelto: false }))
  return supabase.from('casa_movimientos').insert(nuevos).select()
}
