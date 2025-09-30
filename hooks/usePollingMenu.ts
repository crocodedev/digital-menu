'use client'

import {useEffect, useState} from 'react'
import {supabase} from '../lib/supabaseClient'

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

export interface RestaurantMenu {
	id: string
	name: string
	slug: string
	logo_path: string | null
	theme: any
	menu_sections: MenuSection[]
}

export function usePollingMenu(slug: string, intervalMs: number = 5000) {
	const [menu, setMenu] = useState<RestaurantMenu | null>(null)
	const [loading, setLoading] = useState<boolean>(true)
	const [error, setError] = useState<any>(null)

	async function fetchMenu() {
		try {
			const {data, error} = await supabase
				.from('restaurants')
				.select(
					`
          id, name, slug, logo_path, theme,
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
			setMenu(data)
			setError(null)
			console.log({data})
		} catch (err) {
			setError(err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!slug) return
		fetchMenu()
		const interval = setInterval(fetchMenu, intervalMs)
		return () => clearInterval(interval)
	}, [slug])

	return {menu, loading, error}
}
