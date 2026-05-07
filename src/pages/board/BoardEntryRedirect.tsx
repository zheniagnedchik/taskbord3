import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { useBoardsQuery } from '@/features/boards/hooks/use-boards-query'

export function BoardEntryRedirect() {
  const { t } = useTranslation()
  const { data, isPending, isError } = useBoardsQuery(true)

  if (isPending) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-label={t('board.loading')} />
      </div>
    )
  }
  if (isError || !data?.length) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to={`/board/${data[0]!.id}`} replace />
}
