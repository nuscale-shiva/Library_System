import { useState, useEffect } from 'react'
import { systemAPI, type HealthStatus } from '../services/api'

interface SystemStatus {
  isOnline: boolean
  status: 'healthy' | 'degraded' | 'offline'
  services: {
    api: 'online' | 'offline'
    database: 'online' | 'offline'
    ai: 'online' | 'offline'
  }
  lastChecked: string | null
  isChecking: boolean
}

export function useSystemStatus(intervalMs: number = 10000) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isOnline: false,
    status: 'offline',
    services: {
      api: 'offline',
      database: 'offline',
      ai: 'offline'
    },
    lastChecked: null,
    isChecking: true
  })

  const checkHealth = async () => {
    try {
      const health: HealthStatus = await systemAPI.health()
      setSystemStatus({
        isOnline: health.status !== 'offline',
        status: health.status,
        services: health.services,
        lastChecked: health.timestamp,
        isChecking: false
      })
    } catch (error) {
      setSystemStatus({
        isOnline: false,
        status: 'offline',
        services: {
          api: 'offline',
          database: 'offline',
          ai: 'offline'
        },
        lastChecked: new Date().toISOString(),
        isChecking: false
      })
    }
  }

  useEffect(() => {
    // Check immediately on mount
    checkHealth()

    // Set up interval for periodic checks
    const interval = setInterval(checkHealth, intervalMs)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [intervalMs])

  return systemStatus
}
