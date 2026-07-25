import { useEffect, useState } from 'react'
import Tooltip from '../../components/ui/Tooltip'
import { fetchClientesCompletos } from '../../services/clientsService'
import { formatARS, diasHasta } from './constants'
import ModalCliente from './ModalCliente'
import FilaCliente from './FilaCliente'

export default function Clientes() {
  const [clientes,      setClientes]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [modalCliente,  setModalCliente]  = useState(null)

  useEffect(() => {
    async function fetchClientes() {
      const { data, error } = await fetchClientesCompletos()
      if (error) setError(error.message)
      else setClientes(data)
      setLoading(false)
    }
    fetchClientes()
  }, [])

  function handleEditar(cliente) { setModalCliente({ cliente }) }
  function handleEliminar(id)    { setClientes((prev) => prev.filter((c) => c.id !== id)) }

  function handleClienteGuardado(clienteActualizado) {
    setClientes((prev) => {
      const existe = prev.find((c) => c.id === clienteActualizado.id)
      return existe
        ? prev.map((c) => c.id === clienteActualizado.id ? clienteActualizado : c)
        : [clienteActualizado, ...prev]
    })
    setModalCliente(null)
  }

  // Métricas
  const pagosFlat = clientes.flatMap((c) => c.payments ?? [])
  const { inicio, fin } = (() => {
    const now = new Date()
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      fin:    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    }
  })()
  const pendienteTotal = pagosFlat.filter((p) => !p.pagado).reduce((s, p) => s + (p.monto ?? 0), 0)
  const cobradoMes     = pagosFlat
    .filter((p) => p.pagado && p.fecha_cobro >= inicio && p.fecha_cobro <= fin)
    .reduce((s, p) => s + (p.monto ?? 0), 0)
  const proxVencimientos = clientes.filter((c) => {
    const d = diasHasta(c.fecha_vencimiento_hosting)
    return d !== null && d >= 0 && d <= 30
  }).length

  if (loading) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
      <p className="text-sm text-gray-400">Cargando clientes…</p>
    </div>
  )

  if (error) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
      <p className="text-sm text-red-500">Error: {error}</p>
    </div>
  )

  return (
    <>
      <div className="space-y-8">

        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
            <p className="text-sm text-gray-400 mt-0.5">Hacé click en el nombre para ver y registrar cobros</p>
          </div>
          <button
            onClick={() => setModalCliente('nuevo')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nuevo cliente
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Clientes activos',
              value: clientes.length,
              tooltip: 'Total de clientes registrados en el CRM.',
              accent: 'border-gray-200',
            },
            {
              label: 'Cobrado este mes',
              value: formatARS(cobradoMes),
              tooltip: 'Total marcado como cobrado con fecha en el mes actual.',
              accent: 'border-green-100',
            },
            {
              label: 'Pendiente de cobro',
              value: formatARS(pendienteTotal),
              tooltip: 'Total de cobros registrados que aún no fueron marcados como pagados, de todos los clientes.',
              accent: pendienteTotal > 0 ? 'border-amber-200' : 'border-gray-200',
            },
          ].map(({ label, value, tooltip, accent }) => (
            <div key={label} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-1 ${accent}`}>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <Tooltip text={tooltip} />
              </div>
              <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Alerta vencimientos */}
        {proxVencimientos > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{proxVencimientos} cliente{proxVencimientos !== 1 ? 's' : ''}</span>
              {' '}tiene{proxVencimientos !== 1 ? 'n' : ''} el hosting por vencer en los próximos 30 días.
            </p>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Servicios
                      <Tooltip text="Servicios activos contratados. Se usan para pre-completar el monto al registrar cobros. Los podés gestionar desde el botón de editar." wide />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Hosting
                      <Tooltip text="Fecha de vencimiento del plan de hosting. Amarillo = menos de 30 días. Rojo = ya vencido." />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Pendiente
                      <Tooltip text="Cobros registrados que aún no fueron marcados como pagados. Se desglosa por tipo de servicio." wide />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <div className="space-y-2">
                        <svg className="w-8 h-8 text-gray-200 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10Z" clipRule="evenodd" />
                          <path d="M3 15.055v-.93a49.176 49.176 0 008 .53c2.769 0 5.448-.294 8-.53v.93c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-11.274 0C3.985 17.585 3 16.402 3 15.055Z" />
                        </svg>
                        <p className="text-sm text-gray-400">No hay clientes todavía.</p>
                        <p className="text-xs text-gray-400">Creá uno con "Nuevo cliente" o convertí un lead cerrado desde la sección Leads.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <FilaCliente
                      key={cliente.id}
                      cliente={cliente}
                      onEditar={handleEditar}
                      onEliminar={handleEliminar}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalCliente && (
        <ModalCliente
          clienteInicial={modalCliente === 'nuevo' ? null : modalCliente.cliente}
          onGuardar={handleClienteGuardado}
          onCerrar={() => setModalCliente(null)}
        />
      )}
    </>
  )
}
