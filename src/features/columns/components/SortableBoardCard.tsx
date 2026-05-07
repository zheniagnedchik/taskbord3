import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ColumnCard } from '../types'

/** Snapshot for DragOverlay (portal); avoids clipping by column overflow. */
export function BoardCardDragPreview({ card }: { card: ColumnCard }) {
  return (
    <div
      className="flex w-[204px] cursor-grabbing flex-col gap-1 rounded-md border border-white/[0.12] bg-[#0a0a0a] px-2 py-1.5 shadow-2xl ring-1 ring-white/10"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: card.color,
      }}
    >
      <p className="line-clamp-2 text-sm font-medium text-foreground">{card.title}</p>
      {card.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
      ) : null}
      {card.assigneeLabel ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.assigneeLabel}</p>
      ) : null}
    </div>
  )
}

type SortableBoardCardProps = {
  card: ColumnCard
  onEdit: (card: ColumnCard) => void
  onDelete: (card: ColumnCard) => void
}

export function SortableBoardCard({ card, onEdit, onDelete }: SortableBoardCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ['--card-accent' as string]: card.color,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1.5',
        'border-l-[3px] border-l-[var(--card-accent)]',
      )}
    >
      <div
        className="min-w-0 flex-1 cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <p className="line-clamp-2 text-sm font-medium text-foreground">{card.title}</p>
        {card.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>
        ) : null}
        {card.assigneeLabel ? (
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{card.assigneeLabel}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          aria-label={t('columns.editCardAria', { title: card.title })}
          onClick={(e) => {
            e.stopPropagation()
            onEdit(card)
          }}
        >
          <Pencil className="size-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('columns.deleteCardAria', { title: card.title })}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card)
          }}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
