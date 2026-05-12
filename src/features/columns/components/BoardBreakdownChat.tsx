import { Loader2, SendHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { fetchTaskBreakdown } from '@/features/ai/api/breakdown'
import { createBoardCard } from '@/features/columns/api/board-cards'
import { boardCardsQueryKey } from '@/features/columns/hooks/use-board-cards-query'
import type { BoardColumn } from '@/features/columns/types'

const textareaClassName = cn(
  'flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary/20 selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:shadow-none',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

const selectClassName = cn(
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none dark:bg-input/30 dark:shadow-none',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

type BoardBreakdownChatProps = {
  boardId: string
  columns: BoardColumn[]
}

function resolveErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof TypeError && typeof error.message === 'string' && error.message.includes('fetch')) {
    return t('board.breakdown.errors.network')
  }
  if (error instanceof Error) {
    if (error.message === 'breakdownInvalidJson') return t('board.breakdown.errors.invalidJson')
    if (error.message === 'breakdownInvalidShape') return t('board.breakdown.errors.invalidShape')
    if (error.message.startsWith('breakdownHttpError:')) {
      const status = error.message.slice('breakdownHttpError:'.length)
      return t('board.breakdown.errors.http', { status })
    }
  }
  return t('board.breakdown.errors.generic')
}

export function BoardBreakdownChat({ boardId, columns }: BoardBreakdownChatProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  )

  const [preferredColumnId, setPreferredColumnId] = useState<string | null>(null)
  const [taskText, setTaskText] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)

  const activeColumnId = useMemo(() => {
    if (sortedColumns.length === 0) return ''
    if (
      preferredColumnId &&
      sortedColumns.some((c) => c.id === preferredColumnId)
    ) {
      return preferredColumnId
    }
    return sortedColumns[0].id
  }, [sortedColumns, preferredColumnId])

  const canSubmit = taskText.trim().length > 0 && Boolean(activeColumnId) && !busy

  async function handleSubmit() {
    if (!canSubmit || !activeColumnId) return
    setBusy(true)
    setErrorMessage(null)
    setNoticeMessage(null)
    try {
      const items = await fetchTaskBreakdown(taskText)
      if (items.length === 0) {
        setNoticeMessage(t('board.breakdown.noItems'))
        return
      }
      for (const item of items) {
        await createBoardCard(activeColumnId, {
          title: item.title,
          description: item.description,
          color: item.color,
          assigneeId: null,
          assigneeLabel: '',
        })
      }
      void queryClient.invalidateQueries({ queryKey: boardCardsQueryKey(boardId) })
      setTaskText('')
    } catch (err) {
      console.error(err)
      setErrorMessage(resolveErrorMessage(err, t))
    } finally {
      setBusy(false)
    }
  }

  const noColumns = sortedColumns.length === 0

  return (
    <section
      className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 shadow-none"
      aria-labelledby="board-breakdown-heading"
    >
      <h2 id="board-breakdown-heading" className="text-sm font-medium text-foreground">
        {t('board.breakdown.title')}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t('board.breakdown.description')}</p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2 sm:max-w-xs">
          <Label htmlFor="breakdown-column">{t('board.breakdown.targetColumn')}</Label>
          <select
            id="breakdown-column"
            value={activeColumnId}
            disabled={busy || noColumns}
            onChange={(e) => setPreferredColumnId(e.target.value)}
            className={selectClassName}
          >
            {noColumns ? (
              <option value="">{t('board.breakdown.noColumnsOption')}</option>
            ) : (
              sortedColumns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))
            )}
          </select>
          {noColumns ? (
            <p className="text-xs text-muted-foreground">{t('board.breakdown.noColumnsHint')}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="breakdown-task">{t('board.breakdown.taskLabel')}</Label>
          <textarea
            id="breakdown-task"
            rows={3}
            value={taskText}
            disabled={busy || noColumns}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder={t('board.breakdown.taskPlaceholder')}
            className={textareaClassName}
            aria-invalid={Boolean(errorMessage)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : noticeMessage ? (
            <p className="text-sm text-muted-foreground" role="status">
              {noticeMessage}
            </p>
          ) : (
            <span className="hidden text-sm sm:block sm:min-h-[1.25rem]" />
          )}
          <Button
            type="button"
            className="w-full gap-2 sm:w-auto sm:shrink-0"
            disabled={!canSubmit || noColumns}
            onClick={() => void handleSubmit()}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t('board.breakdown.sending')}
              </>
            ) : (
              <>
                <SendHorizontal className="size-4" aria-hidden />
                {t('board.breakdown.send')}
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
