import i18n from '@/i18n/i18n'
import { supabase } from '@/lib/supabase/client'

/** Where Supabase redirects after OAuth (must be listed under Authentication → URL Configuration). */
export function getOAuthRedirectUrl() {
  return `${window.location.origin}/dashboard`
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
  })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export function formatAuthError(errorMessage: string): string {
  const m = errorMessage.toLowerCase()
  if (m.includes('invalid login credentials')) {
    return i18n.t('auth.errors.invalidCredentials')
  }
  if (m.includes('email not confirmed')) {
    return i18n.t('auth.errors.emailNotConfirmed')
  }
  if (m.includes('already registered') || m.includes('user already')) {
    return i18n.t('auth.errors.alreadyRegistered')
  }
  return errorMessage
}
