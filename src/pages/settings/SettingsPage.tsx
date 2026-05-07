import { useTranslation } from 'react-i18next'

import { PlaceholderPage } from '@/components/shared/PlaceholderPage'

export function SettingsPage() {
  const { t } = useTranslation()
  return (
    <PlaceholderPage title={t('pages.settingsTitle')} description={t('pages.settingsDescription')} />
  )
}
