import { useEffect, useState } from 'react'

import { Loader2, UserMinus } from 'lucide-react'

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

function displayName(profile: { displayName: string | null; email: string }): string {
  return profile.displayName?.trim() || profile.email || 'Unknown user'
}

export function BoardSettingsDialog({
  open,
  onOpenChange,
  boardId,
  boardTitle,
  canManage,
  currentUserId,
}: BoardSettingsDialogProps) {
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
    if (!open) {
      setSearchQuery('')
      setActionError(null)
    }
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
      setActionError(e instanceof Error ? e.message : 'Could not add member.')
    }
  }

  async function handleRemove(userId: string) {
    setActionError(null)
    try {
      await removeMember.mutateAsync({ userId })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not remove member.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Board settings — {boardTitle}</DialogTitle>
          <DialogDescription>
            {canManage
              ? 'Search registered users by name or email and manage who has access.'
              : 'People with access to this board.'}
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
              People
            </h3>
            {sharingLoading ? (
              <div className="flex items-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                <span className="text-sm">Loading…</span>
              </div>
            ) : sharingError ? (
              <p className="text-sm text-destructive" role="alert">
                {sharingErr instanceof Error ? sharingErr.message : 'Failed to load sharing.'}
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
                        {sharing.owner ? displayName(sharing.owner) : 'Owner'}
                      </span>
                      <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Owner
                      </span>
                    </div>
                    {sharing.owner?.email ? (
                      <div className="truncate text-xs text-muted-foreground">{sharing.owner.email}</div>
                    ) : null}
                  </div>
                </div>

                {sharing.members.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-muted-foreground">No additional members yet.</p>
                ) : (
                  sharing.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.04]"
                      role="listitem"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{displayName(m)}</div>
                        <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                      </div>
                      {canManage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          aria-label={`Remove ${displayName(m)}`}
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
                Add people
              </h3>
              <div className="grid gap-2">
                <Label htmlFor="board-settings-user-search">Search users</Label>
                <Input
                  id="board-settings-user-search"
                  type="search"
                  placeholder="Search by name or email"
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
                    Type at least one character to search directory.
                  </p>
                ) : searchFetching ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    <span className="text-sm">Searching…</span>
                  </div>
                ) : filteredSearch.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {searchResults?.length === 0
                      ? 'No matches.'
                      : 'Everyone matching is already on this board.'}
                  </p>
                ) : (
                  filteredSearch.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-white/[0.06]"
                      role="listitem"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">{displayName(user)}</div>
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
                        Add
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
