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

import { ColumnColorPicker, DEFAULT_COLUMN_COLOR } from './ColumnColorPicker'

export type ColumnFormDialogMode =
  | { mode: 'create' }
  | { mode: 'edit'; columnId: string; initialTitle: string; initialColor: string }

type ColumnFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ColumnFormDialogMode
  onSave: (payload: { title: string; color: string }) => void | Promise<void>
  isPending?: boolean
  errorMessage?: string | null
}

export function ColumnFormDialog({
  open,
  onOpenChange,
  mode,
  onSave,
  isPending = false,
  errorMessage = null,
}: ColumnFormDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(DEFAULT_COLUMN_COLOR)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync fields when dialog opens */
    if (!open) return
    if (mode.mode === 'edit') {
      setTitle(mode.initialTitle)
      setColor(mode.initialColor)
    } else {
      setTitle('')
      setColor(DEFAULT_COLUMN_COLOR)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, mode])

  const trimmed = title.trim()
  const canSubmit = trimmed.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || isPending) return
    void onSave({ title: trimmed, color })
  }

  const isEdit = mode.mode === 'edit'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('columns.editColumn') : t('columns.newColumn')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('columns.columnEditDescription') : t('columns.columnCreateDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="column-title">{t('columns.name')}</Label>
              <Input
                id="column-title"
                name="title"
                autoComplete="off"
                placeholder={t('columns.columnNamePlaceholder')}
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
              <Label id="column-color-label">{t('columns.color')}</Label>
              <ColumnColorPicker value={color} onChange={setColor} disabled={isPending} />
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
