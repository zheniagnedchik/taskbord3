import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthMethodDivider, GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton'
import {
  formatAuthError,
  signInWithEmail,
  signInWithGoogle,
} from '@/features/auth/api/auth'
import { createSignInSchema, type SignInValues } from '@/lib/validations/auth'

export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const signInSchema = useMemo(() => createSignInSchema(t), [t])
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="space-y-4">
      {googleError ? (
        <p className="text-sm text-destructive">{googleError}</p>
      ) : null}
      <GoogleAuthButton
        loading={googlePending}
        aria-label={t('auth.signInGoogleAria')}
        onContinue={async () => {
          setGoogleError(null)
          setGooglePending(true)
          try {
            const { error } = await signInWithGoogle()
            if (error) {
              setGoogleError(formatAuthError(error.message))
              setGooglePending(false)
              return
            }
            // Browser follows OAuth redirect when skipBrowserRedirect is false (default).
          } catch {
            setGooglePending(false)
          }
        }}
      />
      <AuthMethodDivider />
      <form
        onSubmit={handleSubmit(async ({ email, password }) => {
          clearErrors('root')
          setPending(true)
          try {
            const { error } = await signInWithEmail(email, password)
            if (error) {
              setError('root', {
                message: formatAuthError(error.message),
              })
              return
            }
            onSuccess()
          } finally {
            setPending(false)
          }
        })}
        className="space-y-4"
      >
        {errors.root ? (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="sign-in-email">{t('auth.email')}</Label>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            disabled={pending}
            {...register('email')}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sign-in-password">{t('auth.password')}</Label>
          <Input
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            disabled={pending}
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('auth.signingIn') : t('auth.signInSubmit')}
        </Button>
      </form>
    </div>
  )
}
