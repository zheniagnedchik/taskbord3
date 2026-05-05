import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createBoard, deleteBoard, fetchBoards } from '@/features/boards/api/boards'

export const boardsQueryKey = ['boards'] as const

export function useBoardsQuery(enabled: boolean) {
  return useQuery({
    queryKey: boardsQueryKey,
    queryFn: fetchBoards,
    enabled,
  })
}

export function useCreateBoardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
    },
  })
}

export function useDeleteBoardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: (_data, boardId) => {
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['board-sharing', boardId] })
    },
  })
}
