'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface SectionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: { title: string; visible: boolean }
  onSave: (data: { title: string; visible: boolean }) => void
}

export default function SectionModal({ isOpen, onClose, initialData, onSave }: SectionModalProps) {
  const [title, setTitle] = useState('')
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setVisible(initialData.visible)
    } else {
      setTitle('')
      setVisible(true)
    }
  }, [initialData, isOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ title, visible })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Section' : 'New Section'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-1 w-full"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          <label>Visible</label>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
          Save
        </button>
      </form>
    </Modal>
  )
}
