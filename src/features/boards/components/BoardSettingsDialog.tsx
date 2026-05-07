import { useEffect, useState } from 'react'

import { Loader2, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import {
  useAddBoardMemberMutation,
  useBoardSharingQuery,
  useProfileSearchQuery,
  useRemoveBoardMemberMutation,
} from '../hooks/use-board-sharing'

type BoardSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  boardTitle: string
  canManage: boolean
  currentUserId?: string | null
}

function displayName(
  profile: { displayName: string | null; email: string },
  unknownLabel: string,
): string {
  return profile.displayName?.trim() || profile.email || unknownLabel
}

export function BoardSettingsDialog({
  open,
  onOpenChange,
  boardId,
  boardTitle,
  canManage,
  currentUserId,
}: BoardSettingsDialogProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: sharing, isPending: sharingLoading, isError: sharingError, error: sharingErr } =
    useBoardSharingQuery(boardId, open)
  const { data: searchResults, isFetching: searchFetching } = useProfileSearchQuery(
    searchQuery,
    open && canManage,
  )

  const addMember = useAddBoardMemberMutation(boardId)
  const removeMember = useRemoveBoardMemberMutation(boardId)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset draft when dialog closes */
    if (!open) {
      setSearchQuery('')
      setActionError(null)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open])

  const memberIds = new Set(sharing?.members.map((m) => m.id) ?? [])
  const ownerId = sharing?.ownerId

  const filteredSearch =
    searchResults?.filter(
      (p) => p.id !== ownerId && p.id !== currentUserId && !memberIds.has(p.id),
    ) ?? []

  async function handleAdd(userId: string) {
    setActionError(null)
    try {
      await addMember.mutateAsync({ userId })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('boards.couldNotAddMember'))
    }
  }

  async function handleRemove(userId: string) {
    setActionError(null)
    try {
      await removeMember.mutateAsync({ userId })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('boards.couldNotRemoveMember'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('boards.settingsTitle', { title: boardTitle })}</DialogTitle>
          <DialogDescription>
            {canManage ? t('boards.settingsDescriptionManage') : t('boards.settingsDescriptionView')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 pt-1">
          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}

          <section className="grid gap-2" aria-labelledby="members-heading">
            <h3 id="members-heading" className="text-sm font-medium text-white">
              {t('boards.people')}
            </h3>
            {sharingLoading ? (
              <div className="flex items-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                <span className="text-sm">{t('boards.loadingShort')}</span>
              </div>
            ) : sharingError ? (
              <p className="text-sm text-destructive" role="alert">
                {sharingErr instanceof Error ? sharingErr.message : t('boards.sharingLoadFailed')}
              </p>
            ) : sharing ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2">
                <div
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-2"
                  role="listitem"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {sharing.owner ? displayName(sharing.owner, t('boards.unknownUser')) : t('boards.ownerLabel')}
                      </span>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t('boards.ownerBadge')}
                      </span>
                    </div>
                    {sharing.owner?.email ? (
                      <div className="truncate text-xs text-muted-foreground">{sharing.owner.email}</div>
                    ) : null}
                  </div>
                </div>

                {sharing.members.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted-foreground">{t('boards.noMembers')}</p>
                ) : (
                  sharing.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.04]"
                      role="listitem"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{displayName(m, t('boards.unknownUser'))}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                      </div>
                      {canManage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          aria-label={t('boards.removeMemberAria', { name: displayName(m, t('boards.unknownUser')) })}
                          disabled={removeMember.isPending}
                          onClick={() => void handleRemove(m.id)}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>

          {canManage ? (
            <section className="grid gap-2" aria-labelledby="invite-heading">
              <h3 id="invite-heading" className="text-sm font-medium text-white">
                {t('boards.addPeople')}
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="board-settings-user-search">{t('boards.searchUsersLabel')}</Label>
                <Input
                  id="board-settings-user-search"
                  type="search"
                  placeholder={t('boards.searchPlaceholder')}
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div
                className={cn(
                  'max-h-[min(220px,calc(100vh-420px))] overflow-y-auto rounded-lg border border-border bg-muted/20',
                  'p-1',
                )}
                role="list"
              >
                {sanitizedSearchEmpty(searchQuery) ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {t('boards.searchHint')}
                  </p>
                ) : searchFetching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    <span className="text-sm">{t('boards.searching')}</span>
                  </div>
                ) : filteredSearch.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {searchResults?.length === 0 ? t('boards.noMatches') : t('boards.allOnBoard')}
                  </p>
                ) : (
                  filteredSearch.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.06]"
                      role="listitem"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {displayName(user, t('boards.unknownUser'))}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        disabled={addMember.isPending}
                        onClick={() => void handleAdd(user.id)}
                      >
                        {t('boards.addMember')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function sanitizedSearchEmpty(q: string): boolean {
  return q.replace(/[%_\\]/g, '').trim().length === 0
}
