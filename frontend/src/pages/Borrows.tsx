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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="animate-slide-in">
          <h1 className="text-2xl font-bold text-white relative inline-block">
            Borrows
            <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
          </h1>
          <p className="text-xs text-white/60 mt-2">Track book borrowing activities</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <Plus className="w-4 h-4 mr-2" />
          New Borrow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Borrows */}
        <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white animate-pulse"></div>
              ACTIVE BORROWS
            </h2>
            <span className="text-xs text-white/40 px-2 py-0.5 border border-white/10 hologram">
              {activeBorrows?.length || 0}
            </span>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <div className="card text-center py-12">
                <div className="w-10 h-10 mx-auto mb-3 border border-white/10 flex items-center justify-center relative">
                  <Book className="w-5 h-5 text-white animate-glitch" />
                  <div className="absolute inset-0 border border-white/20 animate-ping"></div>
                </div>
                <p className="text-xs text-white/60 hologram">Loading borrows...</p>
              </div>
            ) : activeBorrows && activeBorrows.length > 0 ? (
              activeBorrows.map((borrow, index) => (
                <div
                  key={borrow.id}
                  className="card card-hover group stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <Book className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-white group-hover:text-white/80 transition-colors line-clamp-1">
                              {borrow.book?.title || 'Unknown'}
                            </h3>
                            <p className="text-xs text-white/60">
                              by {borrow.book?.author || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <User className="w-3 h-3" />
                          <span>{borrow.member?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/20">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(borrow.borrowed_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Mark as returned?')) {
                            returnMutation.mutate(borrow.id)
                          }
                        }}
                        className="text-xs px-3 py-1.5 bg-white text-black hover:bg-white/90 transition-colors flex-shrink-0"
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 border border-white/10 flex items-center justify-center">
                  <Book className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-sm text-white/60 mb-1">No active borrows</p>
                <p className="text-xs text-white/40">Click "New Borrow" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Borrow History */}
        <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              HISTORY
            </h2>
            <span className="text-xs text-white/40 px-2 py-0.5 border border-white/10 hologram">
              {returnedBorrows?.length || 0}
            </span>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
            {returnedBorrows && returnedBorrows.length > 0 ? (
              returnedBorrows.map((borrow, index) => (
                <div
                  key={borrow.id}
                  className="card card-hover group stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-white/40 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <h3 className="text-xs font-bold text-white group-hover:text-white/80 transition-colors line-clamp-1">
                          {borrow.book?.title || 'Unknown'}
                        </h3>
                        <p className="text-xs text-white/40">
                          {borrow.book?.author || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30 pl-5">
                      <User className="w-3 h-3" />
                      <span>{borrow.member?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/20 pl-5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(borrow.borrowed_at)}
                      </span>
                      {borrow.returned_at && (
                        <>
                          <ArrowRight className="w-3 h-3" />
                          <span>
                            {formatDateTime(borrow.returned_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 border border-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-sm text-white/60">No history yet</p>
              </div>
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
            <label className="block text-xs font-bold text-white mb-2">
              SELECT BOOK
            </label>
            <select
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: parseInt(e.target.value) })}
              className="w-full input-field"
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
            <label className="block text-xs font-bold text-white mb-2">
              SELECT MEMBER
            </label>
            <select
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: parseInt(e.target.value) })}
              className="w-full input-field"
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
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Create Borrow
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
