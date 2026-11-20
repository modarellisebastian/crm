import { supabase } from '../lib/supabase'

/** Trae todas las propuestas ordenadas por fecha desc */
export async function fetchPropuestas() {
  const { data, error } = await supabase
    .from('propuestas')
    .select('*')
    .order('fecha', { ascending: false })
  return { data: data ?? [], error }
}

/** Crea una propuesta nueva */
export async function crearPropuesta(campos) {
  const { data, error } = await supabase
    .from('propuestas')
    .insert([campos])
    .select()
    .single()
  return { data, error }
}

/** Actualiza campos de una propuesta */
export async function actualizarPropuesta(id, campos) {
  const { data, error } = await supabase
    .from('propuestas')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

/** Elimina una propuesta */
export async function eliminarPropuesta(id) {
  const { error } = await supabase.from('propuestas').delete().eq('id', id)
  return { error }
}

/** Stats: conteo por estado y total de monto aceptado */
export async function fetchPropuestaStats() {
  const { data, error } = await supabase.from('propuestas').select('estado, monto')
  if (error || !data) return { stats: {}, montoAceptado: 0 }

  const stats = { borrador: 0, enviada: 0, aceptada: 0, rechazada: 0 }
  let montoAceptado = 0

  for (const p of data) {
    if (stats[p.estado] !== undefined) stats[p.estado]++
    if (p.estado === 'aceptada') montoAceptado += Number(p.monto)
  }

  return { stats, montoAceptado }
}

/** Propuestas que coincidan con el nombre de un cliente */
export async function fetchPropuestasByCliente(nombre) {
  const { data, error } = await supabase
    .from('propuestas')
    .select('*')
    .ilike('cliente_nombre', `%${nombre}%`)
    .order('fecha', { ascending: false })
  return { data: data ?? [], error }
}

/** Genera el próximo número de propuesta: #000001, #000002... */
export async function generarNumeroPropuesta() {
  const { data } = await supabase
    .from('propuestas')
    .select('numero')
    .order('created_at', { ascending: false })
    .limit(1)
  const ultimo = data?.[0]?.numero
  let n = 1
  if (ultimo) {
    const parsed = parseInt(ultimo.replace('#', ''), 10)
    if (!isNaN(parsed)) n = parsed + 1
  }
  return `#${String(n).padStart(6, '0')}`
}
