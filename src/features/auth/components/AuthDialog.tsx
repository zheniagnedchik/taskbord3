import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthModal } from '@/stores/auth-modal'
import { useTranslation } from 'react-i18next'

import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

export function AuthDialog() {
  const { t } = useTranslation()
  const mode = useAuthModal((s) => s.mode)
  const close = useAuthModal((s) => s.close)
  const openSignIn = useAuthModal((s) => s.openSignIn)
  const openSignUp = useAuthModal((s) => s.openSignUp)

  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close()
        }
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === 'sign-up' ? t('auth.signUpTitle') : t('auth.signInTitle')}</DialogTitle>
          <DialogDescription>
            {mode === 'sign-up' ? t('auth.signUpDescription') : t('auth.signInDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {mode === 'sign-in' ? (
            <SignInForm onSuccess={close} key="sign-in" />
          ) : null}
          {mode === 'sign-up' ? (
            <SignUpForm onSuccess={close} key="sign-up" />
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'sign-in' ? (
              <>
                {t('auth.noAccount')}{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => openSignUp()}
                >
                  {t('auth.signUpLink')}
                </Button>
              </>
            ) : mode === 'sign-up' ? (
              <>
                {t('auth.hasAccount')}{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => openSignIn()}
                >
                  {t('auth.signInLink')}
                </Button>
              </>
            ) : null}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
