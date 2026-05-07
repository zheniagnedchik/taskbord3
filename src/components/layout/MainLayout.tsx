import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { BoardsSidebar } from '@/features/boards/components/BoardsSidebar'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Button, buttonVariants } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/stores/auth-modal'
import { useAuthSession } from '@/stores/auth-session'

const navLinkDefs = [
  { to: '/dashboard', labelKey: 'nav.dashboard' as const },
  { to: '/board', labelKey: 'nav.board' as const },
  { to: '/settings', labelKey: 'nav.settings' as const },
] as const

const ghostNavButtonClass =
  'text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground'

function shortEmail(email: string) {
  if (email.length <= 28) return email
  return `${email.slice(0, 14)}…${email.slice(-10)}`
}

function navLinkActive(to: string, pathname: string) {
  if (to === '/board') return pathname.startsWith('/board')
  return pathname === to
}

export function MainLayout() {
  const { t } = useTranslation()
  const openSignIn = useAuthModal((s) => s.openSignIn)
  const openSignUp = useAuthModal((s) => s.openSignUp)
  const user = useAuthSession((s) => s.user)
  const initializing = useAuthSession((s) => s.initializing)
  const location = useLocation()

  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060606]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#060606]/55">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3.5">
          <span className="mr-4 text-[15px] font-semibold tracking-tight text-white">
            taskbord3
          </span>
          <nav className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
            {navLinkDefs.map(({ to, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                className={() =>
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    ghostNavButtonClass,
                    navLinkActive(to, location.pathname) &&
                      'bg-white/[0.08] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.1] hover:text-foreground',
                  )
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
            <div className="ms-auto flex flex-wrap items-center gap-2">
              <LanguageSwitcher />
              {!initializing && user ? (
                <>
                  <span
                    className="flex max-w-[200px] items-center truncate px-2 text-sm text-muted-foreground"
                    title={user.email ?? undefined}
                  >
                    {user.email ? shortEmail(user.email) : t('layout.signedIn')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={ghostNavButtonClass}
                    onClick={() => void supabase.auth.signOut()}
                  >
                    {t('layout.signOut')}
                  </Button>
                </>
              ) : null}
              {!initializing && !user ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={ghostNavButtonClass}
                    onClick={() => openSignIn()}
                  >
                    {t('layout.signIn')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={ghostNavButtonClass}
                    onClick={() => openSignUp()}
                  >
                    {t('layout.signUp')}
                  </Button>
                </>
              ) : null}
            </div>
          </nav>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {!initializing && user ? <BoardsSidebar /> : null}
        <main className="relative min-w-0 flex-1 px-4 py-10 md:py-12">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <AuthDialog />
    </div>
  )
}
