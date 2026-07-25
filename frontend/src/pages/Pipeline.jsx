import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { fetchLeadsParaPipeline, actualizarEstadoLead } from '../services/leadsService'

// Columnas principales del funnel (en orden)
const COLUMNAS_FUNNEL = [
  { id: 'nuevo',          label: 'Nuevo',          color: 'bg-blue-500' },
  { id: 'contactado',     label: 'Contactado',     color: 'bg-yellow-500' },
  { id: 'sin_respuesta',  label: 'Sin respuesta',  color: 'bg-red-400' },
  { id: 'interesado',     label: 'Interesado',     color: 'bg-teal-500' },
  { id: 'en_espera',      label: 'En espera',      color: 'bg-indigo-400' },
  { id: 'demo_enviado',   label: 'Demo enviado',   color: 'bg-purple-500' },
  { id: 'negociando',     label: 'Negociando',     color: 'bg-orange-500' },
  { id: 'cerrado',        label: 'Cerrado',        color: 'bg-green-500' },
]

const COLUMNA_DESCARTADO = { id: 'descartado', label: 'Descartado', color: 'bg-gray-400' }

// Construye el mapa columnaId → [leads] a partir del array plano
function agruparPorEstado(leads) {
  const mapa = {}
  ;[...COLUMNAS_FUNNEL, COLUMNA_DESCARTADO].forEach(({ id }) => { mapa[id] = [] })
  leads.forEach((lead) => {
    const col = mapa[lead.estado]
    if (col) col.push(lead)
  })
  return mapa
}

function LeadCard({ lead, index }) {
  return (
    <Draggable draggableId={String(lead.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={[
            'bg-white rounded-lg border border-gray-200 p-3 space-y-1 select-none',
            'transition-shadow',
            snapshot.isDragging ? 'shadow-lg rotate-1' : 'shadow-sm hover:shadow-md',
          ].join(' ')}
        >
          <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
            {lead.nombre ?? <span className="text-gray-300 font-normal italic">Sin nombre</span>}
          </p>
          {lead.rubro && (
            <p className="text-xs text-gray-500 truncate">{lead.rubro}</p>
          )}
          {lead.ciudad && (
            <p className="text-xs text-gray-400 truncate">{lead.ciudad}</p>
          )}
          {lead.notas && (
            <p className="text-xs text-gray-400 italic truncate border-t border-gray-100 pt-1 mt-1" title={lead.notas}>
              {lead.notas}
            </p>
          )}
        </div>
      )}
    </Draggable>
  )
}

function Columna({ columna, leads }) {
  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${columna.color}`} />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
          {columna.label}
        </span>
        <span className="ml-auto text-xs text-gray-400 font-medium tabular-nums">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={columna.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              'flex-1 rounded-xl p-2 space-y-2 min-h-[120px] transition-colors',
              snapshot.isDraggingOver ? 'bg-gray-200' : 'bg-gray-100',
            ].join(' ')}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

export default function Pipeline() {
  const [columnas, setColumnas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await fetchLeadsParaPipeline()

      if (error) {
        setError(error.message)
      } else {
        setColumnas(agruparPorEstado(data))
      }
      setLoading(false)
    }
    fetchLeads()
  }, [])

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result

    // Soltado fuera de una columna o en el mismo lugar
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const origenId = source.droppableId
    const destinoId = destination.droppableId

    // Actualización optimista del estado local
    setColumnas((prev) => {
      const siguiente = { ...prev }
      const origenArr = [...siguiente[origenId]]
      const destinoArr = origenId === destinoId ? origenArr : [...siguiente[destinoId]]

      const [movido] = origenArr.splice(source.index, 1)
      const leadActualizado = { ...movido, estado: destinoId }
      destinoArr.splice(destination.index, 0, leadActualizado)

      siguiente[origenId] = origenArr
      if (origenId !== destinoId) siguiente[destinoId] = destinoArr

      return siguiente
    })

    // Persistir en Supabase
    const { error } = await actualizarEstadoLead(draggableId, destinoId)

    if (error) {
      // Revertir si falla
      setColumnas((prev) => {
        const revertido = { ...prev }
        const destinoArr = [...revertido[destinoId]]
        const origenArr = origenId === destinoId ? destinoArr : [...revertido[origenId]]

        const idx = destinoArr.findIndex((l) => l.id === draggableId)
        if (idx !== -1) {
          const [movido] = destinoArr.splice(idx, 1)
          const leadRevertido = { ...movido, estado: origenId }
          origenArr.splice(source.index, 0, leadRevertido)
        }

        revertido[destinoId] = destinoArr
        if (origenId !== destinoId) revertido[origenId] = origenArr
        return revertido
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800">Pipeline</h1>
        <p className="text-sm text-gray-400">Cargando leads...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800">Pipeline</h1>
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  const totalActivos = COLUMNAS_FUNNEL.reduce((acc, col) => acc + columnas[col.id].length, 0)

  return (
    <div className="space-y-5 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Pipeline</h1>
        <span className="text-sm text-gray-400">{totalActivos} lead{totalActivos !== 1 ? 's' : ''} activos</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Funnel principal */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNAS_FUNNEL.map((col) => (
            <Columna key={col.id} columna={col} leads={columnas[col.id]} />
          ))}
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-dashed border-gray-300" />
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">Descartados</span>
          <div className="flex-1 border-t border-dashed border-gray-300" />
        </div>

        {/* Columna descartados */}
        <div className="flex">
          <Columna columna={COLUMNA_DESCARTADO} leads={columnas.descartado} />
        </div>
      </DragDropContext>
    </div>
  )
}
