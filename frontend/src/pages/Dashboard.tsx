import { useQuery } from '@tanstack/react-query'
import { Book, Users, BookOpen, TrendingUp } from 'lucide-react'
import { booksAPI, membersAPI, borrowsAPI } from '../services/api'

export default function Dashboard() {
  const { data: books } = useQuery({ queryKey: ['books'], queryFn: () => booksAPI.getAll() })
  const { data: members } = useQuery({ queryKey: ['members'], queryFn: () => membersAPI.getAll() })
  const { data: borrows } = useQuery({ queryKey: ['borrows'], queryFn: () => borrowsAPI.getAll() })

  const stats = [
    {
      title: 'TOTAL BOOKS',
      value: books?.length || 0,
      icon: Book,
    },
    {
      title: 'AVAILABLE',
      value: books?.filter(b => b.available).length || 0,
      icon: TrendingUp,
    },
    {
      title: 'MEMBERS',
      value: members?.length || 0,
      icon: Users,
    },
    {
      title: 'ACTIVE BORROWS',
      value: borrows?.filter(b => !b.is_returned).length || 0,
      icon: BookOpen,
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="animate-slide-in">
        <h1 className="text-3xl font-bold text-white mb-2 relative inline-block">
          Dashboard
          <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
        </h1>
        <p className="text-white/60 text-sm mt-3">Overview of your library system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="card card-hover corner-brackets p-6 stagger-item"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-white/40" />
              <div className="w-1.5 h-1.5 bg-white/60 animate-pulse"></div>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2 animate-counter-up">{stat.value}</p>
              <p className="text-xs text-white/60 hologram">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-lg font-bold text-white mb-6 uppercase flex items-center gap-2">
            <div className="w-1 h-1 bg-white animate-pulse"></div>
            Recent Books
          </h3>
          <div className="space-y-3">
            {books?.slice(0, 5).map((book, index) => (
              <div
                key={book.id}
                className="flex items-center justify-between p-3 border-l-2 border-transparent hover:border-white/30 hover:bg-white/5 transition-all duration-300 sci-fi-hover"
                style={{ animationDelay: `${0.5 + index * 0.05}s` }}
              >
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{book.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{book.author}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 border hologram ${
                  book.available
                    ? 'border-white/20 text-white'
                    : 'border-white/10 text-white/40'
                }`}>
                  {book.available ? 'AVAILABLE' : 'BORROWED'}
                </span>
              </div>
            ))}
            {(!books || books.length === 0) && (
              <div className="text-center py-12 text-white/40">
                <Book className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-sm">No books added yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 animate-slide-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-bold text-white mb-6 uppercase flex items-center gap-2">
            <div className="w-1 h-1 bg-white animate-pulse"></div>
            Recent Members
          </h3>
          <div className="space-y-3">
            {members?.slice(0, 5).map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 border-l-2 border-transparent hover:border-white/30 hover:bg-white/5 transition-all duration-300 sci-fi-hover"
                style={{ animationDelay: `${0.6 + index * 0.05}s` }}
              >
                <div className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors">
                  <span className="text-sm font-bold text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{member.name}</p>
                  <p className="text-xs text-white/50">{member.email}</p>
                </div>
              </div>
            ))}
            {(!members || members.length === 0) && (
              <div className="text-center py-12 text-white/40">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-sm">No members registered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
