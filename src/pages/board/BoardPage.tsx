import type { DragEndEvent } from '@dnd-kit/core'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useBoardSharingQuery } from '@/features/boards/hooks/use-board-sharing'
import { useBoardsQuery } from '@/features/boards/hooks/use-boards-query'
import { BoardColumnsBar } from '@/features/columns/components/BoardColumnsBar'
import { CardFormDialog, type CardAssigneeOption, type CardFormDialogMode } from '@/features/columns/components/CardFormDialog'
import {
  ColumnFormDialog,
  type ColumnFormDialogMode,
} from '@/features/columns/components/ColumnFormDialog'
import {
  useApplyBoardCardOrderMutation,
  useBoardCardsQuery,
  useCreateBoardCardMutation,
  useDeleteBoardCardMutation,
  useUpdateBoardCardMutation,
} from '@/features/columns/hooks/use-board-cards-query'
import {
  useBoardColumnsQuery,
  useCreateColumnMutation,
  useDeleteColumnMutation,
  useUpdateColumnMutation,
} from '@/features/columns/hooks/use-columns-query'
import type { AddColumnCardInput, BoardColumn, ColumnCard } from '@/features/columns/types'
import { computeBoardCardOrderUpdates } from '@/features/columns/utils/compute-board-card-order'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DialogState =
  | { open: false }
  | { open: true; formMode: ColumnFormDialogMode }

type CardDialogState = {
  open: boolean
  columnId: string | null
  editingCardId: string | null
}

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function BoardPage() {
  const { t } = useTranslation()
  const { boardId = '' } = useParams<{ boardId: string }>()
  const { data: boards, isPending: boardsPending } = useBoardsQuery(true)
  const board = boards?.find((b) => b.id === boardId)

  const columnsQuery = useBoardColumnsQuery(boardId, Boolean(boardId && board))
  const columnsReady = columnsQuery.isSuccess

  const cardsQuery = useBoardCardsQuery(boardId, Boolean(boardId && board && columnsReady))

  const createMutation = useCreateColumnMutation(boardId)
  const updateMutation = useUpdateColumnMutation(boardId)
  const createCardMutation = useCreateBoardCardMutation(boardId)
  const updateCardMutation = useUpdateBoardCardMutation(boardId)
  const applyCardOrderMutation = useApplyBoardCardOrderMutation(boardId)
  const deleteCardMutation = useDeleteBoardCardMutation(boardId)
  const deleteColumnMutation = useDeleteColumnMutation(boardId)

  const [dialog, setDialog] = useState<DialogState>({ open: false })
  const [cardDialog, setCardDialog] = useState<CardDialogState>({
    open: false,
    columnId: null,
    editingCardId: null,
  })
  const [cardToDelete, setCardToDelete] = useState<ColumnCard | null>(null)
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(null)

  const sharingQuery = useBoardSharingQuery(boardId, Boolean(boardId && cardDialog.open))

  const columns = useMemo(() => {
    const list = columnsQuery.data ?? []
    return [...list].sort((a, b) => a.position - b.position)
  }, [columnsQuery.data])

  const columnCards = useMemo(() => cardsQuery.data ?? [], [cardsQuery.data])

  const editingCard = useMemo(() => {
    if (!cardDialog.editingCardId || !cardDialog.columnId) return null
    return columnCards.find((c) => c.id === cardDialog.editingCardId) ?? null
  }, [columnCards, cardDialog.columnId, cardDialog.editingCardId])

  const cardFormMode = useMemo((): CardFormDialogMode => {
    if (!cardDialog.open) return { mode: 'create' }
    if (cardDialog.editingCardId && editingCard) {
      return {
        mode: 'edit',
        cardId: editingCard.id,
        initialTitle: editingCard.title,
        initialDescription: editingCard.description,
        initialColor: editingCard.color,
        initialAssigneeId: editingCard.assigneeId ?? '',
      }
    }
    return { mode: 'create' }
  }, [cardDialog.open, cardDialog.editingCardId, editingCard])

  const assigneeOptions = useMemo<CardAssigneeOption[]>(() => {
    const opts: CardAssigneeOption[] = [{ value: '', label: t('board.unassigned') }]
    const snap = sharingQuery.data
    if (!snap) return opts

    const seen = new Set<string>([''])

    if (snap.owner) {
      seen.add(snap.owner.id)
      opts.push({
        value: snap.owner.id,
        label: (snap.owner.displayName ?? snap.owner.email) || t('board.owner'),
      })
    } else if (snap.ownerId) {
      seen.add(snap.ownerId)
      opts.push({ value: snap.ownerId, label: t('board.boardOwner') })
    }

    for (const m of snap.members) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      opts.push({
        value: m.id,
        label: m.displayName ?? m.email,
      })
    }

    if (editingCard?.assigneeId && !opts.some((o) => o.value === editingCard.assigneeId)) {
      opts.push({
        value: editingCard.assigneeId,
        label: editingCard.assigneeLabel || t('board.assigneeFallback'),
      })
    }

    return opts
  }, [sharingQuery.data, editingCard, t])

  if (boardsPending) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-label={t('board.loading')} />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-foreground">{t('board.notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('board.notFoundDescription')}
        </p>
      </div>
    )
  }

  function resetMutations() {
    createMutation.reset()
    updateMutation.reset()
  }

  function resetCardMutations() {
    createCardMutation.reset()
    updateCardMutation.reset()
  }

  function openCreate() {
    resetMutations()
    setDialog({ open: true, formMode: { mode: 'create' } })
  }

  function openEdit(column: BoardColumn) {
    resetMutations()
    setDialog({
      open: true,
      formMode: {
        mode: 'edit',
        columnId: column.id,
        initialTitle: column.title,
        initialColor: column.color,
      },
    })
  }

  function openCardForm(columnId: string) {
    resetCardMutations()
    setCardDialog({ open: true, columnId, editingCardId: null })
  }

  function openEditCard(card: ColumnCard) {
    resetCardMutations()
    setCardDialog({ open: true, columnId: card.columnId, editingCardId: card.id })
  }

  function requestDeleteCard(card: ColumnCard) {
    deleteCardMutation.reset()
    setCardToDelete(card)
  }

  function requestDeleteColumn(col: BoardColumn) {
    deleteColumnMutation.reset()
    setColumnToDelete(col)
  }

  async function confirmDeleteCard() {
    if (!cardToDelete) return
    const { id, columnId } = cardToDelete
    try {
      await deleteCardMutation.mutateAsync({ cardId: id, columnId })
      setCardToDelete(null)
      deleteCardMutation.reset()
      if (cardDialog.editingCardId === id) {
        setCardDialog({ open: false, columnId: null, editingCardId: null })
        resetCardMutations()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function confirmDeleteColumn() {
    if (!columnToDelete) return
    const colId = columnToDelete.id
    try {
      await deleteColumnMutation.mutateAsync(colId)
      setColumnToDelete(null)
      deleteColumnMutation.reset()
      if (dialog.open && dialog.formMode.mode === 'edit' && dialog.formMode.columnId === colId) {
        setDialog({ open: false })
        resetMutations()
      }
      if (cardDialog.columnId === colId) {
        setCardDialog({ open: false, columnId: null, editingCardId: null })
        resetCardMutations()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCardSave(payload: AddColumnCardInput) {
    const colId = cardDialog.columnId
    if (!colId) return
    try {
      if (cardDialog.editingCardId) {
        await updateCardMutation.mutateAsync({
          cardId: cardDialog.editingCardId,
          columnId: colId,
          input: payload,
        })
      } else {
        await createCardMutation.mutateAsync({ columnId: colId, input: payload })
      }
      setCardDialog({ open: false, columnId: null, editingCardId: null })
      resetCardMutations()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const updates = computeBoardCardOrderUpdates(columns, columnCards, event.active.id, event.over?.id ?? null)
    if (!updates?.length) return
    try {
      await applyCardOrderMutation.mutateAsync(updates)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSave(payload: { title: string; color: string }) {
    if (!dialog.open) return
    const { formMode } = dialog
    try {
      if (formMode.mode === 'create') {
        await createMutation.mutateAsync({ title: payload.title, color: payload.color })
      } else {
        await updateMutation.mutateAsync({
          columnId: formMode.columnId,
          title: payload.title,
          color: payload.color,
        })
      }
      setDialog({ open: false })
      resetMutations()
    } catch (err) {
      console.error(err)
    }
  }

  const dialogMode = dialog.open ? dialog.formMode : { mode: 'create' as const }
  const savePending = createMutation.isPending || updateMutation.isPending
  const saveError =
    dialog.open && dialog.formMode.mode === 'create' && createMutation.isError
      ? mutationErrorMessage(createMutation.error, t('board.mutationFailed'))
      : dialog.open && dialog.formMode.mode === 'edit' && updateMutation.isError
        ? mutationErrorMessage(updateMutation.error, t('board.mutationFailed'))
        : null

  const cardSavePending = createCardMutation.isPending || updateCardMutation.isPending
  const cardSaveError =
    cardDialog.open && cardDialog.editingCardId && updateCardMutation.isError
      ? mutationErrorMessage(updateCardMutation.error, t('board.mutationFailed'))
      : cardDialog.open && !cardDialog.editingCardId && createCardMutation.isError
        ? mutationErrorMessage(createCardMutation.error, t('board.mutationFailed'))
        : null

  const cardDeleteError =
    cardToDelete !== null && deleteCardMutation.isError
      ? mutationErrorMessage(deleteCardMutation.error, t('board.mutationFailed'))
      : null

  const columnDeleteError =
    columnToDelete !== null && deleteColumnMutation.isError
      ? mutationErrorMessage(deleteColumnMutation.error, t('board.mutationFailed'))
      : null

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{board.title}</h1>
      </header>

      {columnsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {columnsQuery.error instanceof Error ? columnsQuery.error.message : t('board.columnsLoadFailed')}
        </p>
      ) : columnsQuery.isPending ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-7 animate-spin" aria-label={t('board.loadingColumns')} />
        </div>
      ) : cardsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {cardsQuery.error instanceof Error ? cardsQuery.error.message : t('board.cardsLoadFailed')}
        </p>
      ) : cardsQuery.isPending ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-7 animate-spin" aria-label={t('board.loadingCards')} />
        </div>
      ) : (
        <BoardColumnsBar
          columns={columns}
          cards={columnCards}
          onAdd={openCreate}
          onEdit={openEdit}
          onDeleteColumn={requestDeleteColumn}
          onAddCard={openCardForm}
          onEditCard={openEditCard}
          onDeleteCard={requestDeleteCard}
          onDragEnd={handleDragEnd}
        />
      )}

      <ColumnFormDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDialog({ open: false })
            resetMutations()
          }
        }}
        mode={dialogMode}
        onSave={handleSave}
        isPending={savePending}
        errorMessage={saveError}
      />

      <CardFormDialog
        open={cardDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setCardDialog({ open: false, columnId: null, editingCardId: null })
            resetCardMutations()
          }
        }}
        mode={cardFormMode}
        assigneeOptions={assigneeOptions}
        onSave={handleCardSave}
        isPending={cardSavePending}
        errorMessage={cardSaveError}
      />

      <Dialog
        open={cardToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCardToDelete(null)
            deleteCardMutation.reset()
          }
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('board.deleteCardTitle')}</DialogTitle>
            <DialogDescription>
              {t('board.deleteCardPrefix')}{' '}
              <span className="font-medium text-foreground">{cardToDelete?.title ?? ''}</span>{' '}
              {t('board.deleteCardSuffix')}
            </DialogDescription>
          </DialogHeader>
          {cardDeleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {cardDeleteError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteCardMutation.isPending}
              onClick={() => {
                setCardToDelete(null)
                deleteCardMutation.reset()
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteCardMutation.isPending}
              onClick={() => void confirmDeleteCard()}
            >
              {deleteCardMutation.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={columnToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setColumnToDelete(null)
            deleteColumnMutation.reset()
          }
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('board.deleteColumnTitle')}</DialogTitle>
            <DialogDescription>
              {t('board.deleteColumnPrefix')}{' '}
              <span className="font-medium text-foreground">{columnToDelete?.title ?? ''}</span>{' '}
              {t('board.deleteColumnSuffix')}
            </DialogDescription>
          </DialogHeader>
          {columnDeleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {columnDeleteError}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteColumnMutation.isPending}
              onClick={() => {
                setColumnToDelete(null)
                deleteColumnMutation.reset()
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteColumnMutation.isPending}
              onClick={() => void confirmDeleteColumn()}
            >
              {deleteColumnMutation.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
