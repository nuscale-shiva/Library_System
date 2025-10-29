import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Mail, Phone, User, Users } from 'lucide-react'
import { membersAPI } from '../services/api'
import type { Member, MemberCreate } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

export default function Members() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState<MemberCreate>({
    name: '',
    email: '',
    phone: ''
  })

  const queryClient = useQueryClient()
  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersAPI.getAll()
  })

  const createMutation = useMutation({
    mutationFn: membersAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => membersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: membersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    }
  })

  const openCreateModal = () => {
    setEditingMember(null)
    setFormData({ name: '', email: '', phone: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingMember(null)
    setFormData({ name: '', email: '', phone: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-30"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Members</span>
            </h1>
            <p className="text-gray-400">Manage library members</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="shadow-lg shadow-purple-500/20">
          <Plus className="w-5 h-5 mr-2" />
          Add Member
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
            <p className="text-gray-400">Loading members...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members?.map((member, index) => (
            <Card
              key={member.id}
              className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <span className="text-lg font-bold gradient-text">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-purple-400 transition-colors">{member.name}</h3>
                      <p className="text-xs text-gray-500">ID: #{member.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400 truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-pink-400" />
                        <span className="text-gray-400">{member.phone}</span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-white/5">
                      <p className="text-xs text-gray-600">
                        Joined {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(member)}
                    className="flex-1 hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this member?')) {
                        deleteMutation.mutate(member.id)
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
          {members?.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-gray-400 mb-4">No members registered yet</p>
              <Button onClick={openCreateModal} className="mx-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add First Member
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingMember ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
