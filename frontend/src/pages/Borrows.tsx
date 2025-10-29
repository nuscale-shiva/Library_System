import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, CheckCircle, Book, User } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Borrows</h1>
          <p className="text-gray-400">Track book borrowing activities</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-5 h-5 mr-2" />
          New Borrow
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Borrows</h2>
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <p className="text-gray-400 text-center">Loading...</p>
              </Card>
            ) : activeBorrows && activeBorrows.length > 0 ? (
              activeBorrows.map((borrow) => (
                <Card key={borrow.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Book className="w-4 h-4 text-primary-500" />
                        <h3 className="font-semibold">{borrow.book?.title || 'Unknown Book'}</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">
                        by {borrow.book?.author || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{borrow.member?.name || 'Unknown Member'}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Borrowed: {formatDateTime(borrow.borrowed_at)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        if (confirm('Mark this book as returned?')) {
                          returnMutation.mutate(borrow.id)
                        }
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Return
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-gray-400 text-center">No active borrows</p>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Borrow History</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
            {returnedBorrows && returnedBorrows.length > 0 ? (
              returnedBorrows.map((borrow) => (
                <Card key={borrow.id} className="opacity-60">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{borrow.book?.title || 'Unknown Book'}</h3>
                      <p className="text-sm text-gray-400 mb-1">
                        by {borrow.book?.author || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <User className="w-3 h-3" />
                        <span>{borrow.member?.name || 'Unknown Member'}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Borrowed: {formatDateTime(borrow.borrowed_at)}
                      </p>
                      {borrow.returned_at && (
                        <p className="text-xs text-gray-600">
                          Returned: {formatDateTime(borrow.returned_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-gray-400 text-center">No borrow history</p>
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
              className="w-full px-4 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-4 py-2.5 rounded-lg bg-dark-bg border border-dark-border text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
