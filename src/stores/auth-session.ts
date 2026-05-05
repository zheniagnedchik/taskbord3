import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

type AuthSessionState = {
  session: Session | null
  user: User | null
  initializing: boolean
  setAuth: (session: Session | null) => void
}

export const useAuthSession = create<AuthSessionState>((set) => ({
  session: null,
  user: null,
  initializing: true,
  setAuth: (session) =>
    set({
      session,
      user: session?.user ?? null,
      initializing: false,
    }),
}))
