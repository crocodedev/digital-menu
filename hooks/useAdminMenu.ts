// hook/useAdminMenu.ts
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface MenuItem {
  id: string
  name: string
  price: number
  description: string | null
  tags: string[]
  is_featured: boolean
  is_trending: boolean
  visible: boolean
}

export interface MenuSection {
  id: string
  title: string
  position: number
  visible: boolean
  menu_items: MenuItem[]
}

// Добавляем поля для бренда и режима
export type ThemeMode = 'light' | 'dark' | 'brand'

export interface RestaurantMenu {
  id: string
  name: string
  slug: string
  logo_path: string | null
  theme: any
  menu_sections: MenuSection[]
  mode: ThemeMode        // <-- добавили
  brand_background: string // <-- добавили
  brand_text: string       // <-- добавили
}

export function useAdminMenu() {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  async function fetchMenu() {
    setLoading(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('User not found')

      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, name, slug, logo_path, theme,
          mode,
          brand_background,
          brand_text,
          menu_sections (
            id, title, position, visible,
            menu_items (
              id, name, price, description, tags, is_featured, is_trending, visible
            )
          )
        `)
        .eq('owner_id', user.id)
        .single()

      if (error) throw error

      // Приводим данные к сериализуемому виду
      const safeData: RestaurantMenu = {
        ...data,
        menu_sections: data.menu_sections.map((section: any) => ({
          ...section,
          menu_items: section.menu_items.map((item: any) => ({
            ...item,
            price: Number(item.price),
            description: item.description ?? null,
          })),
        })),
      }

      setMenu(safeData)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  return { menu, setMenu, loading, error, fetchMenu }
}
