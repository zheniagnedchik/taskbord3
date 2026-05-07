import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  applyBoardCardOrder,
  createBoardCard,
  deleteBoardCard,
  fetchBoardCards,
  updateBoardCard,
} from '@/features/columns/api/board-cards'
import type { AddColumnCardInput, BoardCardOrderUpdate } from '@/features/columns/types'

export const boardCardsQueryKey = (boardId: string) => ['board-cards', boardId] as const

export function useBoardCardsQuery(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: boardCardsQueryKey(boardId),
    queryFn: () => fetchBoardCards(boardId),
    enabled: enabled && Boolean(boardId),
  })
}

export function useCreateBoardCardMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, input }: { columnId: string; input: AddColumnCardInput }) =>
      createBoardCard(columnId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardCardsQueryKey(boardId) })
    },
  })
}

export function useUpdateBoardCardMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      cardId,
      columnId,
      input,
    }: {
      cardId: string
      columnId: string
      input: AddColumnCardInput
    }) => updateBoardCard(cardId, columnId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardCardsQueryKey(boardId) })
    },
  })
}

export function useApplyBoardCardOrderMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: BoardCardOrderUpdate[]) => applyBoardCardOrder(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardCardsQueryKey(boardId) })
    },
  })
}

export function useDeleteBoardCardMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, columnId }: { cardId: string; columnId: string }) =>
      deleteBoardCard(cardId, columnId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardCardsQueryKey(boardId) })
    },
  })
}
