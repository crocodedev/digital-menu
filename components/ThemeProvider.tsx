// components/ThemeProvider.tsx
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'brand'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'light', setTheme: () => {} })

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    // сначала убираем оба класса
    document.documentElement.classList.remove('dark')

    if (theme === 'dark') {
      // dark-тема активирует Tailwind
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = ''
      document.documentElement.style.color = ''
    } else if (theme === 'light') {
      // светлая = без классов, дефолт
      document.documentElement.style.backgroundColor = ''
      document.documentElement.style.color = ''
    } else if (theme === 'brand') {
      // брендовая — без dark, но свои цвета
      document.documentElement.style.backgroundColor = 'var(--brand-bg, #ffffff)'
      document.documentElement.style.color = 'var(--brand-text, #000000)'
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
