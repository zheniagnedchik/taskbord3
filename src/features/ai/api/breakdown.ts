import { z } from 'zod'

import { DEFAULT_COLUMN_COLOR } from '@/features/columns/components/ColumnColorPicker'

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

function normalizeColor(raw: string | undefined | null): string {
  const s = (raw ?? '').trim()
  if (!s || !HEX_COLOR.test(s)) return DEFAULT_COLUMN_COLOR
  return s
}

const breakdownItemSchema = z
  .object({
    title: z.coerce.string(),
    description: z.coerce.string().optional().nullable(),
    color: z.coerce.string().optional().nullable(),
  })
  .transform((item) => ({
    title: item.title.trim(),
    description: (item.description ?? '').trim(),
    color: normalizeColor(item.color),
  }))

const breakdownResponseSchema = z.object({
  items: z.array(breakdownItemSchema),
})

export type TaskBreakdownItem = z.infer<typeof breakdownItemSchema>

function breakdownApiUrl(): string {
  const fromEnv = import.meta.env.VITE_BREAKDOWN_API_URL as string | undefined
  if (fromEnv && fromEnv.trim()) return fromEnv.trim()
  return 'https://aitaskbord3.yhnedchuk.workers.dev/api/breakdown'
}

export async function fetchTaskBreakdown(task: string): Promise<TaskBreakdownItem[]> {
  const trimmed = task.trim()
  if (!trimmed) return []

  const res = await fetch(breakdownApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: trimmed }),
  })

  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('breakdownInvalidJson')
  }

  if (!res.ok) {
    throw new Error(`breakdownHttpError:${res.status}`)
  }

  const parsed = breakdownResponseSchema.safeParse(json)
  if (!parsed.success) {
    throw new Error('breakdownInvalidShape')
  }

  return parsed.data.items.filter((i) => i.title.length > 0)
}
