import PropTypes from 'prop-types'
import { useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

function SortableWidget ({ id, label, importance, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const classes = ['widget-item', importance === 'core' ? 'focus-core' : 'focus-optional']
  if (isDragging) classes.push('dragging')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classes.join(' ')}
      data-label={label}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

SortableWidget.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  importance: PropTypes.oneOf(['core', 'optional']).isRequired,
  children: PropTypes.node
}

export function WidgetBoard ({ items, order, onOrderChange, focusMode }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const visibleIds = useMemo(() => (
    focusMode
      ? order.filter((id) => items[id]?.importance === 'core')
      : order.filter((id) => Boolean(items[id]))
  ), [focusMode, order, items])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(active.id)
    const newIndex = order.indexOf(over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const nextOrder = arrayMove(order, oldIndex, newIndex)
    onOrderChange(nextOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={visibleIds} strategy={verticalListSortingStrategy}>
        <div className="widget-board">
          {visibleIds.map((id) => {
            const widget = items[id]
            return (
              <SortableWidget key={id} id={id} label={widget.label} importance={widget.importance}>
                {widget.node}
              </SortableWidget>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

WidgetBoard.propTypes = {
  items: PropTypes.object.isRequired,
  order: PropTypes.arrayOf(PropTypes.string).isRequired,
  onOrderChange: PropTypes.func.isRequired,
  focusMode: PropTypes.bool
}
