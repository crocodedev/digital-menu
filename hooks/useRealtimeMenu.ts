'use client'

import { useEffect, useState, useRef } from 'react'
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

export type ThemeMode = 'light' | 'dark' | 'brand'

export interface RestaurantMenu {
  id: string
  name: string
  slug: string
  logo_path: string | null
  theme: any
  menu_sections: MenuSection[]
  mode: ThemeMode
  brand_background: string
  brand_text: string
}

export function useRealtimeMenu(slug: string) {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<any>(null)
  const channelRef = useRef<any | null>(null)

  // Fetch menu once (and return raw data to allow setting up listeners)
  async function fetchMenuOnce() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(
          `
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
        `
        )
        .eq('slug', slug)
        .single()

      if (error) throw error

      // normalize types
      const safeData: RestaurantMenu = {
        ...data,
        menu_sections: (data.menu_sections || []).map((section: any) => ({
          ...section,
          menu_items: (section.menu_items || []).map((item: any) => ({
            ...item,
            price: Number(item.price),
            description: item.description ?? null,
          })),
        })),
      }

      setMenu(safeData)
      setError(null)
      return data
    } catch (err) {
      setError(err)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!slug) return
    let mounted = true

    async function initRealtime() {
      setLoading(true)
      // initial fetch
      const initial = await fetchMenuOnce()
      if (!initial) return

      // Clean previous channel if exists
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current)
        } catch (e) {
          // ignore
        }
        channelRef.current = null
      }

      const restaurantId = initial.id as string
      const sectionIds = (initial.menu_sections || []).map((s: any) => s.id)

      // create a new channel for this slug
      const channel = supabase.channel(`realtime-${slug}`)

      // listen to restaurant changes for this slug
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants', filter: `slug=eq.${slug}` },
        (payload) => {
          // On any change re-fetch the menu
          fetchMenuOnce()
        }
      )

      // listen to menu_sections changes for this restaurant
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_sections', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          // re-fetch to pick up sections or nested items changes
          fetchMenuOnce()
        }
      )

      // listen to menu_items for existing section ids (set up one listener per section)
      sectionIds.forEach((sectionId: string) => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menu_items', filter: `section_id=eq.${sectionId}` },
          (payload) => {
            fetchMenuOnce()
          }
        )
      })

      // subscribe
      await channel.subscribe()
      channelRef.current = channel

      // Also: whenever menu updates in future (sections added/removed), reconfigure subscriptions.
      // We'll rely on menu_sections listener to call fetchMenuOnce(), and this effect will not auto-reconfigure
      // subscriptions for new section ids — so we add a small watcher below.
    }

    initRealtime()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {})
        channelRef.current = null
      }
    }
    // We intentionally don't include fetchMenuOnce in deps to avoid re-creating channel repeatedly.
    // Recreate only when slug changes.
  }, [slug])

  return { menu, loading, error }
}
