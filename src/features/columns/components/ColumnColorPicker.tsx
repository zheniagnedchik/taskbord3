/* eslint-disable react-refresh/only-export-components -- preset constants shared with column/card dialogs */
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export const DEFAULT_COLUMN_COLOR = '#6366f1'

export const COLUMN_COLOR_PRESETS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
] as const

type ColumnColorPickerProps = {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColumnColorPicker({ value, onChange, disabled = false }: ColumnColorPickerProps) {
  const { t } = useTranslation()
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="size-9 shrink-0 rounded-lg border border-white/[0.12] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
          style={{ backgroundColor: value }}
          aria-hidden
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only">{t('columns.customColorSrOnly')}</span>
          <input
            type="color"
            disabled={disabled}
            value={normalizeHex(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-md border border-white/[0.12] bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="font-mono text-xs text-foreground/80">{normalizeHex(value)}</span>
        </label>
      </div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-6" role="list" aria-label={t('columns.presetColorsAria')}>
        {COLUMN_COLOR_PRESETS.map((hex) => {
          const selected = normalizeHex(value).toLowerCase() === hex.toLowerCase()
          return (
            <button
              key={hex}
              type="button"
              disabled={disabled}
              role="listitem"
              title={hex}
              onClick={() => onChange(hex)}
              className={cn(
                'aspect-square rounded-md border-2 transition-transform outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                selected
                  ? 'border-white ring-2 ring-white/30'
                  : 'border-transparent hover:border-white/20',
              )}
              style={{ backgroundColor: hex }}
            >
              <span className="sr-only">{hex}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function normalizeHex(hex: string): string {
  const h = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(h)) {
    const r = h[1]!
    const g = h[2]!
    const b = h[3]!
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return DEFAULT_COLUMN_COLOR
}
