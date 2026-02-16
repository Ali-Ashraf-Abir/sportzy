'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, MapPin, Trophy } from 'lucide-react'
import Link from 'next/link'

import { format } from 'date-fns'
import { Commentary, Match } from '@/lib/types'
import { useWebSocket } from '@/lib/useWebSocket'
import { api } from '@/lib/api'

export default function ViewerPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [commentary, setCommentary] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(true)
  
  const { connected, messages, subscribe, unsubscribe } = useWebSocket()

  useEffect(() => {
    loadMatches()
  }, [])

  // Handle WebSocket messages
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.type === 'match_created') {
        setMatches((prev) => [msg.data, ...prev])
      } else if (msg.type === 'commentary') {
        if (selectedMatch && msg.data.matchId === selectedMatch.id) {
          setCommentary((prev) => [msg.data, ...prev])
        }
      }
    })
  }, [messages, selectedMatch])

  const loadMatches = async () => {
    try {
      setLoading(true)
      const result = await api.getMatches(100)
      setMatches(result.data || [])
    } catch (err) {
      console.error('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectMatch = async (match: Match) => {
    if (selectedMatch && selectedMatch.id !== match.id) {
      unsubscribe(selectedMatch.id)
    }
    
    setSelectedMatch(match)
    subscribe(match.id)
    
    try {
      const comments = await api.getCommentary(match.id, 50)
      setCommentary(comments)
    } catch (err) {
      console.error('Failed to load commentary:', err)
      setCommentary([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white'
      case 'upcoming':
        return 'bg-blue-500 text-white'
      case 'finished':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Viewer Mode</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Available Matches
              </h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading matches...
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No matches available
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      onClick={() => selectMatch(match)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMatch?.id === match.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          {match.sport} - {match.league}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-800">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mt-2">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {match.venue}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(match.startTime), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commentary Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {selectedMatch ? (
                <>
                  <div className="mb-6 pb-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          {selectedMatch.sport} - {selectedMatch.league}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                        </h2>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {selectedMatch.homeScore} - {selectedMatch.awayScore}
                        </div>
                        <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${getStatusColor(selectedMatch.status)}`}>
                          {selectedMatch.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedMatch.venue}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(selectedMatch.startTime), 'MMMM d, yyyy - HH:mm')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Live Commentary
                    </h3>
                    
                    {commentary.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No commentary available yet</p>
                        <p className="text-sm mt-1">Commentary will appear here as it happens</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {commentary.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-600">
                                  {comment.minute}'
                                </span>
                                {comment.sequence && (
                                  <span className="text-xs text-gray-500">
                                    +{comment.sequence}
                                  </span>
                                )}
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                  {comment.period}
                                </span>
                                {comment.eventType && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {comment.eventType}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.createdAt), 'HH:mm:ss')}
                              </span>
                            </div>
                            
                            {comment.actor && (
                              <div className="font-semibold text-gray-700 mb-1">
                                {comment.actor}
                                {comment.team && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    ({comment.team})
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <p className="text-gray-800">{comment.message}</p>
                            
                            {comment.tags && comment.tags.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {comment.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Select a match to view commentary</p>
                  <p className="text-sm mt-2">Choose from the available matches on the left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}