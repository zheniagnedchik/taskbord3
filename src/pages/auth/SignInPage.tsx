import { useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthModal } from '@/stores/auth-modal'

export function SignInPage() {
  const navigate = useNavigate()
  const openSignIn = useAuthModal((s) => s.openSignIn)

  useLayoutEffect(() => {
    openSignIn()
    navigate('/dashboard', { replace: true })
  }, [navigate, openSignIn])

  return null
}
