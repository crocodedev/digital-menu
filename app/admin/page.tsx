// app/admin/page.tsx

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import {
  createSection,
  updateSection,
  deleteSection,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateRestaurantLogo,
  updateRestaurantTheme,
} from '../../lib/adminApi'
import { supabase } from '../../lib/supabaseClient'
import SectionModal from '../../components/SectionModal'
import MenuItemModal from '../../components/MenuItemModal'

export type ThemeMode = 'light' | 'dark' | 'brand'

export default function AdminPage() {
  const router = useRouter()
  const { menu, setMenu, loading, error, fetchMenu } = useAdminMenu()
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [themeInput, setThemeInput] = useState<{
    mode: ThemeMode
    brandBackground: string
    brandText: string
  }>({
    mode: 'light',
    brandBackground: '#ffffff',
    brandText: '#000000',
  })
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [iframeKey, setIframeKey] = useState(0) // для перерисовки iframe
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // -------- Модальные окна --------
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [menuItemModalOpen, setMenuItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  // ------------------ Check auth ------------------
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
      } else {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [router])

  // ------------------ Load menu ------------------
  useEffect(() => {
    if (!authChecked || !menu) return
    setThemeInput({
      mode: (menu.mode as ThemeMode) || 'light',
      brandBackground: menu.brand_background || '#ffffff',
      brandText: menu.brand_text || '#000000',
    })
    if (menu.logo_path) setPreviewLogo(menu.logo_path)
  }, [menu, authChecked])

  // ------------------ Apply theme ------------------
  useEffect(() => {
    if (!authChecked) return
    if (themeInput.mode === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = ''
      document.documentElement.style.color = ''
    } else if (themeInput.mode === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = ''
      document.documentElement.style.color = ''
    } else if (themeInput.mode === 'brand') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = themeInput.brandBackground
      document.documentElement.style.color = themeInput.brandText
    }
  }, [themeInput, authChecked])

  if (!authChecked) return <p>Checking authorization...</p>
  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{String(error)}</p>
  if (!menu) return <p>No menu found</p>

  // ----------------- Sections -----------------
  async function handleSaveSection(data: { title: string; visible: boolean }) {
    if (editingSection) {
      // update
      const { data: updated } = await updateSection(editingSection.id, data)
      if (updated && updated.length > 0) {
        fetchMenu()
        setIframeKey((k) => k + 1)
      }
    } else {
      // create
      const { data: created } = await createSection(
        menu.id,
        data.title,
        menu.menu_sections.length + 1
      )
      if (created && created.length > 0) {
        setMenu({
          ...menu,
          menu_sections: [
            ...menu.menu_sections,
            { ...created[0], menu_items: [] }, // берем именно объект, не массив
          ],
        })
        setIframeKey((k) => k + 1)
      }
    }
  }

  async function handleDeleteSection(sectionId: string) {
    const { error } = await deleteSection(sectionId)
    if (!error) {
      fetchMenu()
      setIframeKey((k) => k + 1)
    }
  }

  // ----------------- Menu Items -----------------
  async function handleSaveMenuItem(data: {
    name: string
    price: number
    description: string
    tags: string[]
    is_featured: boolean
    is_trending: boolean
    visible: boolean
  }) {
    if (editingItem) {
      const { data: updated } = await updateMenuItem(editingItem.id, data)
      if (updated && updated.length > 0) {
        fetchMenu()
        setIframeKey((k) => k + 1)
      }
    } else if (currentSectionId) {
      const { data: created } = await createMenuItem(currentSectionId, data)
      if (created && created.length > 0) {
        fetchMenu()
        setIframeKey((k) => k + 1)
      }
    }
  }


  async function handleDeleteMenuItem(itemId: string) {
    const { error } = await deleteMenuItem(itemId)
    if (!error) {
      fetchMenu()
      setIframeKey((k) => k + 1)
    }
  }

  // ----------------- Logo Upload -----------------
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]

    const reader = new FileReader()
    reader.onload = () => setPreviewLogo(reader.result as string)
    reader.readAsDataURL(file)

    const fileExt = file.name.split('.').pop()
    const filePath = `${menu.id}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const publicUrl = supabase.storage.from('logos').getPublicUrl(filePath).data.publicUrl
      await updateRestaurantLogo(menu.id, publicUrl)

      setMenu((prev) => (prev ? { ...prev, logo_path: publicUrl } : prev))
      setIframeKey((k) => k + 1)
    } catch (err) {
      console.error('Logo upload error:', err)
    }
  }

  // ----------------- Theme Update -----------------
  async function handleThemeUpdate() {
    try {
      const updatedTheme = {
        mode: themeInput.mode,
        brandBackground: themeInput.brandBackground,
        brandText: themeInput.brandText,
      }

      const data = await updateRestaurantTheme(menu.id, updatedTheme)
      if (data && data[0]) {
        const updated = data[0]
        setMenu((prev) =>
          prev
            ? {
                ...prev,
                mode: updated.mode,
                brand_background: updated.brand_background,
                brand_text: updated.brand_text,
              }
            : prev
        )
        setIframeKey((k) => k + 1)
      }
    } catch (err) {
      console.error('Theme update error:', err)
    }
  }

  // ----------------- Fullscreen trigger -----------------
  function triggerFullscreen() {
    iframeRef.current?.contentWindow?.postMessage({ action: 'fullscreen' }, '*')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300"
      style={{
        backgroundColor: themeInput.mode === 'brand' ? themeInput.brandBackground : undefined,
        color: themeInput.mode === 'brand' ? themeInput.brandText : undefined,
      }}
    >
      <h1 className="text-3xl font-bold mb-6">{menu.name} Admin Dashboard</h1>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Logo:</label>
        <div className="flex items-center gap-4">

            <img src={previewLogo} alt="logo" className="h-16 w-16 object-cover rounded-full border" />

          <input type="file" onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Theme:</label>
          <select
            value={themeInput.mode}
            onChange={(e) => setThemeInput({ ...themeInput, mode: e.target.value as ThemeMode })}
            className="border rounded px-2 py-1 bg-white text-black dark:bg-gray-800 dark:text-white"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="brand">Brand</option>
          </select>
        </div>

        {themeInput.mode === 'brand' && (
          <>
            <div className="flex items-center gap-2">
              <label className="font-semibold">Brand Background:</label>
              <input
                type="color"
                value={themeInput.brandBackground}
                onChange={(e) => setThemeInput({ ...themeInput, brandBackground: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold">Brand Text:</label>
              <input
                type="color"
                value={themeInput.brandText}
                onChange={(e) => setThemeInput({ ...themeInput, brandText: e.target.value })}
              />
            </div>
          </>
        )}

        <button onClick={handleThemeUpdate} className="bg-blue-500 text-white px-3 py-1 rounded">
          Update Theme
        </button>
      </div>

      {/* New Section */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingSection(null)
            setSectionModalOpen(true)
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add Section
        </button>
      </div>

      {/* Sections */}
      {menu.menu_sections.map((section) => (
        <div key={section.id} className="mb-4 border p-4 rounded space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setEditingSection(section)
                  setSectionModalOpen(true)
                }}
                className="bg-yellow-400 px-2 py-1 rounded"
              >
                Edit
              </button>
              <button onClick={() => handleDeleteSection(section.id)} className="bg-red-500 px-2 py-1 rounded">
                Delete
              </button>
            </div>
          </div>

          <ul className="space-y-2">
          {section.menu_items?.map((item) => (
            <li
              key={item.id}
              className="flex flex-col border-b border-gray-300 py-2"
            >
              {/* Верхняя строка: название и цена */}
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {item.name}{' '}{item.is_featured && <span className="ml-2 text-yellow-400">★</span>}{item.is_trending && <span className="ml-2 text-pink-400">🔥</span>} - ${item.price.toFixed(2)}
                </span>
                <div className="space-x-1">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setMenuItemModalOpen(true)
                    }}
                    className="bg-yellow-300 px-2 py-0.5 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="bg-red-400 px-2 py-0.5 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Описание, если есть */}
              {item.description && (
                <p className="text-sm mt-1">{item.description}</p>
              )}

              {/* Теги, если есть */}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-200 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>


          <button
            onClick={() => {
              setEditingItem(null)
              setCurrentSectionId(section.id)
              setMenuItemModalOpen(true)
            }}
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
          >
            Add Item
          </button>
        </div>
      ))}

      {/* Open Fullscreen Display */}
      <div className="mt-4 space-x-2">
        <button
          onClick={() => window.open(`/display/${menu.slug}`, '_blank')}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          Open Display
        </button>
        <button onClick={triggerFullscreen} className="bg-pink-600 text-white px-3 py-1 rounded">
          Trigger Fullscreen on Preview
        </button>
      </div>

      {/* -------- Live Preview -------- */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Live Preview for TV</h2>
        <div className="border rounded-lg overflow-hidden shadow-lg">
          <iframe key={iframeKey} ref={iframeRef} src={`/display/${menu.slug}`} className="w-full h-[100vh] bg-white" />
        </div>
      </div>

      {/* -------- QR Code --------  */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Mobile Access QR Code</h2>
        <div className="flex flex-col items-center gap-4">
          <QRCodeCanvas
            value={`${siteUrl}/display/${menu.slug}`}
            size={200}
            bgColor={'#ffffff'}
            fgColor={'#000000'}
            level={'H'}
            includeMargin={true}
          />
          <p className="text-sm text-gray-500">Scan to open menu on your phone</p>
        </div>
      </div>

      {/* -------- Модальные окна -------- */}
      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        initialData={editingSection ? { title: editingSection.title, visible: editingSection.visible } : undefined}
        onSave={handleSaveSection}
      />

      <MenuItemModal
        isOpen={menuItemModalOpen}
        onClose={() => setMenuItemModalOpen(false)}
        initialData={editingItem || undefined}
        onSave={handleSaveMenuItem}
      />
    </div>
  )
}
