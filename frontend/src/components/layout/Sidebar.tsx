import { Link, useLocation } from 'react-router-dom'
import { Home, Book, Users, BookOpen, Bot, Library } from 'lucide-react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Books', href: '/books', icon: Book },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Borrows', href: '/borrows', icon: BookOpen },
  { name: 'AI Assistant', href: '/ai', icon: Bot }
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/5">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Library className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold gradient-text">LibraryAI</h1>
              <p className="text-xs text-gray-500 font-mono">v2.0.0</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActive && 'text-purple-400'
                )} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <div className="p-4 rounded-lg glass">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-300">System Online</p>
            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-purple-500 to-pink-500 animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}