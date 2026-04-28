import { create } from 'zustand'

export type AuthModalMode = 'sign-in' | 'sign-up'

type AuthModalState = {
  mode: AuthModalMode | null
  openSignIn: () => void
  openSignUp: () => void
  close: () => void
}

export const useAuthModal = create<AuthModalState>((set) => ({
  mode: null,
  openSignIn: () => set({ mode: 'sign-in' }),
  openSignUp: () => set({ mode: 'sign-up' }),
  close: () => set({ mode: null }),
}))
