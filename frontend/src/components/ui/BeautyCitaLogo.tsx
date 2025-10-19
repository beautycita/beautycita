import React from 'react'

interface BeautyCitaLogoProps {
  className?: string
  variant?: 'lotus' | 'infinity' | 'mirror' | 'butterfly' | 'crown'
  showAllVariants?: boolean
}

export default function BeautyCitaLogo({
  className = "h-6 w-6",
  variant = 'lotus',
  showAllVariants = false
}: BeautyCitaLogoProps) {

  // Concept 1: Lotus Flower - Beauty blooming through technology
  // Inspired by: Meta's infinity meets organic beauty
  const LotusLogo = () => (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <path d="M50 20 C35 20, 25 35, 25 50 C25 65, 35 80, 50 80 C65 80, 75 65, 75 50 C75 35, 65 20, 50 20 Z M50 20 C45 10, 35 5, 25 10 C20 15, 20 25, 25 35 M50 20 C55 10, 65 5, 75 10 C80 15, 80 25, 75 35 M50 80 C45 90, 35 95, 25 90 C20 85, 20 75, 25 65 M50 80 C55 90, 65 95, 75 90 C80 85, 80 75, 75 65"
        strokeWidth="0"
        fillRule="evenodd"
        opacity="1"
      />
    </svg>
  )

  // Concept 2: Infinity Beauty - Continuous beauty journey with AI
  // Inspired by: Airbnb's Bélo + Meta's infinity
  const InfinityLogo = () => (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <path d="M25 50 C25 35, 35 25, 45 35 L50 40 L55 35 C65 25, 75 35, 75 50 C75 65, 65 75, 55 65 L50 60 L45 65 C35 75, 25 65, 25 50 Z M35 50 C35 55, 40 60, 45 55 L50 50 L55 55 C60 60, 65 55, 65 50 C65 45, 60 40, 55 45 L50 50 L45 45 C40 40, 35 45, 35 50 Z"
        strokeWidth="0"
        fillRule="evenodd"
      />
    </svg>
  )

  // Concept 3: Smart Mirror - Reflection meets technology (CHOSEN DESIGN)
  // Inspired by: Apple's simplicity + Beauty mirror iconography
  // Refined version with cleaner paths and better scalability
  const MirrorLogo = () => (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <path
        d="M50 10
           C68.225 10 83 24.775 83 43
           L83 65
           C83 78.255 72.255 89 59 89
           L41 89
           C27.745 89 17 78.255 17 65
           L17 43
           C17 24.775 31.775 10 50 10
           Z

           M50 22
           C38.402 22 29 31.402 29 43
           L29 62
           C29 68.627 34.373 74 41 74
           L59 74
           C65.627 74 71 68.627 71 62
           L71 43
           C71 31.402 61.598 22 50 22
           Z

           M44 38
           L56 38
           C58.209 38 60 39.791 60 42
           L60 42
           C60 44.209 58.209 46 56 46
           L44 46
           C41.791 46 40 44.209 40 42
           L40 42
           C40 39.791 41.791 38 44 38
           Z"
        fillRule="evenodd"
      />
    </svg>
  )

  // Concept 4: Abstract Butterfly - Transformation and beauty
  // Inspired by: MSN butterfly meets modern geometry
  const ButterflyLogo = () => (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <path d="M50 30 L50 70 M35 35 C25 25, 15 30, 15 40 C15 50, 25 55, 35 50 L50 40 L65 50 C75 55, 85 50, 85 40 C85 30, 75 25, 65 35 L50 45 L35 35 Z M35 65 C30 70, 25 75, 30 80 C35 85, 40 80, 45 70 L50 60 L55 70 C60 80, 65 85, 70 80 C75 75, 70 70, 65 65 L50 55 L35 65 Z"
        strokeWidth="0"
        fillRule="evenodd"
      />
    </svg>
  )

  // Concept 5: Beauty Crown - Elegance and empowerment
  // Inspired by: Stripe's boldness + crown symbolism
  const CrownLogo = () => (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
      <path d="M20 60 L25 35 L35 50 L50 25 L65 50 L75 35 L80 60 L80 75 C80 80, 75 85, 70 85 L30 85 C25 85, 20 80, 20 75 L20 60 Z M30 65 L30 70 C30 72, 32 75, 35 75 L65 75 C68 75, 70 72, 70 70 L70 65 L65 45 L50 35 L35 45 L30 65 Z"
        strokeWidth="0"
        fillRule="evenodd"
      />
    </svg>
  )

  if (showAllVariants) {
    return (
      <div className="grid grid-cols-3 gap-8 p-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl">
              <LotusLogo />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900">Lotus Bloom</h3>
          <p className="text-sm text-gray-600 mt-1">Beauty flourishing through AI</p>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl">
              <InfinityLogo />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900">Infinity Beauty</h3>
          <p className="text-sm text-gray-600 mt-1">Continuous beauty journey</p>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl">
              <MirrorLogo />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900">Smart Mirror ⭐</h3>
          <p className="text-sm text-gray-600 mt-1">Reflection meets technology</p>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl">
              <ButterflyLogo />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900">Butterfly Transform</h3>
          <p className="text-sm text-gray-600 mt-1">Beauty transformation</p>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl">
              <CrownLogo />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900">Beauty Crown</h3>
          <p className="text-sm text-gray-600 mt-1">Elegance & empowerment</p>
        </div>
      </div>
    )
  }

  // Return selected variant
  switch(variant) {
    case 'lotus':
      return <LotusLogo />
    case 'infinity':
      return <InfinityLogo />
    case 'mirror':
      return <MirrorLogo />
    case 'butterfly':
      return <ButterflyLogo />
    case 'crown':
      return <CrownLogo />
    default:
      return <MirrorLogo /> // Default to mirror design
  }
}

// Export individual components for flexibility
export const BeautyCitaLogoLotus = ({ className = "h-6 w-6" }: { className?: string }) => (
  <BeautyCitaLogo variant="lotus" className={className} />
)

export const BeautyCitaLogoInfinity = ({ className = "h-6 w-6" }: { className?: string }) => (
  <BeautyCitaLogo variant="infinity" className={className} />
)

export const BeautyCitaLogoMirror = ({ className = "h-6 w-6" }: { className?: string }) => (
  <BeautyCitaLogo variant="mirror" className={className} />
)

export const BeautyCitaLogoButterfly = ({ className = "h-6 w-6" }: { className?: string }) => (
  <BeautyCitaLogo variant="butterfly" className={className} />
)

export const BeautyCitaLogoCrown = ({ className = "h-6 w-6" }: { className?: string }) => (
  <BeautyCitaLogo variant="crown" className={className} />
)