import { supabase } from '@/lib/supabase/client'

import type { Board } from '../types'

type BoardRow = {
  id: string
  title: string
  user_id: string
}

function mapRow(row: BoardRow): Board {
  return { id: row.id, title: row.title, ownerId: row.user_id }
}

export async function fetchBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('id, title, user_id')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as BoardRow[] | null)?.map(mapRow) ?? []
}

export async function createBoard(title: string): Promise<Board> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ title })
    .select('id, title, user_id')
    .single()

  if (error) throw error
  return mapRow(data as BoardRow)
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId)

  if (error) throw error
}
