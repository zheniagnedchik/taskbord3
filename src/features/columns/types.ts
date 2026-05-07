export type ColumnId = string

export type BoardColumn = {
  id: ColumnId
  boardId: string
  title: string
  /** CSS hex color, e.g. #6366f1 */
  color: string
  position: number
}

export type ColumnCardId = string

/** Card on a board column (persisted in Supabase). */
export type ColumnCard = {
  id: ColumnCardId
  columnId: ColumnId
  title: string
  description: string
  color: string
  assigneeId: string | null
  /** Resolved from `profiles` when loading; empty if unassigned. */
  assigneeLabel: string
  position: number
}

export type BoardCardOrderUpdate = {
  id: string
  columnId: string
  position: number
}

export type AddColumnCardInput = {
  title: string
  description: string
  color: string
  assigneeId: string | null
  /** Client-only hint when saving; server resolves label via profiles. */
  assigneeLabel: string
}
