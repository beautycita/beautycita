import { ReactNode } from 'react'

interface PageSectionProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'gradient' | 'dark'
  isDarkMode?: boolean
  id?: string
}

export default function PageSection({
  children,
  className = '',
  background = 'white',
  isDarkMode = false,
  id
}: PageSectionProps) {
  const backgrounds = {
    white: isDarkMode ? 'bg-gray-900' : 'bg-white',
    gray: isDarkMode ? 'bg-black' : 'bg-gray-50',
    gradient: isDarkMode
      ? 'bg-gradient-to-br from-gray-900 to-black'
      : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50',
    dark: 'bg-gradient-to-br from-gray-900 to-black'
  }

  return (
    <section id={id} className={`py-16 md:py-24 ${backgrounds[background]} ${className}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {children}
      </div>
    </section>
  )
}
