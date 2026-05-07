import { supabase } from '@/lib/supabase/client'

import type { AddColumnCardInput, BoardCardOrderUpdate, ColumnCard } from '../types'

type BoardCardRow = {
  id: string
  column_id: string
  title: string
  description: string
  color: string
  assignee_user_id: string | null
  position: number
  created_at: string
}

type ProfilePick = {
  id: string
  display_name: string | null
  email: string
}

function labelFromProfile(p: ProfilePick | undefined): string {
  if (!p) return ''
  return (p.display_name ?? p.email) || ''
}

async function profileMapForAssignees(assigneeIds: string[]): Promise<Map<string, ProfilePick>> {
  const map = new Map<string, ProfilePick>()
  if (assigneeIds.length === 0) return map
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', assigneeIds)

  if (error) throw error
  for (const p of (data ?? []) as ProfilePick[]) {
    map.set(p.id, p)
  }
  return map
}

function mapRow(row: BoardCardRow, profiles: Map<string, ProfilePick>): ColumnCard {
  const assigneeId = row.assignee_user_id
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    color: row.color,
    assigneeId,
    assigneeLabel: assigneeId ? labelFromProfile(profiles.get(assigneeId)) : '',
    position: row.position,
  }
}

export async function fetchBoardCards(boardId: string): Promise<ColumnCard[]> {
  const { data: cols, error: colError } = await supabase
    .from('board_columns')
    .select('id')
    .eq('board_id', boardId)

  if (colError) throw colError
  const columnIds = (cols ?? []).map((c) => (c as { id: string }).id)
  if (columnIds.length === 0) return []

  const { data: rows, error } = await supabase
    .from('board_cards')
    .select('id, column_id, title, description, color, assignee_user_id, position, created_at')
    .in('column_id', columnIds)
    .order('column_id', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  const list = (rows ?? []) as BoardCardRow[]
  const assigneeIds = [
    ...new Set(list.map((r) => r.assignee_user_id).filter((id): id is string => Boolean(id))),
  ]
  const profiles = await profileMapForAssignees(assigneeIds)
  return list.map((r) => mapRow(r, profiles))
}

export async function createBoardCard(
  columnId: string,
  input: AddColumnCardInput,
): Promise<ColumnCard> {
  const { data: maxRows, error: maxError } = await supabase
    .from('board_cards')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  if (maxError) throw maxError
  const nextPosition =
    maxRows && maxRows.length > 0 && typeof (maxRows[0] as { position: unknown }).position === 'number'
      ? (maxRows[0] as { position: number }).position + 1
      : 0

  const { data, error } = await supabase
    .from('board_cards')
    .insert({
      column_id: columnId,
      title: input.title.trim(),
      description: input.description.trim(),
      color: input.color,
      assignee_user_id: input.assigneeId,
      position: nextPosition,
    })
    .select('id, column_id, title, description, color, assignee_user_id, position, created_at')
    .single()

  if (error) throw error
  const row = data as BoardCardRow
  const profiles = await profileMapForAssignees(row.assignee_user_id ? [row.assignee_user_id] : [])
  return mapRow(row, profiles)
}

export async function updateBoardCard(
  cardId: string,
  columnId: string,
  input: AddColumnCardInput,
): Promise<void> {
  const { error } = await supabase
    .from('board_cards')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      color: input.color,
      assignee_user_id: input.assigneeId,
    })
    .eq('id', cardId)
    .eq('column_id', columnId)

  if (error) throw error
}

export async function deleteBoardCard(cardId: string, columnId: string): Promise<void> {
  const { error } = await supabase.from('board_cards').delete().eq('id', cardId).eq('column_id', columnId)

  if (error) throw error
}

export async function applyBoardCardOrder(updates: BoardCardOrderUpdate[]): Promise<void> {
  if (updates.length === 0) return
  await Promise.all(
    updates.map(async (u) => {
      const { error } = await supabase
        .from('board_cards')
        .update({ column_id: u.columnId, position: u.position })
        .eq('id', u.id)
      if (error) throw error
    }),
  )
}
