import type { TFunction } from 'i18next'
import { useState } from 'react'

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { boardColumnDropId } from '@/features/columns/utils/compute-board-card-order'

import type { BoardColumn, ColumnCard } from '../types'
import { BoardCardDragPreview, SortableBoardCard } from './SortableBoardCard'

type BoardColumnsBarProps = {
  columns: BoardColumn[]
  cards: ColumnCard[]
  onAdd: () => void
  onEdit: (column: BoardColumn) => void
  onDeleteColumn: (column: BoardColumn) => void
  onAddCard: (columnId: string) => void
  onEditCard: (card: ColumnCard) => void
  onDeleteCard: (card: ColumnCard) => void
  onDragEnd: (event: DragEndEvent) => void
}

function ColumnDropZone({
  col,
  columnCards,
  onEditCard,
  onDeleteCard,
  onAddCard,
  t,
}: {
  col: BoardColumn
  columnCards: ColumnCard[]
  onEditCard: (card: ColumnCard) => void
  onDeleteCard: (card: ColumnCard) => void
  onAddCard: (columnId: string) => void
  t: TFunction
}) {
  const { setNodeRef, isOver } = useDroppable({ id: boardColumnDropId(col.id) })
  const sortableIds = columnCards.map((c) => c.id)

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          'flex max-h-[min(50vh,360px)] min-h-[72px] flex-col gap-1.5 overflow-y-auto px-2 py-2',
          isOver && 'rounded-md bg-white/[0.04] ring-1 ring-white/20',
        )}
      >
        {columnCards.length === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">{t('columns.noCards')}</p>
        ) : (
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {columnCards.map((card) => (
              <SortableBoardCard key={card.id} card={card} onEdit={onEditCard} onDelete={onDeleteCard} />
            ))}
          </SortableContext>
        )}
      </div>
      <div className="shrink-0 border-t border-white/[0.08] p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full gap-1.5 border-white/[0.12] bg-white/[0.02] text-xs hover:bg-white/[0.06]"
          onClick={() => onAddCard(col.id)}
        >
          <Plus className="size-3.5" aria-hidden />
          {t('columns.addCard')}
        </Button>
      </div>
    </>
  )
}

export function BoardColumnsBar({
  columns,
  cards,
  onAdd,
  onEdit,
  onDeleteColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDragEnd,
}: BoardColumnsBarProps) {
  const { t } = useTranslation()
  const [activeDragCard, setActiveDragCard] = useState<ColumnCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const card = cards.find((c) => c.id === id)
    setActiveDragCard(card ?? null)
  }

  function handleDragCancel() {
    setActiveDragCard(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragCard(null)
    onDragEnd(event)
  }

  if (columns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-14 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          {t('columns.emptyState')}
        </p>
        <Button type="button" onClick={onAdd} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          {t('columns.addColumn')}
        </Button>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-2">
          {columns.map((col) => {
            const columnCards = cards
              .filter((c) => c.columnId === col.id)
              .sort((a, b) => {
                if (a.position !== b.position) return a.position - b.position
                return a.id.localeCompare(b.id)
              })
            return (
              <div
                key={col.id}
                className={cn(
                  'flex w-[220px] shrink-0 flex-col rounded-lg border border-white/[0.08] bg-white/[0.03]',
                  'shadow-[inset_3px_0_0_0_var(--col-accent)]',
                )}
                style={{ ['--col-accent' as string]: col.color }}
              >
                <div className="flex shrink-0 items-stretch border-b border-white/[0.08]">
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: col.color }}
                      aria-hidden
                    />
                    <span className="truncate text-sm font-medium text-foreground">{col.title}</span>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                      aria-label={t('columns.editColumnAria', { title: col.title })}
                      onClick={() => onEdit(col)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('columns.deleteColumnAria', { title: col.title })}
                      onClick={() => onDeleteColumn(col)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>

                <ColumnDropZone
                  col={col}
                  columnCards={columnCards}
                  onEditCard={onEditCard}
                  onDeleteCard={onDeleteCard}
                  onAddCard={onAddCard}
                  t={t}
                />
              </div>
            )
          })}
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-[120px] min-w-[44px] shrink-0 self-start border-dashed border-white/[0.14] bg-transparent hover:bg-white/[0.05]"
            onClick={onAdd}
            aria-label={t('columns.addColumnAria')}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      <DragOverlay>{activeDragCard ? <BoardCardDragPreview card={activeDragCard} /> : null}</DragOverlay>
    </DndContext>
  )
}
