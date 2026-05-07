import { useTranslation } from 'react-i18next'

import { PlaceholderPage } from '@/components/shared/PlaceholderPage'

export function DashboardPage() {
  const { t } = useTranslation()
  return (
    <PlaceholderPage title={t('pages.dashboardTitle')} description={t('pages.dashboardDescription')} />
  )
}
