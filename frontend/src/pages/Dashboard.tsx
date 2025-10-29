import { useQuery } from '@tanstack/react-query'
import { Book, Users, BookOpen, TrendingUp } from 'lucide-react'
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
      color: 'text-blue-500'
    },
    {
      title: 'Available Books',
      value: books?.filter(b => b.available).length || 0,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Total Members',
      value: members?.length || 0,
      icon: Users,
      color: 'text-purple-500'
    },
    {
      title: 'Active Borrows',
      value: borrows?.filter(b => !b.is_returned).length || 0,
      icon: BookOpen,
      color: 'text-orange-500'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your library system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 bg-dark-bg rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-semibold mb-4">Recently Added Books</h3>
          <div className="space-y-3">
            {books?.slice(0, 5).map((book) => (
              <div
                key={book.id}
                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
              >
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-gray-400">{book.author}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  book.available
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {book.available ? 'Available' : 'Borrowed'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold mb-4">Recent Members</h3>
          <div className="space-y-3">
            {members?.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
