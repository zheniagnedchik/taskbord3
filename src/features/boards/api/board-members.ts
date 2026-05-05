import { supabase } from '@/lib/supabase/client'

import type { ProfileSummary } from '../types'

export type BoardSharingSnapshot = {
  ownerId: string
  owner: ProfileSummary | null
  members: ProfileSummary[]
}

type ProfileRow = {
  id: string
  email: string
  display_name: string | null
}

function mapProfileRow(row: ProfileRow): ProfileSummary {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name,
  }
}

/** Strip LIKE wildcards from user input so search stays predictable. */
function sanitizeSearchInput(query: string): string {
  return query.replace(/[%_\\]/g, '').trim()
}

export async function searchProfiles(query: string): Promise<ProfileSummary[]> {
  const safe = sanitizeSearchInput(query)
  if (!safe) return []

  const pattern = `%${safe}%`

  const [byEmail, byName] = await Promise.all([
    supabase.from('profiles').select('id, email, display_name').ilike('email', pattern).limit(40),
    supabase
      .from('profiles')
      .select('id, email, display_name')
      .ilike('display_name', pattern)
      .limit(40),
  ])

  if (byEmail.error) throw byEmail.error
  if (byName.error) throw byName.error

  const rows = [...(byEmail.data ?? []), ...(byName.data ?? [])] as ProfileRow[]
  const seen = new Set<string>()
  const out: ProfileSummary[] = []
  for (const row of rows) {
    if (!row || seen.has(row.id)) continue
    seen.add(row.id)
    out.push(mapProfileRow(row))
  }
  return out.slice(0, 50)
}

export async function fetchBoardSharingSnapshot(boardId: string): Promise<BoardSharingSnapshot> {
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('user_id')
    .eq('id', boardId)
    .single()

  if (boardError) throw boardError

  const ownerId = (board as { user_id: string }).user_id

  const { data: memberRows, error: memError } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', boardId)

  if (memError) throw memError

  const memberIds = (memberRows as { user_id: string }[] | null)?.map((r) => r.user_id) ?? []
  const uniqueIds = [...new Set([ownerId, ...memberIds])]

  const { data: profRows, error: profError } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', uniqueIds)

  if (profError) throw profError

  const profiles = (profRows as ProfileRow[] | null)?.map(mapProfileRow) ?? []
  const byId = new Map(profiles.map((p) => [p.id, p]))

  return {
    ownerId,
    owner: byId.get(ownerId) ?? null,
    members: memberIds.map((id) => byId.get(id)).filter((p): p is ProfileSummary => Boolean(p)),
  }
}

export async function addBoardMember(boardId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('board_members').insert({ board_id: boardId, user_id: userId })

  if (error) throw error
}

export async function removeBoardMember(boardId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('board_members').delete().eq('board_id', boardId).eq('user_id', userId)

  if (error) throw error
}
