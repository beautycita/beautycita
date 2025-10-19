import { motion } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface ScrollIndicatorProps {
  text?: string
  isDarkMode?: boolean
}

export default function ScrollIndicator({ text, isDarkMode = false }: ScrollIndicatorProps) {
  return (
    <motion.div
      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center w-full"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.5 }}
    >
      {text && (
        <p className={`text-sm mb-2 mx-auto ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
          {text}
        </p>
      )}
      <motion.div
        className="flex justify-center items-center"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDownIcon className={`h-8 w-8 mx-auto ${isDarkMode ? 'text-white/60' : 'text-gray-400'}`} />
      </motion.div>
    </motion.div>
  )
}