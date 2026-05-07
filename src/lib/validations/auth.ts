import type { TFunction } from 'i18next'
import { z } from 'zod'

export function createSignInSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.invalidEmail')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  })
}

export type SignInValues = z.infer<ReturnType<typeof createSignInSchema>>

export function createSignUpSchema(t: TFunction) {
  return z
    .object({
      email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.invalidEmail')),
      password: z.string().min(8, t('auth.validation.passwordMin')),
      confirmPassword: z.string().min(1, t('auth.validation.confirmRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })
}

export type SignUpValues = z.infer<ReturnType<typeof createSignUpSchema>>
