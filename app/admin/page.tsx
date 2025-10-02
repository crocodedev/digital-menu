// app/admin/page.tsx

'use client'

import { useEffect, useState } from 'react'
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
  const [previewSize, setPreviewSize] = useState<'desktop' | 'mobile' | 'tv'>('desktop')


  // ------------------ Check auth ------------------
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login') // redirect unauthorized users
      } else {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [router])

  // ------------------ Load menu ------------------
  useEffect(() => {
    if (!authChecked || !menu) return

    // Инициализация themeInput из menu
    setThemeInput({
      mode: (menu.mode as ThemeMode) || 'light',
      brandBackground: menu.brand_background || '#ffffff',
      brandText: menu.brand_text || '#000000',
    })

    // Подгрузка логотипа
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
  async function handleAddSection() {
    if (!newSectionTitle) return
    const { data, error } = await createSection(menu.id, newSectionTitle, menu.menu_sections.length + 1)
    if (data && !error) {
      setMenu({ ...menu, menu_sections: [...menu.menu_sections, { ...data[0], menu_items: [] }] })
      setNewSectionTitle('')
    }
  }

  async function handleUpdateSection(sectionId: string, updates: Partial<{ title: string; visible: boolean }>) {
    const { data } = await updateSection(sectionId, updates)
    if (data) fetchMenu()
  }

  async function handleDeleteSection(sectionId: string) {
    const { error } = await deleteSection(sectionId)
    if (!error) fetchMenu()
  }

  // ----------------- Menu Items -----------------
  async function handleAddMenuItem(sectionId: string) {
    const name = prompt('Item name')
    if (!name) return
    const price = parseFloat(prompt('Price') || '0')
    const { data } = await createMenuItem(sectionId, {
      name,
      price,
      visible: true,
      tags: [],
      is_featured: false,
      is_trending: false,
    })
    if (data) fetchMenu()
  }

  async function handleUpdateMenuItem(itemId: string) {
    const name = prompt('New item name')
    if (!name) return
    const price = parseFloat(prompt('New price') || '0')
    const { data } = await updateMenuItem(itemId, { name, price })
    if (data) fetchMenu()
  }

  async function handleDeleteMenuItem(itemId: string) {
    const { error } = await deleteMenuItem(itemId)
    if (!error) fetchMenu()
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
      const { error: uploadError } = await supabase
        .storage
        .from('logos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const publicUrl = supabase.storage.from('logos').getPublicUrl(filePath).data.publicUrl
      await updateRestaurantLogo(menu.id, publicUrl)

      setMenu((prev) => (prev ? { ...prev, logo_path: publicUrl } : prev))
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

      // Обновляем локально menu с точными именами полей из БД
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
      }
    } catch (err) {
      console.error('Theme update error:', err)
    }
  }

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
          {previewLogo ? (
            <img src={previewLogo} alt="logo" className="h-16 w-16 object-cover rounded-full border" />
          ) : (
            <span className="text-gray-500">Файл не выбран</span>
          )}
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

        <button
          onClick={handleThemeUpdate}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Update Theme
        </button>
      </div>

      {/* New Section */}
      <div className="mb-6 flex items-center gap-2">
        <input
          placeholder="New Section Title"
          className="border p-2 rounded flex-1"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
        />
        <button
          onClick={handleAddSection}
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
                onClick={() =>
                  handleUpdateSection(section.id, { title: prompt('New title', section.title) || section.title })
                }
                className="bg-yellow-400 px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteSection(section.id)}
                className="bg-red-500 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {section.menu_items?.map((item) => (
              <li key={item.id} className="flex justify-between border-b border-gray-300 py-1">
                <span>
                  {item.name} - ${item.price.toFixed(2)}
                </span>
                <div className="space-x-1">
                  <button
                    onClick={() => handleUpdateMenuItem(item.id)}
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
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleAddMenuItem(section.id)}
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
          >
            Add Item
          </button>
        </div>
      ))}

      {/* Open Fullscreen Display */}
      <div className="mt-4">
        <button
          onClick={() => window.open(`/display/${menu.slug}`, '_blank')}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          Open Fullscreen Display
        </button>
      </div>

      {/* -------- Live Preview -------- */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setPreviewSize('desktop')}
            className={`px-3 py-1 rounded ${
              previewSize === 'desktop' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Desktop
          </button>
          <button
            onClick={() => setPreviewSize('mobile')}
            className={`px-3 py-1 rounded ${
              previewSize === 'mobile' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Mobile
          </button>
          <button
            onClick={() => setPreviewSize('tv')}
            className={`px-3 py-1 rounded ${
              previewSize === 'tv' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            TV
          </button>
        </div>

        {/* Preview Frame */}
        <div className="border rounded-lg overflow-hidden shadow-lg flex justify-center">
          <iframe
            src={`/display/${menu.slug}`}
            className={
              previewSize === 'mobile'
                ? 'w-[375px] h-[700px] bg-white'
                : previewSize === 'tv'
                ? 'w-[1280px] h-[720px] bg-white'
                : 'w-full h-[600px] bg-white'
            }
          />
        </div>
      </div>

      {/* -------- QR Code --------  */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Mobile Access QR Code</h2>
        <div className="flex flex-col items-center gap-4">
          <QRCodeCanvas
            value={`${window.location.origin}/display/${menu.slug}`}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"H"}
            includeMargin={true}
          />
          <p className="text-sm text-gray-500">
            Scan to open menu on your phone
          </p>
        </div>
      </div>

    </div>
  )
}
