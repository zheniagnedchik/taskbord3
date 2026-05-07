import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createColumn, deleteColumn, fetchColumns, updateColumn } from '@/features/columns/api/columns'

export const boardColumnsQueryKey = (boardId: string) => ['board-columns', boardId] as const

export function useBoardColumnsQuery(boardId: string, enabled: boolean) {
  return useQuery({
    queryKey: boardColumnsQueryKey(boardId),
    queryFn: () => fetchColumns(boardId),
    enabled: enabled && Boolean(boardId),
  })
}

export function useCreateColumnMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; color: string }) => createColumn(boardId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardColumnsQueryKey(boardId) })
      void queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] })
    },
  })
}

export function useUpdateColumnMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: { columnId: string; title: string; color: string }) =>
      updateColumn(args.columnId, { title: args.title, color: args.color }, boardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardColumnsQueryKey(boardId) })
      void queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] })
    },
  })
}

export function useDeleteColumnMutation(boardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId, boardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boardColumnsQueryKey(boardId) })
      void queryClient.invalidateQueries({ queryKey: ['board-cards', boardId] })
    },
  })
}
