// lib/adminApi.ts
import { supabase } from './supabaseClient'

// ------------------- Sections -------------------
export async function createSection(restaurantId: string, title: string, position: number) {
  const { data, error } = await supabase
    .from('menu_sections')
    .insert([{ title, position, visible: true, restaurant_id: restaurantId }])
    .select()
  return { data, error }
}

export async function updateSection(sectionId: string, updates: Partial<{ title: string; position: number; visible: boolean }>) {
  const { data, error } = await supabase
    .from('menu_sections')
    .update(updates)
    .eq('id', sectionId)
    .select()
  return { data, error }
}

export async function deleteSection(sectionId: string) {
  const { data, error } = await supabase
    .from('menu_sections')
    .delete()
    .eq('id', sectionId)
  return { data, error }
}

// ------------------- Menu Items -------------------
export async function createMenuItem(sectionId: string, item: Partial<{ name: string; price: number; description: string; tags: string[]; is_featured: boolean; is_trending: boolean; visible: boolean; position: number }>) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([{ section_id: sectionId, ...item }])
    .select()
  return { data, error }
}

export async function updateMenuItem(itemId: string, updates: Partial<{ name: string; price: number; description: string; tags: string[]; is_featured: boolean; is_trending: boolean; visible: boolean; position: number }>) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', itemId)
    .select()
  return { data, error }
}

export async function deleteMenuItem(itemId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId)
  return { data, error }
}

// ------------------- Restaurant Settings -------------------
export async function updateRestaurantLogo(restaurantId: string, logoUrl: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ logo_path: logoUrl })
    .eq('id', restaurantId)
    .select()
  return { data, error }
}

export async function updateRestaurantTheme(
  restaurantId: string,
  theme: {
    mode: 'light' | 'dark' | 'brand';
    brandBackground?: string;
    brandText?: string;
    brandColor?: string; // на случай простого варианта
  }
) {
  const updates: any = {
    mode: theme.mode,
  }

  if (theme.brandBackground !== undefined) updates.brand_background = theme.brandBackground
  if (theme.brandText !== undefined) updates.brand_text = theme.brandText
  if (theme.brandColor !== undefined) updates.brand_color = theme.brandColor

  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId)
    .select('*')

  if (error) throw error
  return data
}

