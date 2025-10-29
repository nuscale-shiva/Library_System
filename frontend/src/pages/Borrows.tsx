import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, Book, User, Calendar, Clock, ArrowRight } from 'lucide-react'
import { borrowsAPI, booksAPI, membersAPI } from '../services/api'
import type { BorrowCreate } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import { formatDateTime } from '../lib/utils'

export default function Borrows() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<BorrowCreate>({
    book_id: 0,
    member_id: 0
  })

  const queryClient = useQueryClient()
  const { data: borrows, isLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: () => borrowsAPI.getAll()
  })

  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => booksAPI.getAll()
  })

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersAPI.getAll()
  })

  const createMutation = useMutation({
    mutationFn: borrowsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      closeModal()
    }
  })

  const returnMutation = useMutation({
    mutationFn: borrowsAPI.return,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    }
  })

  const openCreateModal = () => {
    setFormData({ book_id: 0, member_id: 0 })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({ book_id: 0, member_id: 0 })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const availableBooks = books?.filter(b => b.available)

  const borrowsWithDetails = borrows?.map(borrow => ({
    ...borrow,
    book: books?.find(b => b.id === borrow.book_id),
    member: members?.find(m => m.id === borrow.member_id)
  }))

  const activeBorrows = borrowsWithDetails?.filter(b => !b.is_returned)
  const returnedBorrows = borrowsWithDetails?.filter(b => b.is_returned)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-30"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Borrows</span>
            </h1>
            <p className="text-gray-400">Track book borrowing activities</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="shadow-lg shadow-purple-500/20">
          <Plus className="w-5 h-5 mr-2" />
          New Borrow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              Active Borrows
            </h2>
            <span className="text-xs text-gray-500 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
              {activeBorrows?.length || 0} active
            </span>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <Card className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                <p className="text-gray-400">Loading borrows...</p>
              </Card>
            ) : activeBorrows && activeBorrows.length > 0 ? (
              activeBorrows.map((borrow, index) => (
                <Card
                  key={borrow.id}
                  className="group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                          <Book className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                            {borrow.book?.title || 'Unknown Book'}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            by {borrow.book?.author || 'Unknown'}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-pink-400" />
                              <span className="text-gray-400">{borrow.member?.name || 'Unknown Member'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-gray-500">{formatDateTime(borrow.borrowed_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        if (confirm('Mark this book as returned?')) {
                          returnMutation.mutate(borrow.id)
                        }
                      }}
                      className="hover:shadow-lg hover:shadow-purple-500/30"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Return
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Book className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-gray-400 mb-1">No active borrows</p>
                <p className="text-xs text-gray-500">Click "New Borrow" to get started</p>
              </Card>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Borrow History
            </h2>
            <span className="text-xs text-gray-500 bg-gray-500/10 px-3 py-1 rounded-full border border-gray-500/30">
              {returnedBorrows?.length || 0} returned
            </span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
            {returnedBorrows && returnedBorrows.length > 0 ? (
              returnedBorrows.map((borrow, index) => (
                <Card
                  key={borrow.id}
                  className="group hover:bg-white/5 transition-all duration-300"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                          {borrow.book?.title || 'Unknown Book'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {borrow.book?.author || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{borrow.member?.name || 'Unknown Member'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(borrow.borrowed_at)}
                        </span>
                        {borrow.returned_at && (
                          <>
                            <ArrowRight className="w-3 h-3 text-gray-600" />
                            <span className="text-green-500/70">
                              {formatDateTime(borrow.returned_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-400">No borrow history yet</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Create New Borrow"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Book
            </label>
            <select
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
              required
            >
              <option value={0}>Choose a book...</option>
              {availableBooks?.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.author}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Member
            </label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: parseInt(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-lg glass text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
              required
            >
              <option value={0}>Choose a member...</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Borrow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
