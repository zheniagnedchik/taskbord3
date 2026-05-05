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
    return 'Invalid email or password.'
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.'
  }
  if (m.includes('already registered') || m.includes('user already')) {
    return 'An account with this email already exists.'
  }
  return errorMessage
}
