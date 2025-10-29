import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-30"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Books</span>
            </h1>
            <p className="text-gray-400">Manage your library collection</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="shadow-lg shadow-purple-500/20">
          <Plus className="w-5 h-5 mr-2" />
          Add Book
        </Button>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
            <p className="text-gray-400">Loading books...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks?.map((book, index) => (
            <Card
              key={book.id}
              className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-purple-400 transition-colors">{book.title}</h3>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                      book.available
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {book.available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-2">{book.author}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      <span className="text-gray-600">ISBN:</span> {book.isbn}
                    </p>
                    <p className="text-xs text-gray-600">Added {formatDate(book.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(book)}
                    className="flex-1 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this book?')) {
                        deleteMutation.mutate(book.id)
                      }
                    }}
                    className="flex-1 hover:shadow-lg hover:shadow-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredBooks?.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-400">No books found matching your search</p>
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
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingBook ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
