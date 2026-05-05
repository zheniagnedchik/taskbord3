import { useDeferredValue } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addBoardMember,
  fetchBoardSharingSnapshot,
  removeBoardMember,
  searchProfiles,
} from '@/features/boards/api/board-members'

import { boardsQueryKey } from './use-boards-query'

export const boardSharingQueryKey = (boardId: string) => ['board-sharing', boardId] as const

export function useBoardSharingQuery(boardId: string | undefined, open: boolean) {
  return useQuery({
    queryKey: boardSharingQueryKey(boardId ?? ''),
    queryFn: () => fetchBoardSharingSnapshot(boardId!),
    enabled: open && Boolean(boardId),
  })
}

export function useProfileSearchQuery(searchInput: string, open: boolean) {
  const deferred = useDeferredValue(searchInput.trim())
  const enabled = open && deferred.length > 0

  return useQuery({
    queryKey: ['profile-search', deferred] as const,
    queryFn: () => searchProfiles(deferred),
    enabled,
    staleTime: 30_000,
  })
}

export function useAddBoardMemberMutation(boardId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      boardId ? addBoardMember(boardId, userId) : Promise.reject(new Error('No board')),
    onSuccess: () => {
      if (boardId) void qc.invalidateQueries({ queryKey: boardSharingQueryKey(boardId) })
      void qc.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useRemoveBoardMemberMutation(boardId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      boardId ? removeBoardMember(boardId, userId) : Promise.reject(new Error('No board')),
    onSuccess: () => {
      if (boardId) void qc.invalidateQueries({ queryKey: boardSharingQueryKey(boardId) })
      void qc.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}
