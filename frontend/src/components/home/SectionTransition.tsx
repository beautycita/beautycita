interface SectionTransitionProps {
  from?: string
  to?: string
  height?: string
  isDarkMode?: boolean
}

export default function SectionTransition({
  from,
  to,
  height = 'h-32',
  isDarkMode = false
}: SectionTransitionProps) {
  const defaultFrom = isDarkMode ? 'from-gray-900' : 'from-white'
  const defaultTo = isDarkMode ? 'to-black' : 'to-gray-50'

  return (
    <div
      className={`${height} bg-gradient-to-b ${from || defaultFrom} ${to || defaultTo} pointer-events-none`}
      style={{ marginTop: '-1px', marginBottom: '-1px' }} // Prevents harsh lines
    />
  )
}