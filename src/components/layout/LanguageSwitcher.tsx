import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { AppLocale } from '@/i18n/i18n'

const locales: AppLocale[] = ['en', 'ru']

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-white/[0.12] bg-white/[0.02] p-0.5"
      role="group"
      aria-label={t('layout.language')}
    >
      {locales.map((code) => {
        const active = i18n.language === code || i18n.language.startsWith(`${code}-`)
        return (
          <Button
            key={code}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 min-w-[2.25rem] px-2 text-xs font-medium',
              active && 'bg-white/[0.1] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]',
            )}
            onClick={() => void i18n.changeLanguage(code)}
            aria-pressed={active}
          >
            {code.toUpperCase()}
          </Button>
        )
      })}
    </div>
  )
}
