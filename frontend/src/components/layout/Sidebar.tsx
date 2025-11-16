import { Link, useLocation } from 'react-router-dom'
import { Home, Book, Users, BookOpen, Bot, Library, Database, Cpu, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSystemStatus } from '../../hooks/useSystemStatus'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Books', href: '/books', icon: Book },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Borrows', href: '/borrows', icon: BookOpen },
  { name: 'AI Assistant', href: '/ai', icon: Bot }
]

export default function Sidebar() {
  const location = useLocation()
  const systemStatus = useSystemStatus(10000) // Check every 10 seconds

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/10 animate-slide-in">
      <div className="flex flex-col h-full">
        <div className="px-6 py-8 animate-fade-in-up">
          <div className="relative">
            <h1 className="text-lg font-bold text-white relative inline-block">
              LibraryAI
              <span className="absolute -bottom-1 left-0 w-full h-px bg-white/30"></span>
            </h1>
            <p className="text-xs text-white/40 mt-2 hologram">v2.0.0</p>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 animate-pulse"></div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-all duration-300 text-sm border-l-2 relative overflow-hidden stagger-item',
                  isActive
                    ? 'text-white border-white bg-white/5'
                    : 'text-white/50 border-transparent hover:text-white hover:border-white/30 hover:bg-white/5 sci-fi-hover'
                )}
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <item.icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="p-3 border border-white/10 corner-brackets hover:border-white/20 transition-all duration-300 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/40 hologram">SYSTEM STATUS</p>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors relative",
                systemStatus.isOnline ? "bg-white" : "bg-white/30",
                systemStatus.isOnline && "animate-pulse"
              )}>
                {systemStatus.isOnline && (
                  <div className="absolute inset-0 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-1.5 hover:bg-white/5 transition-colors">
                <span className="text-white/60 flex items-center gap-2">
                  <div className="w-0.5 h-0.5 bg-white/40"></div>
                  API
                </span>
                <span className={cn(
                  "text-xs hologram",
                  systemStatus.services.api === 'online' ? "text-white" : "text-white/30"
                )}>
                  {systemStatus.services.api}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-1.5 hover:bg-white/5 transition-colors">
                <span className="text-white/60 flex items-center gap-2">
                  <div className="w-0.5 h-0.5 bg-white/40"></div>
                  Database
                </span>
                <span className={cn(
                  "text-xs hologram",
                  systemStatus.services.database === 'online' ? "text-white" : "text-white/30"
                )}>
                  {systemStatus.services.database}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-1.5 hover:bg-white/5 transition-colors">
                <span className="text-white/60 flex items-center gap-2">
                  <div className="w-0.5 h-0.5 bg-white/40"></div>
                  AI
                </span>
                <span className={cn(
                  "text-xs hologram",
                  systemStatus.services.ai === 'online' ? "text-white" : "text-white/30"
                )}>
                  {systemStatus.services.ai}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-white/30 hologram">
                {systemStatus.lastChecked &&
                  new Date(systemStatus.lastChecked).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}