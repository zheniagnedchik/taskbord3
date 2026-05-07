import { supabase } from '@/lib/supabase/client'

import type { BoardColumn } from '../types'

type BoardColumnRow = {
  id: string
  board_id: string
  title: string
  color: string
  position: number
}

function mapRow(row: BoardColumnRow): BoardColumn {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    color: row.color,
    position: row.position,
  }
}

export async function fetchColumns(boardId: string): Promise<BoardColumn[]> {
  const { data, error } = await supabase
    .from('board_columns')
    .select('id, board_id, title, color, position')
    .eq('board_id', boardId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as BoardColumnRow[]).map(mapRow)
}

export async function createColumn(
  boardId: string,
  input: { title: string; color: string },
): Promise<BoardColumn> {
  const { data: maxRows, error: maxError } = await supabase
    .from('board_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)

  if (maxError) throw maxError
  const nextPosition =
    maxRows && maxRows.length > 0 && typeof (maxRows[0] as { position: unknown }).position === 'number'
      ? (maxRows[0] as { position: number }).position + 1
      : 0

  const { data, error } = await supabase
    .from('board_columns')
    .insert({
      board_id: boardId,
      title: input.title.trim(),
      color: input.color,
      position: nextPosition,
    })
    .select('id, board_id, title, color, position')
    .single()

  if (error) throw error
  return mapRow(data as BoardColumnRow)
}

export async function updateColumn(
  columnId: string,
  input: { title: string; color: string },
  boardId?: string,
): Promise<void> {
  let q = supabase
    .from('board_columns')
    .update({ title: input.title.trim(), color: input.color })
    .eq('id', columnId)

  if (boardId) {
    q = q.eq('board_id', boardId)
  }

  const { error } = await q

  if (error) throw error
}

export async function deleteColumn(columnId: string, boardId: string): Promise<void> {
  const { error } = await supabase
    .from('board_columns')
    .delete()
    .eq('id', columnId)
    .eq('board_id', boardId)

  if (error) throw error
}
