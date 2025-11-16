import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Search, Book as BookIcon } from 'lucide-react'
import { booksAPI } from '../services/api'
import type { Book, BookCreate } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

export default function Books() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState<BookCreate>({
    title: '',
    author: '',
    isbn: ''
  })

  const queryClient = useQueryClient()
  const { data: books, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => booksAPI.getAll()
  })

  const createMutation = useMutation({
    mutationFn: booksAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => booksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: booksAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    }
  })

  const openCreateModal = () => {
    setEditingBook(null)
    setFormData({ title: '', author: '', isbn: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBook(null)
    setFormData({ title: '', author: '', isbn: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const filteredBooks = books?.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="animate-slide-in">
          <h1 className="text-2xl font-bold text-white relative inline-block">
            Books
            <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
          </h1>
          <p className="text-xs text-white/60 mt-2">Manage your library collection</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </button>
      </div>

      <div className="relative animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 input-field"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in-up">
            <div className="w-12 h-12 mx-auto mb-4 border border-white/10 bg-black flex items-center justify-center relative">
              <BookIcon className="w-6 h-6 text-white animate-glitch" />
              <div className="absolute inset-0 border border-white/20 animate-ping"></div>
            </div>
            <p className="text-sm text-white/60 hologram">Loading books...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks?.map((book, index) => (
            <div
              key={book.id}
              className="card card-hover group stagger-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-white/80 transition-colors">
                      {book.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 border flex-shrink-0 ${
                      book.available
                        ? 'border-white/20 text-white/80'
                        : 'border-white/10 text-white/40'
                    }`}>
                      {book.available ? 'AVAIL' : 'OUT'}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">{book.author}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-white/10">
                  <p className="text-xs text-white/40">
                    <span className="text-white/20">ISBN</span> {book.isbn}
                  </p>
                  <p className="text-xs text-white/20">
                    Added {formatDate(book.created_at)}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openEditModal(book)}
                    className="flex-1 text-xs px-3 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 transition-colors"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this book?')) {
                        deleteMutation.mutate(book.id)
                      }
                    }}
                    className="flex-1 text-xs px-3 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredBooks?.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border border-white/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm text-white/60">No books found</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
          />
          <Input
            label="ISBN"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            required
          />
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingBook ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
