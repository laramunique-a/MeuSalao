import { useThemeStore } from '@/store/themeStore'
import { useEffect } from 'react'

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}
