import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { lightTheme, darkTheme, type ThemeMode, type Theme } from '../design/colors'

interface ThemeState {
  mode: ThemeMode
  theme: Theme
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      theme: lightTheme,
      toggleTheme: () =>
        set((state) => {
          const newMode = state.mode === 'light' ? 'dark' : 'light'
          const newTheme = newMode === 'light' ? lightTheme : darkTheme

          // Update document class for Tailwind dark mode
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newMode === 'dark')
          }

          return { mode: newMode, theme: newTheme }
        }),
      setTheme: (mode: ThemeMode) =>
        set(() => {
          const newTheme = mode === 'light' ? lightTheme : darkTheme

          // Update document class for Tailwind dark mode
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', mode === 'dark')
          }

          return { mode, theme: newTheme }
        })
    }),
    {
      name: 'beautycita-theme'
    }
  )
)
