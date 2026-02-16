'use client'

import { useState } from 'react'
import { ArrowLeft, Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useWebSocket } from '@/lib/useWebSocket'
import { api } from '@/lib/api'


export default function CreatorPage() {
  const { connected } = useWebSocket()
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [sport, setSport] = useState('Football')
  const [league, setLeague] = useState('')
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [homeScore, setHomeScore] = useState('0')
  const [awayScore, setAwayScore] = useState('0')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!league || !homeTeam || !awayTeam || !venue || !startDate || !startTime || !endDate || !endTime) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setSuccessMessage('')

    try {
      const startDateTime = `${startDate}T${startTime}:00.000Z`
      const endDateTime = `${endDate}T${endTime}:00.000Z`

      await api.createMatch({
        sport,
        league,
        homeTeam,
        awayTeam,
        venue,
        startTime: startDateTime,
        endTime: endDateTime,
        homeScore: parseInt(homeScore) || 0,
        awayScore: parseInt(awayScore) || 0,
      })

      setSuccessMessage('Match created successfully!')
      
      // Reset form
      setLeague('')
      setHomeTeam('')
      setAwayTeam('')
      setVenue('')
      setStartDate('')
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setHomeScore('0')
      setAwayScore('0')

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Failed to create match:', err)
      alert('Failed to create match. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const sportOptions = [
    'Football',
    'Basketball',
    'Cricket',
    'Tennis',
    'Rugby',
    'Baseball',
    'Hockey',
    'Volleyball',
  ]

  const quickFillExample = () => {
    const now = new Date()
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
    
    setSport('Football')
    setLeague('Premier League')
    setHomeTeam('Manchester United')
    setAwayTeam('Liverpool')
    setVenue('Old Trafford')
    setStartDate(now.toISOString().split('T')[0])
    setStartTime(now.toTimeString().slice(0, 5))
    setEndDate(later.toISOString().split('T')[0])
    setEndTime(later.toTimeString().slice(0, 5))
    setHomeScore('0')
    setAwayScore('0')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
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
              <h1 className="text-2xl font-bold text-gray-800">Match Creator</h1>
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
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create New Match</h2>
                <p className="text-gray-600 mt-1">Fill in the details below to create a match</p>
              </div>
              <button
                type="button"
                onClick={quickFillExample}
                className="text-sm text-purple-600 hover:text-purple-800 underline"
              >
                Quick fill example
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sport and League */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport *
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {sportOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    League/Tournament *
                  </label>
                  <input
                    type="text"
                    value={league}
                    onChange={(e) => setLeague(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Premier League"
                    required
                  />
                </div>
              </div>

              {/* Teams */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home Team *
                  </label>
                  <input
                    type="text"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Manchester United"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Away Team *
                  </label>
                  <input
                    type="text"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Liverpool"
                    required
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Old Trafford"
                  required
                />
              </div>

              {/* Start Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* End Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Initial Scores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Scores (optional)
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Home Team Score</label>
                    <input
                      type="number"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Away Team Score</label>
                    <input
                      type="number"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !connected}
                  className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  {submitting ? 'Creating Match...' : 'Create Match'}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Tips for creating matches:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All viewers and commentators will be notified of new matches in real-time</li>
                  <li>Match status (upcoming/live/finished) is automatically determined by start and end times</li>
                  <li>You can set initial scores or leave them at 0-0</li>
                  <li>Make sure the end time is after the start time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}