import type { UniqueIdentifier } from '@dnd-kit/core'

import type { BoardCardOrderUpdate, BoardColumn, ColumnCard } from '@/features/columns/types'

export const BOARD_COLUMN_DROP_PREFIX = 'column-drop::' as const

export function boardColumnDropId(columnId: string): string {
  return `${BOARD_COLUMN_DROP_PREFIX}${columnId}`
}

function sortCardsInColumn(a: ColumnCard, b: ColumnCard): number {
  if (a.position !== b.position) return a.position - b.position
  return a.id.localeCompare(b.id)
}

/** Returns DB updates, or null when nothing changes / invalid drag. */
export function computeBoardCardOrderUpdates(
  columns: BoardColumn[],
  cards: ColumnCard[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | null,
): BoardCardOrderUpdate[] | null {
  if (overId == null) return null

  const activeStr = String(activeId)
  const overStr = String(overId)
  if (activeStr === overStr) return null

  const activeCard = cards.find((c) => c.id === activeStr)
  if (!activeCard) return null

  const columnIds = columns.map((c) => c.id)
  const lists = new Map<string, ColumnCard[]>()
  for (const cid of columnIds) {
    lists.set(cid, cards.filter((c) => c.columnId === cid).sort(sortCardsInColumn))
  }

  const srcCol = activeCard.columnId
  const srcList = lists.get(srcCol)
  if (!srcList) return null
  const srcIdx = srcList.findIndex((c) => c.id === activeStr)
  if (srcIdx === -1) return null
  const [removed] = srcList.splice(srcIdx, 1)

  let targetCol: string
  let insertIndex: number

  if (overStr.startsWith(BOARD_COLUMN_DROP_PREFIX)) {
    targetCol = overStr.slice(BOARD_COLUMN_DROP_PREFIX.length)
    if (!lists.has(targetCol)) return null
    insertIndex = lists.get(targetCol)!.length
  } else {
    const overCard = cards.find((c) => c.id === overStr)
    if (!overCard) return null
    targetCol = overCard.columnId
    const tList = lists.get(targetCol)
    if (!tList) return null
    const overIdx = tList.findIndex((c) => c.id === overStr)
    if (overIdx === -1) return null
    insertIndex = overIdx
  }

  lists.get(targetCol)!.splice(insertIndex, 0, removed)

  const prevById = new Map(cards.map((c) => [c.id, c] as const))
  const updates: BoardCardOrderUpdate[] = []

  for (const cid of columnIds) {
    const list = lists.get(cid)!
    list.forEach((card, idx) => {
      const prev = prevById.get(card.id)!
      if (prev.columnId !== cid || prev.position !== idx) {
        updates.push({ id: card.id, columnId: cid, position: idx })
      }
    })
  }

  return updates.length > 0 ? updates : null
}
