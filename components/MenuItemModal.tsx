'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'

interface MenuItemModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    name: string
    price: number
    description: string
    tags: string[]
    is_featured: boolean
    is_trending: boolean
    visible: boolean
  }
  onSave: (data: {
    name: string
    price: number
    description: string
    tags: string[]
    is_featured: boolean
    is_trending: boolean
    visible: boolean
  }) => void
}

export default function MenuItemModal({ isOpen, onClose, initialData, onSave }: MenuItemModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  const [isTrending, setIsTrending] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setPrice(initialData.price)
      setDescription(initialData.description || '')
      setTags(initialData.tags || [])
      setIsFeatured(initialData.is_featured)
      setIsTrending(initialData.is_trending)
      setVisible(initialData.visible)
    } else {
      setName('')
      setPrice(0)
      setDescription('')
      setTags([])
      setIsFeatured(false)
      setIsTrending(false)
      setVisible(true)
    }
  }, [initialData, isOpen])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      name,
      price,
      description,
      tags,
      is_featured: isFeatured,
      is_trending: isTrending,
      visible,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Item' : 'New Item'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            className="border rounded px-3 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded px-3 py-1 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Tags (comma separated)</label>
          <input
            value={tags.join(',')}
            onChange={(e) => setTags(e.target.value.split(',').map((t) => t.trim()))}
            className="border rounded px-3 py-1 w-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isTrending} onChange={(e) => setIsTrending(e.target.checked)} />
            Trending
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Visible
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
          Save
        </button>
      </form>
    </Modal>
  )
}
