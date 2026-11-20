import { supabase } from '../lib/supabase'
import { crearMovimiento } from './casaService'

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchCobrosDeCliente(clientId) {
  const { data, error } = await supabase
    .from('cobros')
    .select('*')
    .eq('client_id', clientId)
    .order('fecha_vencimiento', { ascending: false })
  return { data: data ?? [], error }
}

export async function crearCobro(payload) {
  return supabase.from('cobros').insert(payload).select('*').single()
}

export async function actualizarCobro(id, payload) {
  return supabase.from('cobros').update(payload).eq('id', id).select('*').single()
}

export async function eliminarCobro(id) {
  return supabase.from('cobros').delete().eq('id', id)
}

// ─── Marcar como pagado + sync a Casa ────────────────────────────────────────

/**
 * Marca un cobro como pagado y crea el movimiento correspondiente en Casa.
 * @param {object} cobro - El cobro completo
 * @param {string} clienteNombre - Nombre del cliente
 * @param {object} opts - { tipo_cambio?: number, monto_ars?: number }
 */
export async function marcarPagado(cobro, clienteNombre, opts = {}) {
  const fechaCobro = new Date().toISOString().slice(0, 10)
  const mes = fechaCobro.slice(0, 7) // YYYY-MM
  const dia = parseInt(fechaCobro.slice(8, 10))

  const montoArs = cobro.moneda === 'usd'
    ? opts.monto_ars ?? (cobro.monto * (opts.tipo_cambio ?? 1))
    : cobro.monto

  // Crear movimiento en Casa
  const { data: movimiento, error: errMov } = await crearMovimiento(mes, {
    nombre:          `${clienteNombre} — ${cobro.descripcion}`,
    tipo_movimiento: 'ingreso',
    categoria:       cobro.moneda === 'usd' ? 'sueldo_usd' : 'freelance',
    moneda:          cobro.moneda,
    monto:           cobro.moneda === 'usd' ? cobro.monto : montoArs,
    vencimiento_dia: dia,
    resuelto:        true,
    notas:           cobro.notas ?? null,
  })

  if (errMov) return { data: null, error: errMov }

  // Actualizar cobro
  const { data, error } = await actualizarCobro(cobro.id, {
    pagado:             true,
    fecha_cobro:        fechaCobro,
    tipo_cambio:        opts.tipo_cambio ?? null,
    monto_ars:          montoArs,
    movimiento_casa_id: movimiento.id,
  })

  return { data, error }
}

/**
 * Desmarcar pagado: elimina el movimiento de Casa (si existe) y resetea el cobro.
 */
export async function desmarcarPagado(cobro) {
  // Eliminar movimiento de Casa si existe
  if (cobro.movimiento_casa_id) {
    await supabase.from('casa_movimientos').delete().eq('id', cobro.movimiento_casa_id)
  }

  return actualizarCobro(cobro.id, {
    pagado:             false,
    fecha_cobro:        null,
    tipo_cambio:        null,
    monto_ars:          null,
    movimiento_casa_id: null,
  })
}

// ─── Generar cobro desde servicio ────────────────────────────────────────────

/**
 * Genera un cobro a partir de un servicio, con la descripción y monto pre-cargados.
 */
export function cobroDesdeServicio(servicio, clientId) {
  const hoy = new Date()
  const mes = hoy.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  return {
    client_id:        clientId,
    servicio_id:      servicio.id,
    descripcion:      `${servicio.nombre} — ${mes}`,
    monto:            servicio.monto,
    moneda:           servicio.moneda,
    fecha_vencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10),
    pagado:           false,
  }
}
