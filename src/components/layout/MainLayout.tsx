import { NavLink, Outlet } from 'react-router-dom'

import { AuthDialog } from '@/features/auth/components/AuthDialog'
import { BoardsSidebar } from '@/features/boards/components/BoardsSidebar'
import { Button, buttonVariants } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/stores/auth-modal'
import { useAuthSession } from '@/stores/auth-session'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/board', label: 'Board' },
  { to: '/settings', label: 'Settings' },
] as const

const ghostNavButtonClass =
  'text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground'

function shortEmail(email: string) {
  if (email.length <= 28) return email
  return `${email.slice(0, 14)}…${email.slice(-10)}`
}

export function MainLayout() {
  const openSignIn = useAuthModal((s) => s.openSignIn)
  const openSignUp = useAuthModal((s) => s.openSignUp)
  const user = useAuthSession((s) => s.user)
  const initializing = useAuthSession((s) => s.initializing)

  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#060606]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#060606]/55">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3.5">
          <span className="mr-4 text-[15px] font-semibold tracking-tight text-white">
            taskbord3
          </span>
          <nav className="flex flex-wrap gap-0.5">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    ghostNavButtonClass,
                    isActive &&
                      'bg-white/[0.08] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.1] hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            {!initializing && user ? (
              <>
                <span
                  className="flex max-w-[200px] items-center truncate px-2 text-sm text-muted-foreground"
                  title={user.email ?? undefined}
                >
                  {user.email ? shortEmail(user.email) : 'Signed in'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={ghostNavButtonClass}
                  onClick={() => void supabase.auth.signOut()}
                >
                  Sign out
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
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={ghostNavButtonClass}
                  onClick={() => openSignUp()}
                >
                  Sign up
                </Button>
              </>
            ) : null}
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
