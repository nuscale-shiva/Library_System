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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-surface border-r border-dark-border">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-8">
          <Library className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-xl font-bold">LibraryAI</h1>
            <p className="text-xs text-gray-500">Management System</p>
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
                  'flex items-center gap-3 px-4 py-3 rounded-lg',
                  'transition-all duration-200 group',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5',
                  isActive && 'text-white'
                )} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <div className="px-4 py-3 bg-dark-bg rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Version</p>
            <p className="text-sm font-medium">2.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
