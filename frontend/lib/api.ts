// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'

// API Client
export const api = {
  // Matches
  async getMatches(limit = 50) {
    const res = await fetch(`${API_URL}/matches?limit=${limit}`)
    if (!res.ok) throw new Error('Failed to fetch matches')
    return res.json()
  },

  async createMatch(data: {
    sport: string
    league: string
    homeTeam: string
    awayTeam: string
    venue: string
    startTime: string
    endTime: string
    homeScore?: number
    awayScore?: number
  }) {
    const res = await fetch(`${API_URL}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create match')
    return res.json()
  },

  // Commentary
  async getCommentary(matchId: number, limit = 50) {
    const res = await fetch(`${API_URL}/commentary/${matchId}?limit=${limit}`)
    if (!res.ok) throw new Error('Failed to fetch commentary')
    return res.json()
  },

  async createCommentary(matchId: number, data: {
    minute: number
    sequence?: number
    period: string
    eventType?: string
    actor?: string
    team?: string
    message: string
    metadata?: Record<string, any>
    tags?: string[]
  }) {
    const res = await fetch(`${API_URL}/commentary/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create commentary')
    return res.json()
  },
}