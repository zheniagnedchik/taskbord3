import { type FormEvent, useEffect, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CreateBoardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (title: string) => void | Promise<void>
  isPending?: boolean
  errorMessage?: string | null
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  onCreate,
  isPending = false,
  errorMessage = null,
}: CreateBoardDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset draft when dialog closes */
    if (!open) {
      setTitle('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open])

  const trimmed = title.trim()
  const canSubmit = trimmed.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || isPending) return
    void onCreate(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('boards.newBoard')}</DialogTitle>
          <DialogDescription>{t('boards.newBoardDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-2">
            <Label htmlFor="new-board-title">{t('boards.name')}</Label>
            <Input
              id="new-board-title"
              name="title"
              autoComplete="off"
              placeholder={t('boards.boardPlaceholder')}
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(errorMessage)}
            />
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? t('boards.creating') : t('boards.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
