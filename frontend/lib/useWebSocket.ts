'use client'

import { useEffect, useRef, useState } from 'react'
import { WS_URL } from './api'
import type { WSMessage } from './types'

export function useWebSocket(matchId?: number) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WSMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)

      // Subscribe to match if matchId is provided
      if (matchId) {
        ws.send(JSON.stringify({ type: 'subscribe', matchId }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data)
        console.log('Received message:', message)
        setMessages((prev) => [...prev, message])
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        if (matchId) {
          ws.send(JSON.stringify({ type: 'unsubscribe', matchId }))
        }
        ws.close()
      }
    }
  }, [matchId])

  const subscribe = (newMatchId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', matchId: newMatchId }))
    }
  }

  const unsubscribe = (oldMatchId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', matchId: oldMatchId }))
    }
  }

  return { connected, messages, subscribe, unsubscribe }
}