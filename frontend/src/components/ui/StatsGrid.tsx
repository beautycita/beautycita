import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Stat {
  icon?: ReactNode
  number: string
  label: string
  gradient?: string
}

interface StatsGridProps {
  stats: Stat[]
  columns?: 2 | 3 | 4
  isDarkMode?: boolean
}

export default function StatsGrid({ stats, columns = 4, isDarkMode = false }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-8`}>
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center group cursor-pointer"
        >
          {stat.icon && (
            <motion.div
              whileHover={{ scale: 1.2, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`inline-flex items-center justify-center mb-3 ${
                stat.gradient
                  ? `bg-gradient-to-br ${stat.gradient} p-3 rounded-3xl text-white`
                  : ''
              }`}
            >
              {stat.icon}
            </motion.div>
          )}

          <div className={`text-4xl font-bold mb-1 bg-gradient-to-r ${
            stat.gradient || 'from-pink-500 to-purple-600'
          } bg-clip-text text-transparent`}>
            {stat.number}
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
