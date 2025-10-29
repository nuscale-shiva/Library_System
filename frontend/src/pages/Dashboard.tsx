import { useQuery } from '@tanstack/react-query'
import { Book, Users, BookOpen, TrendingUp, Activity, BarChart } from 'lucide-react'
import Card from '../components/ui/Card'
import { booksAPI, membersAPI, borrowsAPI } from '../services/api'

export default function Dashboard() {
  const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => booksAPI.getAll() })
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => membersAPI.getAll() })
  const { data: borrows } = useQuery({ queryKey: ['borrows'], queryFn: () => borrowsAPI.getAll() })

  const stats = [
    {
      title: 'Total Books',
      value: books?.length || 0,
      icon: Book,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/20 to-purple-600/20',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Available Books',
      value: books?.filter(b => b.available).length || 0,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-500/20 to-emerald-600/20',
      borderColor: 'border-green-500/30'
    },
    {
      title: 'Total Members',
      value: members?.length || 0,
      icon: Users,
      gradient: 'from-pink-500 to-rose-600',
      bgGradient: 'from-pink-500/20 to-rose-600/20',
      borderColor: 'border-pink-500/30'
    },
    {
      title: 'Active Borrows',
      value: borrows?.filter(b => !b.is_returned).length || 0,
      icon: BookOpen,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-500/20 to-orange-600/20',
      borderColor: 'border-amber-500/30'
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-30"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-gray-400">Overview of your library system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="group hover:scale-105 transition-all duration-300 overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                 style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                 className={`${stat.gradient}`}></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{stat.title}</p>
                <p className="text-3xl font-bold bg-gradient-to-br text-transparent bg-clip-text"
                   className={`${stat.gradient}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.bgGradient} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Recently Added Books</h3>
              <BarChart className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-3">
              {books?.slice(0, 5).map((book, index) => (
                <div
                  key={book.id}
                  className="group flex items-center justify-between p-4 rounded-lg glass-hover transition-all duration-300 hover:translate-x-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-purple-400 transition-colors">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.author}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                    book.available
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>
                </div>
              ))}
              {(!books || books.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No books added yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Recent Members</h3>
              <Activity className="w-5 h-5 text-pink-400" />
            </div>
            <div className="space-y-3">
              {members?.slice(0, 5).map((member, index) => (
                <div
                  key={member.id}
                  className="group flex items-center justify-between p-4 rounded-lg glass-hover transition-all duration-300 hover:translate-x-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold gradient-text">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-pink-400 transition-colors">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!members || members.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No members registered yet</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
