import { NavLink, Outlet } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/board', label: 'Board' },
  { to: '/settings', label: 'Settings' },
  { to: '/sign-in', label: 'Sign in' },
  { to: '/sign-up', label: 'Sign up' },
] as const

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="mr-4 font-semibold">taskbord3</span>
          <nav className="flex flex-wrap gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    to === '/dashboard'
                      ? isActive
                        ? 'bg-green-600 text-white hover:bg-green-700 hover:text-white dark:bg-green-600 dark:text-white dark:hover:bg-green-700'
                        : 'text-green-700 hover:bg-green-500/15 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-500/20 dark:hover:text-green-300'
                      : isActive &&
                          'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
