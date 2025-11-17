import { useState, useRef, useEffect } from 'react'
import { Play, Square, Terminal, RefreshCw, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'

interface SimulationEvent {
  event_id: string
  timestamp: string
  event_type: string
  agent_name: string | null
  content: string
  details: Record<string, any>
}

interface Scenario {
  id: string
  name: string
  description: string
}

export default function Simulation() {
  const [isRunning, setIsRunning] = useState(false)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState('busy_day')
  const [duration, setDuration] = useState(5)
  const terminalRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch available scenarios on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/simulation/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data.scenarios))
      .catch(err => console.error('Failed to fetch scenarios:', err))

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // Poll for events as backup to SSE
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      // Poll every 2 seconds when simulation is running
      interval = setInterval(() => {
        fetchEvents()
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [events])

  const startSimulation = async () => {
    try {
      // Clear previous events
      setEvents([])

      // Start simulation
      const response = await fetch('http://localhost:8000/api/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          duration_minutes: selectedScenario === 'continuous' ? duration : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to start simulation:', response.status, errorData)
        throw new Error(errorData.detail || `Failed to start simulation: ${response.status}`)
      }

      const data = await response.json()
      console.log('Simulation started:', data)
      setIsRunning(true)

      // Connect to SSE stream
      const eventSource = new EventSource('http://localhost:8000/api/simulation/stream')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('SSE Event received:', data)

          if (data.type === 'completed' || data.type === 'cancelled') {
            console.log('Simulation ended:', data.type)
            setIsRunning(false)
            eventSource.close()
            eventSourceRef.current = null
          } else if (data.event_id) {
            console.log('Adding event:', data.content)
            setEvents(prev => [...prev, data])
          } else if (data.type === 'connected') {
            console.log('SSE Connected')
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e, event.data)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        // Don't immediately close on error - SSE will auto-reconnect
        // Only close if we're not running anymore
        if (!isRunning) {
          eventSource.close()
          eventSourceRef.current = null
        }
      }

    } catch (error: any) {
      console.error('Failed to start simulation:', error)
      alert(error.message || 'Failed to start simulation')
      setIsRunning(false)
    }
  }

  const stopSimulation = async () => {
    try {
      await fetch('http://localhost:8000/api/simulation/stop', {
        method: 'POST'
      })

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      setIsRunning(false)
    } catch (error) {
      console.error('Failed to stop simulation:', error)
    }
  }

  const clearTerminal = () => {
    setEvents([])
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/simulation/events?limit=100')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'agent_thinking': return 'text-white/40'
      case 'agent_speaking': return 'text-white/80'
      case 'agent_action': return 'text-green-400'
      case 'system_message': return 'text-yellow-400'
      case 'scenario_start': return 'text-blue-400'
      case 'scenario_end': return 'text-blue-400'
      case 'error': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  const getEventPrefix = (event: SimulationEvent) => {
    const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    if (event.agent_name) {
      return `[${time}] ${event.agent_name}>`
    }
    return `[${time}] SYSTEM>`
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in-up">
      <div className="mb-6 animate-slide-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black border border-white/10 corner-brackets relative">
              <Terminal className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white relative inline-block">
                A2A Simulation Terminal
                <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
              </h1>
              <p className="text-xs text-white/60 mt-2 font-mono">
                AGENT-TO-AGENT LIBRARY SIMULATION v1.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              disabled={isRunning}
              className="bg-black border border-white/10 text-white text-xs px-3 py-1.5 font-mono hover:border-white/20 disabled:opacity-50"
            >
              {scenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>

            {selectedScenario === 'continuous' && (
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                min={1}
                max={60}
                disabled={isRunning}
                className="bg-black border border-white/10 text-white text-xs px-3 py-1.5 font-mono w-20 hover:border-white/20 disabled:opacity-50"
                placeholder="Minutes"
              />
            )}

            {!isRunning ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-black text-xs font-bold hover:bg-green-400 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                START
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition-colors animate-pulse"
              >
                <Square className="w-3.5 h-3.5" />
                STOP
              </button>
            )}

            <button
              onClick={fetchEvents}
              className="p-1.5 border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-colors"
              title="Refresh events"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={clearTerminal}
              className="p-1.5 border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-colors"
              title="Clear terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Card className="flex-1 bg-black p-0 overflow-hidden font-mono animate-slide-in" style={{ animationDelay: '0.3s' }}>
        <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-white/40">library-simulation@terminal</span>
          </div>
          {isRunning && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-green-400 animate-spin" />
              <span className="text-xs text-green-400">RUNNING</span>
            </div>
          )}
        </div>

        <div
          ref={terminalRef}
          className="h-full p-4 overflow-y-auto scrollbar-thin bg-black"
        >
          {events.length === 0 ? (
            <div className="text-white/20 text-xs">
              <div>Library Simulation Terminal v1.0</div>
              <div>Copyright (c) 2024 Library Management System</div>
              <div className="mt-4">Waiting for simulation to start...</div>
              <div className="mt-2">$ _</div>
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event, idx) => (
                <div
                  key={event.event_id}
                  className={`text-xs leading-relaxed ${getEventColor(event.event_type)} animate-fade-in`}
                  style={{ animationDelay: `${idx * 0.01}s` }}
                >
                  <span className="text-white/30">{getEventPrefix(event)}</span>{' '}
                  <span className="ml-2">{event.content}</span>
                </div>
              ))}
              {isRunning && (
                <div className="text-white/40 animate-pulse">
                  $ <span className="inline-block w-2 h-3 bg-white/60 animate-blink"></span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4 text-xs text-white/30 font-mono text-center animate-slide-in" style={{ animationDelay: '0.4s' }}>
        POWERED BY OPENAI GPT-4 • LANGCHAIN AGENTS • REAL-TIME SSE STREAMING
      </div>
    </div>
  )
}