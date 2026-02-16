'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ArrowLeft, Send, Clock, MapPin, Play, Pause, RotateCcw, Zap, Settings, Keyboard } from 'lucide-react'
import Link from 'next/link'

import { format } from 'date-fns'
import { Commentary, Match } from '@/lib/types'
import { useWebSocket } from '@/lib/useWebSocket'
import { api } from '@/lib/api'

// Sport-specific event templates
const SPORT_TEMPLATES = {
  football: [
    { label: 'Goal', type: 'goal', shortcut: 'g', emoji: '⚽' },
    { label: 'Yellow Card', type: 'yellow_card', shortcut: 'y', emoji: '🟨' },
    { label: 'Red Card', type: 'red_card', shortcut: 'r', emoji: '🟥' },
    { label: 'Substitution', type: 'substitution', shortcut: 's', emoji: '🔄' },
    { label: 'Corner', type: 'corner', shortcut: 'c', emoji: '🚩' },
    { label: 'Penalty', type: 'penalty', shortcut: 'p', emoji: '⚡' },
    { label: 'Free Kick', type: 'free_kick', shortcut: 'f', emoji: '🦶' },
    { label: 'Shot', type: 'shot', shortcut: 'h', emoji: '🎯' },
    { label: 'Save', type: 'save', shortcut: 'v', emoji: '🧤' },
  ],
  cricket: [
    { label: 'Wicket', type: 'wicket', shortcut: 'w', emoji: '🏏' },
    { label: 'Four', type: 'boundary_4', shortcut: '4', emoji: '4️⃣' },
    { label: 'Six', type: 'boundary_6', shortcut: '6', emoji: '6️⃣' },
    { label: 'Maiden', type: 'maiden', shortcut: 'm', emoji: '⭕' },
    { label: 'Review', type: 'review', shortcut: 'r', emoji: '📺' },
    { label: 'No Ball', type: 'no_ball', shortcut: 'n', emoji: '🚫' },
    { label: 'Wide', type: 'wide', shortcut: 'd', emoji: '↔️' },
    { label: 'Century', type: 'century', shortcut: 'c', emoji: '💯' },
  ],
  tennis: [
    { label: 'Ace', type: 'ace', shortcut: 'a', emoji: '🎾' },
    { label: 'Winner', type: 'winner', shortcut: 'w', emoji: '🔥' },
    { label: 'Break Point', type: 'break_point', shortcut: 'b', emoji: '⚡' },
    { label: 'Double Fault', type: 'double_fault', shortcut: 'd', emoji: '❌' },
    { label: 'Game', type: 'game', shortcut: 'g', emoji: '✓' },
    { label: 'Set', type: 'set', shortcut: 's', emoji: '📊' },
    { label: 'Match Point', type: 'match_point', shortcut: 'p', emoji: '🏆' },
  ],
  racing: [
    { label: 'Overtake', type: 'overtake', shortcut: 'o', emoji: '🏎️' },
    { label: 'Pit Stop', type: 'pit_stop', shortcut: 'p', emoji: '🔧' },
    { label: 'Crash', type: 'crash', shortcut: 'c', emoji: '💥' },
    { label: 'Fastest Lap', type: 'fastest_lap', shortcut: 'f', emoji: '⚡' },
    { label: 'Safety Car', type: 'safety_car', shortcut: 's', emoji: '🚗' },
    { label: 'Flag', type: 'flag', shortcut: 'l', emoji: '🏁' },
  ],
}

export default function CommentatorPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [commentary, setCommentary] = useState<Commentary[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const { connected, messages, subscribe, unsubscribe } = useWebSocket()

  // Form state
  const [minute, setMinute] = useState('0')
  const [sequence, setSequence] = useState('0')
  const [period, setPeriod] = useState('First Half')
  const [eventType, setEventType] = useState('')
  const [actor, setActor] = useState('')
  const [team, setTeam] = useState('')
  const [message, setMessage] = useState('')
  const [tags, setTags] = useState('')
  
  // New features
  const [rapidFireMode, setRapidFireMode] = useState(false)
  const [autoTimer, setAutoTimer] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [currentSport, setCurrentSport] = useState<keyof typeof SPORT_TEMPLATES>('football')
  const [recentActors, setRecentActors] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [testMode, setTestMode] = useState(false) // Fast timer for testing
  
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const actorInputRef = useRef<HTMLInputElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-focus message field
  useEffect(() => {
    if (selectedMatch && messageInputRef.current) {
      messageInputRef.current.focus()
    }
  }, [selectedMatch, submitting])

  // Auto-timer logic
  useEffect(() => {
    if (autoTimer && timerRunning && selectedMatch) {
      const interval = testMode ? 5000 : 60000 // 5s for test mode, 60s for real
      console.log(`Starting auto-timer... (interval: ${interval}ms)`)
      
      timerIntervalRef.current = setInterval(() => {
        setMinute((prev) => {
          const current = parseInt(prev) || 0
          const next = current + 1
          console.log(`Timer tick: ${current} -> ${next}`)
          return next.toString()
        })
      }, interval)
      
      return () => {
        console.log('Stopping auto-timer...')
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    } else {
      if (timerIntervalRef.current) {
        console.log('Clearing auto-timer (not running)...')
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [autoTimer, timerRunning, selectedMatch, testMode])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Live clock
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(clockInterval)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Allow Ctrl/Cmd + Enter to submit from textarea
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          handleSubmit(e as any)
        }
        return
      }

      // Event type shortcuts (only when not typing)
      const templates = SPORT_TEMPLATES[currentSport]
      const matchedEvent = templates.find(t => t.shortcut === e.key.toLowerCase())
      if (matchedEvent) {
        e.preventDefault()
        setEventType(matchedEvent.type)
        // Focus on message field after selecting event
        setTimeout(() => messageInputRef.current?.focus(), 0)
        return
      }

      // Other shortcuts
      switch (e.key.toLowerCase()) {
        case 'enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleSubmit(e as any)
          }
          break
        case 'escape':
          e.preventDefault()
          clearForm()
          break
        case ' ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setTimerRunning(!timerRunning)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentSport, timerRunning, eventType, message, minute])

  useEffect(() => {
    loadMatches()
  }, [])

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
    
    // Auto-detect sport and set templates
    const sport = match.sport.toLowerCase()
    if (sport.includes('cricket')) setCurrentSport('cricket')
    else if (sport.includes('tennis')) setCurrentSport('tennis')
    else if (sport.includes('racing') || sport.includes('f1')) setCurrentSport('racing')
    else setCurrentSport('football')
    
    // Set team name for easy selection
    if (match.homeTeam && !team) {
      setTeam(match.homeTeam)
    }
    
    try {
      const comments = await api.getCommentary(match.id, 50)
      setCommentary(comments)
    } catch (err) {
      console.error('Failed to load commentary:', err)
      setCommentary([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMatch || !message.trim() || !eventType) return

    setSubmitting(true)
    try {
      const newActor = actor.trim()
      
      await api.createCommentary(selectedMatch.id, {
        minute: parseInt(minute) || 0,
        sequence: parseInt(sequence) || 0,
        period,
        eventType: eventType, // Required field
        actor: newActor || undefined,
        team: team || undefined,
        message: message.trim(),
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })

      // Update recent actors
      if (newActor && !recentActors.includes(newActor)) {
        setRecentActors(prev => [newActor, ...prev.slice(0, 9)])
      }

      // Clear form based on mode
      if (rapidFireMode) {
        // In rapid-fire mode, only clear message and event type
        setMessage('')
        setEventType('')
        setSequence('0')
        // Auto-focus message field
        setTimeout(() => messageInputRef.current?.focus(), 0)
      } else {
        // Normal mode - clear most fields
        setMessage('')
        setActor('')
        setEventType('')
        setTags('')
        setSequence('0')
      }
    } catch (err) {
      console.error('Failed to create commentary:', err)
      alert('Failed to create commentary')
    } finally {
      setSubmitting(false)
    }
  }

  const clearForm = () => {
    setMessage('')
    setActor('')
    setEventType('')
    setTags('')
    setSequence('0')
    messageInputRef.current?.focus()
  }

  const copyLastEntry = () => {
    if (commentary.length > 0) {
      const last = commentary[0]
      setMinute(last.minute.toString())
      setSequence(last.sequence?.toString() || '0')
      setPeriod(last.period)
      if (last.eventType) setEventType(last.eventType)
      if (last.actor) setActor(last.actor)
      if (last.team) setTeam(last.team)
      messageInputRef.current?.focus()
    }
  }

  const incrementMinute = () => {
    setMinute((prev) => {
      const current = parseInt(prev) || 0
      return (current + 1).toString()
    })
  }

  const decrementMinute = () => {
    setMinute((prev) => {
      const current = parseInt(prev) || 0
      return Math.max(0, current - 1).toString()
    })
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

  const currentTemplates = SPORT_TEMPLATES[currentSport]

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
              <h1 className="text-2xl font-bold text-gray-800">Commentator Mode</h1>
              {rapidFireMode && (
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Rapid Fire
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <Keyboard className="w-4 h-4" />
                Shortcuts
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">General</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Submit commentary</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl/Cmd + Enter</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Clear form</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Toggle timer</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl/Cmd + Space</kbd>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Event Shortcuts ({currentSport})</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {currentTemplates.map((template) => (
                    <div key={template.type} className="flex justify-between">
                      <span className="text-gray-700">{template.emoji} {template.label}</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded">{template.shortcut.toUpperCase()}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-gray-900">Rapid Fire Mode</span>
                  <input
                    type="checkbox"
                    checked={rapidFireMode}
                    onChange={(e) => setRapidFireMode(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-1">Keep team, actor, and minute between submissions</p>
              </div>
              
              <div>
                <label className="flex items-center justify-between">
                  <span className="text-gray-900">Auto Timer</span>
                  <input
                    type="checkbox"
                    checked={autoTimer}
                    onChange={(e) => setAutoTimer(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-1">Automatically increment minute every 60 seconds</p>
              </div>
              
              {autoTimer && (
                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-900">Test Mode (5s intervals)</span>
                    <input
                      type="checkbox"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-1">Use 5 second intervals instead of 60 for testing</p>
                </div>
              )}
              
              <div>
                <label className="block text-gray-900 mb-2">Sport Template</label>
                <select
                  value={currentSport}
                  onChange={(e) => setCurrentSport(e.target.value as keyof typeof SPORT_TEMPLATES)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="football">Football/Soccer ⚽</option>
                  <option value="cricket">Cricket 🏏</option>
                  <option value="tennis">Tennis 🎾</option>
                  <option value="racing">Racing 🏎️</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Select Match
              </h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-600">
                  Loading matches...
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No matches available
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      onClick={() => selectMatch(match)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMatch?.id === match.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">
                          {match.sport} - {match.league}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {match.homeTeam} vs {match.awayTeam}
                      </div>
                      <div className="text-2xl font-bold text-black mt-2">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Commentary Form and Feed */}
          <div className="lg:col-span-2 space-y-6">
            {selectedMatch ? (
              <>
                {/* Match Info */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">
                        {selectedMatch.sport} - {selectedMatch.league}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedMatch.venue}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(selectedMatch.startTime), 'MMM d, HH:mm')}
                        </div>
                      </div>
                      
                      {/* Live Clock and Timer Status */}
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-mono text-gray-900">
                            {format(currentTime, 'HH:mm:ss')}
                          </span>
                        </div>
                        {autoTimer && (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            timerRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {timerRunning ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-medium">Timer Running{testMode ? ' (5s)' : ' (60s)'}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                <span className="font-medium">Timer Paused</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-black">
                        {selectedMatch.homeScore} - {selectedMatch.awayScore}
                      </div>
                      <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${getStatusColor(selectedMatch.status)}`}>
                        {selectedMatch.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commentary Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add Commentary
                    </h3>
                    <div className="flex items-center gap-2">
                      {commentary.length > 0 && (
                        <button
                          onClick={copyLastEntry}
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Copy Last
                        </button>
                      )}
                      <button
                        onClick={clearForm}
                        type="button"
                        className="text-sm text-gray-700 hover:text-gray-900"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Minute *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="0"
                            required
                            min="0"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={incrementMinute}
                              className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={decrementMinute}
                              className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                            >
                              -
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          +Time
                        </label>
                        <input
                          type="number"
                          value={sequence}
                          onChange={(e) => setSequence(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Timer {autoTimer && `(Match Min: ${minute}'${testMode ? ' - TEST MODE' : ''})`}
                        </label>
                        <div className="flex gap-2">
                          {autoTimer && (
                            <button
                              type="button"
                              onClick={() => setTimerRunning(!timerRunning)}
                              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-1 font-medium ${
                                timerRunning
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={timerRunning ? 'Pause timer (Ctrl+Space)' : 'Start timer (Ctrl+Space)'}
                            >
                              {timerRunning ? (
                                <>
                                  <Pause className="w-4 h-4" />
                                  <span className="text-xs">Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  <span className="text-xs">Start</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setMinute('0')}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            title="Reset to 0"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Period *
                      </label>
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option>First Half</option>
                        <option>Second Half</option>
                        <option>Extra Time - First Half</option>
                        <option>Extra Time - Second Half</option>
                        <option>Penalty Shootout</option>
                        <option>Full Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Event Type * (Required - Use keyboard shortcuts!)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {currentTemplates.map((btn) => (
                          <button
                            key={btn.type}
                            type="button"
                            onClick={() => setEventType(btn.type)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                              eventType === btn.type
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                            }`}
                            title={`Press '${btn.shortcut}' key`}
                          >
                            <span>{btn.emoji}</span>
                            <span>{btn.label}</span>
                            <kbd className="ml-1 text-xs opacity-60">{btn.shortcut}</kbd>
                          </button>
                        ))}
                      </div>
                      {!eventType && (
                        <p className="mt-2 text-sm text-red-600">Please select an event type</p>
                      )}
                      {eventType && (
                        <button
                          type="button"
                          onClick={() => setEventType('')}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Clear event type
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Player/Actor
                        </label>
                        <input
                          ref={actorInputRef}
                          type="text"
                          value={actor}
                          onChange={(e) => setActor(e.target.value)}
                          list="recent-actors"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Player name"
                        />
                        <datalist id="recent-actors">
                          {recentActors.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Team
                        </label>
                        <select
                          value={team}
                          onChange={(e) => setTeam(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select team</option>
                          <option>{selectedMatch.homeTeam}</option>
                          <option>{selectedMatch.awayTeam}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Message * (Ctrl/Cmd + Enter to submit)
                      </label>
                      <textarea
                        ref={messageInputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base text-black"
                        rows={4}
                        placeholder="Describe what happened..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="goal, highlight, controversial"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !connected}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-lg"
                    >
                      <Send className="w-5 h-5" />
                      {submitting ? 'Submitting...' : 'Submit Commentary (Ctrl+Enter)'}
                    </button>
                  </form>
                </div>

                {/* Recent Commentary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Commentary
                  </h3>
                  
                  {commentary.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No commentary yet
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {commentary.slice(0, 20).map((comment, index) => (
                        <div
                          key={`comment-${comment.id}-${index}`}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-green-600">
                                {comment.minute}'
                              </span>
                              {comment.sequence !== null && comment.sequence > 0 && (
                                <span className="text-xs text-gray-600">
                                  +{comment.sequence}
                                </span>
                              )}
                              {comment.eventType && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                                  {comment.eventType}
                                </span>
                              )}
                              {comment.actor && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                                  {comment.actor}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-600">
                              {format(new Date(comment.createdAt), 'HH:mm:ss')}
                            </span>
                          </div>
                          <p className="text-sm text-black font-medium">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-16 text-center">
                <div className="text-gray-500">
                  <div className="text-6xl mb-4">⚽</div>
                  <p className="text-lg">Select a match to start commenting</p>
                  <p className="text-sm mt-2">Use keyboard shortcuts for faster commentary!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}