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
import { cn } from '@/lib/utils'

import type { AddColumnCardInput } from '@/features/columns/types'

import { ColumnColorPicker, DEFAULT_COLUMN_COLOR } from './ColumnColorPicker'

export type CardAssigneeOption = {
  value: string
  label: string
}

export type CardFormDialogMode =
  | { mode: 'create' }
  | {
      mode: 'edit'
      cardId: string
      initialTitle: string
      initialDescription: string
      initialColor: string
      initialAssigneeId: string
    }

type CardFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: CardFormDialogMode
  assigneeOptions: CardAssigneeOption[]
  onSave: (payload: AddColumnCardInput) => void | Promise<void>
  isPending?: boolean
  errorMessage?: string | null
}

const textareaClassName = cn(
  'flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary/20 selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:shadow-none',
  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

export function CardFormDialog({
  open,
  onOpenChange,
  mode,
  assigneeOptions,
  onSave,
  isPending = false,
  errorMessage = null,
}: CardFormDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_COLUMN_COLOR)
  const [assigneeId, setAssigneeId] = useState('')

  const formSyncKey =
    !open ? 'closed' : mode.mode === 'edit' ? `edit:${mode.cardId}` : 'create'

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync fields when dialog opens */
    if (!open) return
    if (mode.mode === 'edit') {
      setTitle(mode.initialTitle)
      setDescription(mode.initialDescription)
      setColor(mode.initialColor)
      setAssigneeId(mode.initialAssigneeId)
    } else {
      setTitle('')
      setDescription('')
      setColor(DEFAULT_COLUMN_COLOR)
      setAssigneeId('')
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `formSyncKey` tracks card id and create/edit; including `mode.*` duplicates churn
  }, [open, formSyncKey])

  const trimmedTitle = title.trim()
  const canSubmit = trimmedTitle.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || isPending) return
    const option = assigneeOptions.find((o) => o.value === assigneeId)
    const label = assigneeId ? (option?.label ?? '') : ''
    void onSave({
      title: trimmedTitle,
      description: description.trim(),
      color,
      assigneeId: assigneeId || null,
      assigneeLabel: label,
    })
  }

  const isEdit = mode.mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('columns.editCard') : t('columns.newCard')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('columns.cardEditDescription') : t('columns.cardCreateDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid max-h-[min(60vh,520px)] gap-4 overflow-y-auto py-2 pr-1">
            <div className="grid gap-2">
              <Label htmlFor="card-title">{t('columns.cardTitle')}</Label>
              <Input
                id="card-title"
                name="title"
                autoComplete="off"
                placeholder={t('columns.cardTitlePlaceholder')}
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
            <div className="grid gap-2">
              <Label htmlFor="card-description">{t('columns.description')}</Label>
              <textarea
                id="card-description"
                name="description"
                rows={4}
                placeholder={t('columns.descriptionPlaceholder')}
                value={description}
                disabled={isPending}
                onChange={(e) => setDescription(e.target.value)}
                className={textareaClassName}
              />
            </div>
            <div className="grid gap-2">
              <Label id="card-color-label">{t('columns.color')}</Label>
              <ColumnColorPicker value={color} onChange={setColor} disabled={isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card-assignee">{t('columns.assignee')}</Label>
              <select
                id="card-assignee"
                name="assignee"
                value={assigneeId}
                disabled={isPending}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={cn(
                  'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs outline-none dark:bg-input/30 dark:shadow-none',
                  'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                )}
              >
                {assigneeOptions.map((opt) => (
                  <option key={opt.value === '' ? '__none' : opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending
                ? isEdit
                  ? t('columns.saving')
                  : t('columns.creating')
                : isEdit
                  ? t('columns.save')
                  : t('columns.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
