export interface Match {
  id: number
  sport: string
  league: string
  homeTeam: string
  awayTeam: string
  venue: string
  startTime: string
  endTime: string
  homeScore: number
  awayScore: number
  status: 'upcoming' | 'live' | 'finished'
  createdAt: string
}

export interface Commentary {
  id: number
  matchId: number
  minute: number
  sequence: number | null
  period: string
  eventType: string | null
  actor: string | null
  team: string | null
  message: string
  metadata: Record<string, any>
  tags: string[]
  createdAt: string
}

export type WSMessage =
  | { type: 'welcome'; message: string }
  | { type: 'subscribed'; matchId: number }
  | { type: 'unsubscribed'; matchId: number }
  | { type: 'match_created'; data: Match }
  | { type: 'commentary'; data: Commentary }
  | { type: 'error'; message: string }