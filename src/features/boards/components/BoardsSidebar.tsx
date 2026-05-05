import { useEffect, useState } from 'react'

import { Loader2, Plus, Settings, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuthSession } from '@/stores/auth-session'

import { BoardSettingsDialog } from './BoardSettingsDialog'
import { CreateBoardDialog } from './CreateBoardDialog'
import { useBoardsQuery, useCreateBoardMutation, useDeleteBoardMutation } from '../hooks/use-boards-query'
import type { Board } from '../types'

const itemBaseClass =
  'w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground'

const activeItemClass =
  'bg-white/[0.08] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.1] hover:text-foreground'

function mutationErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  if (error instanceof Error) return error.message
  return 'Could not create board.'
}

const settingsIconButtonClass =
  'shrink-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'

const deleteIconButtonClass =
  'shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'

export function BoardsSidebar() {
  const user = useAuthSession((s) => s.user)
  const currentUserId = user?.id
  const [selectedId, setSelectedId] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null)
  const [settingsBoard, setSettingsBoard] = useState<{
    id: string
    title: string
    ownerId: string
  } | null>(null)

  const { data, isPending, isError, error } = useBoardsQuery(true)
  const boards = data ?? []
  const createMutation = useCreateBoardMutation()
  const deleteMutation = useDeleteBoardMutation()

  useEffect(() => {
    const list = data ?? []
    if (!list.length) {
      setSelectedId('')
      return
    }
    setSelectedId((prev) => (prev && list.some((b) => b.id === prev) ? prev : list[0]!.id))
  }, [data])

  async function handleCreateBoard(title: string) {
    try {
      const board = await createMutation.mutateAsync(title)
      setSelectedId(board.id)
      setCreateOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const createError =
    createMutation.isError && createMutation.error ? mutationErrorMessage(createMutation.error) : null

  async function confirmDeleteBoard() {
    if (!boardToDelete) return
    try {
      await deleteMutation.mutateAsync(boardToDelete.id)
      if (settingsBoard?.id === boardToDelete.id) setSettingsBoard(null)
      setBoardToDelete(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <aside
      className={cn(
        'sticky top-14 hidden max-h-[calc(100vh-3.5rem)] min-h-0 w-72 shrink-0 flex-col border-r border-white/[0.08]',
        'bg-[#060606]/55 backdrop-blur-xl supports-[backdrop-filter]:bg-[#060606]/40',
        'lg:flex',
      )}
    >
      <div className="border-b border-white/[0.08] px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold tracking-tight text-white">Boards</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 shrink-0 border-white/[0.12] bg-white/[0.04] text-xs text-foreground hover:bg-white/[0.08]"
            disabled={isPending}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            Create board
          </Button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0 flex-col px-2 py-3">
        <nav className="flex flex-1 min-h-0 flex-col gap-0.5 overflow-y-auto pb-4" aria-label="Boards">
          {isPending ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              <span className="text-xs">Loading boards…</span>
            </div>
          ) : isError ? (
            <p className="px-2 text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : 'Failed to load boards.'}
            </p>
          ) : boards.length === 0 ? (
            <p className="px-2 text-sm text-muted-foreground">No boards yet.</p>
          ) : (
            boards.map((board) => {
              const selected = board.id === selectedId
              return (
                <div key={board.id} className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    className={cn(itemBaseClass, 'min-w-0 flex-1', selected && activeItemClass)}
                    onClick={() => setSelectedId(board.id)}
                  >
                    <span className="line-clamp-2">{board.title}</span>
                  </button>
                  {currentUserId === board.ownerId ? (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={settingsIconButtonClass}
                        aria-label={`Board settings — ${board.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSettingsBoard({
                            id: board.id,
                            title: board.title,
                            ownerId: board.ownerId,
                          })
                        }}
                      >
                        <Settings className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={deleteIconButtonClass}
                        aria-label={`Delete board — ${board.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setBoardToDelete(board)
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  ) : (
                    <span className="inline-flex h-7 w-[60px] shrink-0" aria-hidden />
                  )}
                </div>
              )
            })
          )}
        </nav>
      </div>
      <CreateBoardDialog
        open={createOpen}
        onOpenChange={(open) => {
          if (open) createMutation.reset()
          setCreateOpen(open)
        }}
        onCreate={handleCreateBoard}
        isPending={createMutation.isPending}
        errorMessage={createError}
      />
      <BoardSettingsDialog
        open={settingsBoard !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsBoard(null)
        }}
        boardId={settingsBoard?.id ?? ''}
        boardTitle={settingsBoard?.title ?? ''}
        canManage={Boolean(
          settingsBoard && currentUserId && settingsBoard.ownerId === currentUserId,
        )}
        currentUserId={currentUserId}
      />
      <Dialog
        open={boardToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setBoardToDelete(null)
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete this board?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Members will lose access.{' '}
              <span className="font-medium text-foreground">{boardToDelete?.title ?? ''}</span> will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setBoardToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void confirmDeleteBoard()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
