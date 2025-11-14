import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface DeviceBasedAuthProps {
  mobileComponent: React.ComponentType
  desktopComponent: React.ComponentType
}

/**
 * Device-based auth router
 * - Mobile (< 768px): Google One Tap only
 * - Desktop (>= 768px): Google One Tap + Email/Password
 */
export default function DeviceBasedAuth({ mobileComponent: MobileComponent, desktopComponent: DesktopComponent }: DeviceBasedAuthProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile ? <MobileComponent /> : <DesktopComponent />
}
