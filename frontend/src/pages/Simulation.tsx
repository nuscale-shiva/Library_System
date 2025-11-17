import { useState, useRef, useEffect } from 'react'
import { Play, Square, Terminal, RefreshCw, Trash2, Activity, Cpu, Database, Network } from 'lucide-react'

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
  const [glitchActive, setGlitchActive] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Fetch available scenarios on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/simulation/scenarios')
      .then(res => res.json())
      .then(data => setScenarios(data.scenarios))
      .catch(err => console.error('Failed to fetch scenarios:', err))

    // Subtle glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 100)
    }, 15000)

    return () => {
      clearInterval(glitchInterval)
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
      case 'agent_speaking': return 'text-white/70'
      case 'agent_action': return 'text-white'
      case 'system_message': return 'text-white/60'
      case 'scenario_start': return 'text-white'
      case 'scenario_end': return 'text-white'
      case 'error': return 'text-red-500'
      default: return 'text-white/50'
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
      return (
        <>
          <span className="text-white/30">[{time}]</span>
          <span className="text-white/50"> • </span>
          <span className={`${glitchActive ? 'sci-fi-glitch' : ''} text-white/90 font-semibold`}>
            {event.agent_name}
          </span>
          <span className="text-white/30"> »</span>
        </>
      )
    }
    return (
      <>
        <span className="text-white/30">[{time}]</span>
        <span className="text-white/50"> • </span>
        <span className="text-white/90 font-semibold">SYSTEM</span>
        <span className="text-white/30"> »</span>
      </>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative animate-fade-in-up">
      {/* Subtle sci-fi grid background */}
      <div className="sci-fi-grid"></div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header Section */}
        <div className="mb-6 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="sci-fi-card p-3 relative">
                <Terminal className="w-6 h-6 text-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  A2A SIMULATION TERMINAL
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-3 h-3 text-white/40" />
                  <p className="text-xs text-white/40 font-mono tracking-wider uppercase">
                    Agent-to-Agent Library Orchestration System
                  </p>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex items-center gap-3 animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <div className="sci-fi-card px-3 py-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-white/60" />
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  disabled={isRunning}
                  className="bg-transparent text-white text-xs font-mono tracking-wide outline-none disabled:opacity-50"
                >
                  {scenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id} className="bg-black">
                      {scenario.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedScenario === 'continuous' && (
                <div className="sci-fi-card px-3 py-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                    min={1}
                    max={60}
                    disabled={isRunning}
                    className="bg-transparent text-white text-xs font-mono w-12 outline-none disabled:opacity-50"
                    placeholder="MIN"
                  />
                  <span className="text-white/40 text-xs">MIN</span>
                </div>
              )}

              {!isRunning ? (
                <button
                  onClick={startSimulation}
                  className="sci-fi-button-green px-4 py-2 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs tracking-wider">START</span>
                </button>
              ) : (
                <button
                  onClick={stopSimulation}
                  className="sci-fi-button-red px-4 py-2 flex items-center gap-2"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs tracking-wider">STOP</span>
                </button>
              )}

              <button
                onClick={fetchEvents}
                className="sci-fi-button p-2"
                title="Refresh events"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={clearTerminal}
                className="sci-fi-button p-2"
                title="Clear terminal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Section */}
        <div className="flex-1 sci-fi-terminal rounded overflow-hidden relative animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="sci-fi-scan-line"></div>

          {/* Terminal Header */}
          <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between bg-black/80">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs text-white/30 font-mono tracking-wider">
                library-simulation@nexus
              </span>
            </div>
            {isRunning && (
              <div className="flex items-center gap-2">
                <Network className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-mono tracking-wider">
                  STREAMING
                </span>
              </div>
            )}
          </div>

          {/* Terminal Content */}
          <div
            ref={terminalRef}
            className="h-full p-4 overflow-y-auto scrollbar-thin bg-black/90 font-mono"
          >
            {events.length === 0 ? (
              <div className="space-y-2">
                <div className="text-white/20 text-xs">
                  <div>╔════════════════════════════════════════╗</div>
                  <div>║  A2A SIMULATION TERMINAL v2.0          ║</div>
                  <div>║  © 2024 Library Management System      ║</div>
                  <div>╚════════════════════════════════════════╝</div>
                </div>
                <div className="mt-4 text-white/30 text-xs">
                  <div>Initializing agent network...</div>
                  <div>Loading library database...</div>
                  <div>Awaiting simulation parameters...</div>
                  <div className="mt-2 flex items-center">
                    <span className="text-white/50">$</span>
                    <span className="ml-2 inline-block w-2 h-3 bg-white/60 animate-blink"></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {events.map((event, idx) => (
                  <div
                    key={event.event_id}
                    className={`text-xs leading-relaxed flex items-start gap-2 ${getEventColor(event.event_type)} animate-fade-in`}
                    style={{ animationDelay: `${Math.min(idx * 0.01, 0.3)}s` }}
                  >
                    <span className="flex items-center gap-1 flex-shrink-0">
                      {getEventPrefix(event)}
                    </span>
                    <span className="flex-1">
                      {event.content}
                    </span>
                  </div>
                ))}
                {isRunning && (
                  <div className="text-white/30 flex items-center mt-2">
                    <span className="text-white/50">$</span>
                    <span className="ml-2 inline-block w-2 h-3 bg-white/60 animate-blink"></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-white/30 font-mono animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-white/30" />
            <span>
              STATUS: {isRunning ? <span className="text-green-400">ACTIVE</span> : <span className="text-white/40">STANDBY</span>}
            </span>
          </div>
          <span className="text-white/20">•</span>
          <span>OPENAI GPT-4</span>
          <span className="text-white/20">•</span>
          <span>LANGCHAIN</span>
          <span className="text-white/20">•</span>
          <span>SSE STREAMING</span>
        </div>
      </div>
    </div>
  )
}