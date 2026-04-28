import { useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthModal } from '@/stores/auth-modal'

export function SignUpPage() {
  const navigate = useNavigate()
  const openSignUp = useAuthModal((s) => s.openSignUp)

  useLayoutEffect(() => {
    openSignUp()
    navigate('/dashboard', { replace: true })
  }, [navigate, openSignUp])

  return null
}
