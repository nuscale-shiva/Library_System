import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Mail, Phone, Users as UsersIcon } from 'lucide-react'
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="animate-slide-in">
          <h1 className="text-2xl font-bold text-white relative inline-block">
            Members
            <span className="absolute -bottom-1 left-0 w-full h-px bg-white/20"></span>
          </h1>
          <p className="text-xs text-white/60 mt-2">Manage library members</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center animate-fade-in-up">
            <div className="w-12 h-12 mx-auto mb-4 border border-white/10 bg-black flex items-center justify-center relative">
              <UsersIcon className="w-6 h-6 text-white animate-glitch" />
              <div className="absolute inset-0 border border-white/20 animate-ping"></div>
            </div>
            <p className="text-sm text-white/60 hologram">Loading members...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members?.map((member, index) => (
            <div
              key={member.id}
              className="card card-hover group stagger-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-white/10 bg-black flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-white/80 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-xs text-white/40">
                      ID #{member.id.toString().padStart(4, '0')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-white/40 flex-shrink-0" />
                    <span className="text-xs text-white/60 truncate">{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-white/40 flex-shrink-0" />
                      <span className="text-xs text-white/60">{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-white/20">
                    Joined {formatDate(member.created_at)}
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => openEditModal(member)}
                    className="flex-1 text-xs px-3 py-1.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80 transition-colors"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this member?')) {
                        deleteMutation.mutate(member.id)
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
          {members?.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 border border-white/10 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white/40" />
              </div>
              <p className="text-sm text-white/60 mb-4">No members registered yet</p>
              <button onClick={openCreateModal} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add First Member
              </button>
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
            <button type="button" onClick={closeModal} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingMember ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
