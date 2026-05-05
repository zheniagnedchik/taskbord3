export type BoardId = string

export type Board = {
  id: BoardId
  title: string
  ownerId: string
}

export type ProfileSummary = {
  id: string
  email: string
  displayName: string | null
}
