import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthMethodDivider, GoogleAuthButton } from '@/features/auth/components/GoogleAuthButton'
import {
  formatAuthError,
  signInWithGoogle,
  signUpWithEmail,
} from '@/features/auth/api/auth'
import { signUpSchema, type SignUpValues } from '@/lib/validations/auth'

export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [emailConfirmationNotice, setEmailConfirmationNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  return (
    <div className="space-y-4">
      {googleError ? (
        <p className="text-sm text-destructive">{googleError}</p>
      ) : null}
      <GoogleAuthButton
        loading={googlePending}
        aria-label="Sign up with Google"
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
          } catch {
            setGooglePending(false)
          }
        }}
      />
      <AuthMethodDivider />
      <form
        onSubmit={handleSubmit(async ({ email, password }) => {
          clearErrors('root')
          setEmailConfirmationNotice(null)
          setPending(true)
          try {
            const { data, error } = await signUpWithEmail(email, password)
            if (error) {
              setError('root', {
                message: formatAuthError(error.message),
              })
              return
            }
            if (data.session) {
              onSuccess()
              return
            }
            setEmailConfirmationNotice(
              'Check your email to confirm your account before signing in.',
            )
          } finally {
            setPending(false)
          }
        })}
        className="space-y-4"
      >
        {errors.root ? (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        ) : null}
        {emailConfirmationNotice ? (
          <p className="text-sm text-muted-foreground">{emailConfirmationNotice}</p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
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
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            disabled={pending}
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sign-up-confirm">Confirm password</Label>
          <Input
            id="sign-up-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            disabled={pending}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}
