import { motion } from 'framer-motion'
import { SparklesIcon, TrophyIcon, MapIcon } from '@heroicons/react/24/solid'

export default function OverscrollEasterEgg() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-0" style={{ transform: 'translateY(100%)' }}>
      {/* Background gradient that shows on overscroll */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-purple-900/40 h-[200px]" />

      {/* Easter Egg: Treasure Map Corner */}
      <div className="absolute bottom-0 right-4 w-48 h-48 opacity-90">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          {/* Aged paper texture */}
          <defs>
            <filter id="paper-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise"/>
              <feColorMatrix type="saturate" values="0.3"/>
              <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
            </filter>
            <linearGradient id="paper-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f4e7d7', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#d4b896', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Torn paper corner - triangular shape */}
          <path
            d="M 180 200 L 200 200 L 200 180 Q 195 185 190 190 Q 185 195 180 200 Z"
            fill="url(#paper-gradient)"
            filter="url(#paper-texture)"
            stroke="#8B5640"
            strokeWidth="1"
          />

          {/* Burn marks on edges */}
          <path
            d="M 182 200 Q 186 195 190 192 Q 194 188 198 185"
            fill="none"
            stroke="#5c3a21"
            strokeWidth="0.5"
            opacity="0.6"
          />

          {/* Treasure map markings */}
          <circle cx="190" cy="190" r="3" fill="#c41e3a" opacity="0.8" />
          <text x="187" y="193" fontSize="6" fill="#c41e3a" fontFamily="serif" fontWeight="bold">X</text>

          {/* Dotted path line */}
          <path
            d="M 185 195 Q 188 192 192 188"
            fill="none"
            stroke="#8B5640"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Easter Egg: Secret Message */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-yellow-400/50 shadow-2xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon className="h-6 w-6 text-yellow-300" />
          </motion.div>
          <span className="text-white font-serif text-sm tracking-wide">
            You found a secret! 🎁
          </span>
          <TrophyIcon className="h-6 w-6 text-yellow-400" />
        </motion.div>
      </div>

      {/* Floating beauty icons */}
      <div className="absolute bottom-20 left-8 text-4xl opacity-60 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
        💄
      </div>
      <div className="absolute bottom-32 right-24 text-3xl opacity-60 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}>
        💅
      </div>
      <div className="absolute bottom-24 left-1/3 text-3xl opacity-60 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
        ✨
      </div>
    </div>
  )
}
