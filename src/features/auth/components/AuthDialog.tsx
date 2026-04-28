import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthModal } from '@/stores/auth-modal'

import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

export function AuthDialog() {
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
          <DialogTitle>{mode === 'sign-up' ? 'Sign up' : 'Sign in'}</DialogTitle>
          <DialogDescription>
            {mode === 'sign-up'
              ? 'Create an account to sync your boards.'
              : 'Enter your credentials to continue.'}
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
                No account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => openSignUp()}
                >
                  Sign up
                </Button>
              </>
            ) : mode === 'sign-up' ? (
              <>
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary"
                  onClick={() => openSignIn()}
                >
                  Sign in
                </Button>
              </>
            ) : null}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
