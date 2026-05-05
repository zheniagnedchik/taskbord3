import { type ReactNode, useEffect } from 'react'

import { supabase } from '@/lib/supabase/client'
import { useAuthSession } from '@/stores/auth-session'

export function SupabaseAuthListener({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false
    const applySession = useAuthSession.getState().setAuth

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return children
}
