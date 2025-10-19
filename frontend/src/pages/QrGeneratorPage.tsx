import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  QrCodeIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CalendarDaysIcon,
  SparklesIcon,
  LinkIcon,
  CheckCircleIcon,
  PhotoIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'
import QRCode from 'qrcode'

type QRType = 'profile' | 'booking' | 'promo' | 'custom'
type ModuleStyle = 'square' | 'rounded' | 'dots' | 'extra-rounded' | 'classy' | 'diamond' | 'leaf'
type FinderStyle = 'square' | 'rounded' | 'dots' | 'leaf' | 'flower'
type FinderInnerStyle = 'square' | 'rounded' | 'dots' | 'diamond' | 'leaf'
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

interface QRCustomization {
  // Module (data dots) styling
  moduleStyle: ModuleStyle
  moduleColor: string
  backgroundColor: string

  // Gradient options
  useGradient: boolean
  gradientType: 'linear' | 'radial'
  gradientColor1: string
  gradientColor2: string
  gradientColor3: string

  // Finder pattern (corner squares) styling
  finderStyle: FinderStyle
  finderInnerStyle: FinderInnerStyle
  finderOuterColor: string
  finderInnerColor: string

  // Logo
  logoImage: string | null
  logoSize: number
  logoMargin: number

  // QR Settings
  errorCorrection: ErrorCorrectionLevel
  size: number
  margin: number
}

export default function QrGeneratorPage() {
  const [qrType, setQrType] = useState<QRType>('profile')
  const [customUrl, setCustomUrl] = useState('')
  const [stylistId, setStylistId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [qrCodeSvg, setQrCodeSvg] = useState('')
  const [generated, setGenerated] = useState(false)
  const [showCustomization, setShowCustomization] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // QR Customization state
  const [customization, setCustomization] = useState<QRCustomization>({
    moduleStyle: 'rounded',
    moduleColor: '#000000',
    backgroundColor: '#ffffff',
    useGradient: true,
    gradientType: 'linear',
    gradientColor1: '#ec4899',
    gradientColor2: '#a855f7',
    gradientColor3: '#3b82f6',
    finderStyle: 'rounded',
    finderInnerStyle: 'rounded',
    finderOuterColor: '#000000',
    finderInnerColor: '#000000',
    logoImage: null,
    logoSize: 100,
    logoMargin: 10,
    errorCorrection: 'H',
    size: 500,
    margin: 2
  })

  const baseUrl = import.meta.env.VITE_APP_URL || 'https://beautycita.com'

  // Load default BeautyCita logo on mount
  useEffect(() => {
    const loadDefaultLogo = async () => {
      try {
        const response = await fetch('/media/brand/official-logo.svg')
        const svgText = await response.text()
        const blob = new Blob([svgText], { type: 'image/svg+xml' })
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          setCustomization((prev) => ({
            ...prev,
            logoImage: dataUrl
          }))
        }
        reader.readAsDataURL(blob)
      } catch (error) {
        console.error('Failed to load default logo:', error)
      }
    }
    loadDefaultLogo()
  }, [])

  useEffect(() => {
    generateQRCode()
  }, [qrType, customUrl, stylistId, serviceId, promoCode, customization])

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (qrCodeSvg && qrCodeSvg.startsWith('blob:')) {
        URL.revokeObjectURL(qrCodeSvg)
      }
    }
  }, [qrCodeSvg])

  const getQRUrl = (): string => {
    switch (qrType) {
      case 'profile':
        return stylistId ? `${baseUrl}/stylist/${stylistId}` : `${baseUrl}`
      case 'booking':
        return serviceId ? `${baseUrl}/booking/${serviceId}` : `${baseUrl}/services`
      case 'promo':
        return promoCode ? `${baseUrl}?promo=${promoCode}` : `${baseUrl}`
      case 'custom':
        return customUrl || `${baseUrl}`
      default:
        return baseUrl
    }
  }

  const generateQRCode = async () => {
    try {
      const url = getQRUrl()
      if (!url || url === baseUrl) {
        setGenerated(false)
        return
      }

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      canvas.width = customization.size
      canvas.height = customization.size

      // Generate base QR code data
      const qrCanvas = document.createElement('canvas')
      await QRCode.toCanvas(qrCanvas, url, {
        width: customization.size,
        margin: customization.margin,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: customization.errorCorrection
      })

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background
      ctx.fillStyle = customization.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Get QR data
      const qrCtx = qrCanvas.getContext('2d')
      if (!qrCtx) return
      const imageData = qrCtx.getImageData(0, 0, customization.size, customization.size)

      // Calculate module size
      const moduleCount = Math.floor(customization.size / (37 + customization.margin * 2)) // Approximate
      const moduleSize = customization.size / (37 + customization.margin * 2)

      // Detect finder patterns (corners at 0,0 | top-right | bottom-left)
      const finderSize = 7 * moduleSize
      const margin = customization.margin * moduleSize

      // Draw data modules with custom style
      await drawQRModules(ctx, imageData, moduleSize, margin, finderSize)

      // Draw finder patterns with custom style
      drawFinderPattern(ctx, margin, margin, finderSize)
      drawFinderPattern(ctx, customization.size - margin - finderSize, margin, finderSize)
      drawFinderPattern(ctx, margin, customization.size - margin - finderSize, finderSize)

      // Apply gradient overlay if enabled
      if (customization.useGradient) {
        applyGradientOverlay(ctx, customization.size)
      }

      // Draw logo if uploaded
      if (customization.logoImage) {
        await drawLogo(ctx, customization.logoImage, customization.size)
      }

      // Convert canvas to data URL
      setQrCodeDataUrl(canvas.toDataURL('image/png'))

      // Generate SVG version
      await generateSVG(url, imageData, moduleSize, margin, finderSize)

      setGenerated(true)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  // Generate SVG version of QR code
  const generateSVG = async (url: string, imageData: ImageData, moduleSize: number, margin: number, finderSize: number) => {
    const size = customization.size
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">\n`

    // Add gradient definitions if enabled
    if (customization.useGradient) {
      const gradientId = 'qr-gradient'

      svgContent += `  <defs>\n`

      // Main gradient at 25% opacity (reduced for scannability)
      if (customization.gradientType === 'linear') {
        svgContent += `    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">\n`
        svgContent += `      <stop offset="0%" style="stop-color:${customization.gradientColor1};stop-opacity:0.25" />\n`
        svgContent += `      <stop offset="50%" style="stop-color:${customization.gradientColor2};stop-opacity:0.25" />\n`
        svgContent += `      <stop offset="100%" style="stop-color:${customization.gradientColor3};stop-opacity:0.25" />\n`
        svgContent += `    </linearGradient>\n`
      } else {
        svgContent += `    <radialGradient id="${gradientId}">\n`
        svgContent += `      <stop offset="0%" style="stop-color:${customization.gradientColor1};stop-opacity:0.25" />\n`
        svgContent += `      <stop offset="50%" style="stop-color:${customization.gradientColor2};stop-opacity:0.25" />\n`
        svgContent += `      <stop offset="100%" style="stop-color:${customization.gradientColor3};stop-opacity:0.25" />\n`
        svgContent += `    </radialGradient>\n`
      }

      // Edge fading mask removed to maintain QR code scannability

      svgContent += `  </defs>\n`
    }

    // Background
    svgContent += `  <rect width="${size}" height="${size}" fill="${customization.backgroundColor}"/>\n`

    // Draw modules
    for (let y = 0; y < size; y += moduleSize) {
      for (let x = 0; x < size; x += moduleSize) {
        const idx = (Math.floor(y) * size + Math.floor(x)) * 4

        if (imageData.data[idx] > 128) continue

        const isInTopLeftFinder = x < margin + finderSize && y < margin + finderSize
        const isInTopRightFinder = x > size - margin - finderSize && y < margin + finderSize
        const isInBottomLeftFinder = x < margin + finderSize && y > size - margin - finderSize
        if (isInTopLeftFinder || isInTopRightFinder || isInBottomLeftFinder) continue

        svgContent += generateSVGModule(x, y, moduleSize, customization.moduleStyle, customization.moduleColor)
      }
    }

    // Draw finder patterns
    svgContent += generateSVGFinderPattern(margin, margin, finderSize)
    svgContent += generateSVGFinderPattern(size - margin - finderSize, margin, finderSize)
    svgContent += generateSVGFinderPattern(margin, size - margin - finderSize, finderSize)

    // Apply gradient overlay (no mask for better scannability)
    if (customization.useGradient) {
      svgContent += `  <rect width="${size}" height="${size}" fill="url(#qr-gradient)"/>\n`
    }

    // Add logo if present
    if (customization.logoImage) {
      const logoSize = customization.logoSize
      const logoX = (size - logoSize) / 2
      const logoY = (size - logoSize) / 2
      const bgSize = logoSize + customization.logoMargin * 2
      const bgX = logoX - customization.logoMargin
      const bgY = logoY - customization.logoMargin

      svgContent += `  <rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="10" fill="${customization.backgroundColor}"/>\n`
      svgContent += `  <image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${customization.logoImage}"/>\n`
    }

    svgContent += `</svg>`

    // Revoke old blob URL before creating new one
    if (qrCodeSvg && qrCodeSvg.startsWith('blob:')) {
      URL.revokeObjectURL(qrCodeSvg)
    }

    // Create data URL for SVG
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)
    setQrCodeSvg(svgUrl)
  }

  // Generate SVG module element
  const generateSVGModule = (x: number, y: number, size: number, style: ModuleStyle, color: string): string => {
    const inset = 1
    const actualSize = size - inset
    const cx = x + size / 2
    const cy = y + size / 2

    switch (style) {
      case 'square':
        return `  <rect x="${x}" y="${y}" width="${actualSize}" height="${actualSize}" fill="${color}"/>\n`

      case 'rounded':
        return `  <rect x="${x}" y="${y}" width="${actualSize}" height="${actualSize}" rx="${size * 0.3}" fill="${color}"/>\n`

      case 'extra-rounded':
        return `  <rect x="${x}" y="${y}" width="${actualSize}" height="${actualSize}" rx="${size * 0.5}" fill="${color}"/>\n`

      case 'dots':
        return `  <circle cx="${cx}" cy="${cy}" r="${actualSize / 2}" fill="${color}"/>\n`

      case 'classy':
        // Rounded edges but one sharp corner
        const r = size * 0.3
        return `  <path d="M ${x + r} ${y} L ${x + actualSize - r} ${y} Q ${x + actualSize} ${y} ${x + actualSize} ${y + r} L ${x + actualSize} ${y + actualSize} L ${x} ${y + actualSize} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z" fill="${color}"/>\n`

      case 'diamond':
        return `  <path d="M ${cx} ${y} L ${x + actualSize} ${cy} L ${cx} ${y + actualSize} L ${x} ${cy} Z" fill="${color}"/>\n`

      case 'leaf':
        return `  <path d="M ${cx} ${y} Q ${x + actualSize} ${y} ${x + actualSize} ${cy} Q ${x + actualSize} ${y + actualSize} ${cx} ${y + actualSize} Q ${x} ${y + actualSize} ${x} ${cy} Q ${x} ${y} ${cx} ${y} Z" fill="${color}"/>\n`

      default:
        return ''
    }
  }

  // Generate SVG finder pattern
  const generateSVGFinderPattern = (x: number, y: number, size: number): string => {
    const outerStyle = customization.finderStyle
    const innerStyle = customization.finderInnerStyle
    let svg = ''
    const cx = x + size / 2
    const cy = y + size / 2

    // Outer frame
    if (outerStyle === 'square') {
      svg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${customization.finderOuterColor}"/>\n`
    } else if (outerStyle === 'rounded') {
      svg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.15}" fill="${customization.finderOuterColor}"/>\n`
    } else if (outerStyle === 'dots') {
      svg += `  <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${customization.finderOuterColor}"/>\n`
    } else if (outerStyle === 'leaf') {
      svg += `  <path d="M ${cx} ${y} Q ${x + size} ${y} ${x + size} ${cy} Q ${x + size} ${y + size} ${cx} ${y + size} Q ${x} ${y + size} ${x} ${cy} Q ${x} ${y} ${cx} ${y} Z" fill="${customization.finderOuterColor}"/>\n`
    } else if (outerStyle === 'flower') {
      const r = size / 2
      svg += `  <path d="M ${cx} ${y} Q ${cx + r * 0.6} ${cy - r * 0.6} ${cx + r} ${cy} Q ${cx + r * 0.6} ${cy + r * 0.6} ${cx} ${cy + r} Q ${cx - r * 0.6} ${cy + r * 0.6} ${cx - r} ${cy} Q ${cx - r * 0.6} ${cy - r * 0.6} ${cx} ${cy - r} Z" fill="${customization.finderOuterColor}"/>\n`
    }

    // White ring (middle layer)
    if (outerStyle === 'square') {
      svg += `  <rect x="${x + size * 0.14}" y="${y + size * 0.14}" width="${size * 0.72}" height="${size * 0.72}" fill="${customization.backgroundColor}"/>\n`
    } else if (outerStyle === 'rounded') {
      svg += `  <rect x="${x + size * 0.14}" y="${y + size * 0.14}" width="${size * 0.72}" height="${size * 0.72}" rx="${size * 0.1}" fill="${customization.backgroundColor}"/>\n`
    } else {
      // For dots, leaf, and flower, use circular white ring
      svg += `  <circle cx="${cx}" cy="${cy}" r="${size * 0.36}" fill="${customization.backgroundColor}"/>\n`
    }

    // Inner shape (pupil/ball)
    const innerSize = size * 0.43
    const innerOffset = (size - innerSize) / 2

    if (innerStyle === 'square') {
      svg += `  <rect x="${x + innerOffset}" y="${y + innerOffset}" width="${innerSize}" height="${innerSize}" fill="${customization.finderInnerColor}"/>\n`
    } else if (innerStyle === 'rounded') {
      svg += `  <rect x="${x + innerOffset}" y="${y + innerOffset}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.2}" fill="${customization.finderInnerColor}"/>\n`
    } else if (innerStyle === 'dots') {
      svg += `  <circle cx="${cx}" cy="${cy}" r="${innerSize / 2}" fill="${customization.finderInnerColor}"/>\n`
    } else if (innerStyle === 'diamond') {
      svg += `  <path d="M ${cx} ${y + innerOffset} L ${x + innerOffset + innerSize} ${cy} L ${cx} ${y + innerOffset + innerSize} L ${x + innerOffset} ${cy} Z" fill="${customization.finderInnerColor}"/>\n`
    } else if (innerStyle === 'leaf') {
      svg += `  <path d="M ${cx} ${y + innerOffset} Q ${x + innerOffset + innerSize} ${y + innerOffset} ${x + innerOffset + innerSize} ${cy} Q ${x + innerOffset + innerSize} ${y + innerOffset + innerSize} ${cx} ${y + innerOffset + innerSize} Q ${x + innerOffset} ${y + innerOffset + innerSize} ${x + innerOffset} ${cy} Q ${x + innerOffset} ${y + innerOffset} ${cx} ${y + innerOffset} Z" fill="${customization.finderInnerColor}"/>\n`
    }

    return svg
  }

  // Draw QR modules with custom styling
  const drawQRModules = async (
    ctx: CanvasRenderingContext2D,
    imageData: ImageData,
    moduleSize: number,
    margin: number,
    finderSize: number
  ) => {
    const size = customization.size

    for (let y = 0; y < size; y += moduleSize) {
      for (let x = 0; x < size; x += moduleSize) {
        const idx = (Math.floor(y) * size + Math.floor(x)) * 4

        // Skip if pixel is white (background)
        if (imageData.data[idx] > 128) continue

        // Skip finder pattern areas
        const isInTopLeftFinder = x < margin + finderSize && y < margin + finderSize
        const isInTopRightFinder = x > size - margin - finderSize && y < margin + finderSize
        const isInBottomLeftFinder = x < margin + finderSize && y > size - margin - finderSize
        if (isInTopLeftFinder || isInTopRightFinder || isInBottomLeftFinder) continue

        // Draw module with selected style
        ctx.fillStyle = customization.moduleColor
        drawModule(ctx, x, y, moduleSize, customization.moduleStyle)
      }
    }
  }

  // Draw individual module
  const drawModule = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    style: ModuleStyle
  ) => {
    const inset = 1 // Gap between modules
    const actualSize = size - inset

    switch (style) {
      case 'square':
        ctx.fillRect(x, y, actualSize, actualSize)
        break

      case 'rounded':
        roundRect(ctx, x, y, actualSize, actualSize, size * 0.3)
        ctx.fill()
        break

      case 'extra-rounded':
        roundRect(ctx, x, y, actualSize, actualSize, size * 0.5)
        ctx.fill()
        break

      case 'dots':
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, actualSize / 2, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'classy':
        // Rounded edges but one sharp corner (bottom-right)
        ctx.beginPath()
        const r = size * 0.3
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + actualSize - r, y)
        ctx.quadraticCurveTo(x + actualSize, y, x + actualSize, y + r)
        ctx.lineTo(x + actualSize, y + actualSize) // Sharp corner
        ctx.lineTo(x, y + actualSize)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
        ctx.fill()
        break

      case 'diamond':
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y)
        ctx.lineTo(x + actualSize, y + size / 2)
        ctx.lineTo(x + size / 2, y + actualSize)
        ctx.lineTo(x, y + size / 2)
        ctx.closePath()
        ctx.fill()
        break

      case 'leaf':
        // Teardrop/leaf shape
        ctx.beginPath()
        ctx.moveTo(x + size / 2, y)
        ctx.quadraticCurveTo(x + actualSize, y, x + actualSize, y + size / 2)
        ctx.quadraticCurveTo(x + actualSize, y + actualSize, x + size / 2, y + actualSize)
        ctx.quadraticCurveTo(x, y + actualSize, x, y + size / 2)
        ctx.quadraticCurveTo(x, y, x + size / 2, y)
        ctx.closePath()
        ctx.fill()
        break
    }
  }

  // Draw finder pattern (corner squares)
  const drawFinderPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const outerStyle = customization.finderStyle
    const innerStyle = customization.finderInnerStyle

    // Draw outer frame
    ctx.fillStyle = customization.finderOuterColor
    if (outerStyle === 'square') {
      ctx.fillRect(x, y, size, size)
    } else if (outerStyle === 'rounded') {
      roundRect(ctx, x, y, size, size, size * 0.15)
      ctx.fill()
    } else if (outerStyle === 'dots') {
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (outerStyle === 'leaf') {
      ctx.beginPath()
      ctx.moveTo(x + size / 2, y)
      ctx.quadraticCurveTo(x + size, y, x + size, y + size / 2)
      ctx.quadraticCurveTo(x + size, y + size, x + size / 2, y + size)
      ctx.quadraticCurveTo(x, y + size, x, y + size / 2)
      ctx.quadraticCurveTo(x, y, x + size / 2, y)
      ctx.closePath()
      ctx.fill()
    } else if (outerStyle === 'flower') {
      // Flower shape with 4 petals
      ctx.beginPath()
      const cx = x + size / 2
      const cy = y + size / 2
      const r = size / 2
      // Top petal
      ctx.moveTo(cx, y)
      ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 0.6, cx + r, cy)
      // Right petal
      ctx.quadraticCurveTo(cx + r * 0.6, cy + r * 0.6, cx, cy + r)
      // Bottom petal
      ctx.quadraticCurveTo(cx - r * 0.6, cy + r * 0.6, cx - r, cy)
      // Left petal
      ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.6, cx, cy - r)
      ctx.closePath()
      ctx.fill()
    }

    // Draw white ring (middle layer)
    ctx.fillStyle = customization.backgroundColor
    if (outerStyle === 'square' || outerStyle === 'rounded' || outerStyle === 'leaf' || outerStyle === 'flower') {
      if (outerStyle === 'square') {
        ctx.fillRect(x + size * 0.14, y + size * 0.14, size * 0.72, size * 0.72)
      } else if (outerStyle === 'rounded') {
        roundRect(ctx, x + size * 0.14, y + size * 0.14, size * 0.72, size * 0.72, size * 0.1)
        ctx.fill()
      } else {
        // For leaf and flower, use circular white ring
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (outerStyle === 'dots') {
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw inner shape (pupil/ball)
    ctx.fillStyle = customization.finderInnerColor
    const innerSize = size * 0.43
    const innerOffset = (size - innerSize) / 2
    const cx = x + size / 2
    const cy = y + size / 2

    if (innerStyle === 'square') {
      ctx.fillRect(x + innerOffset, y + innerOffset, innerSize, innerSize)
    } else if (innerStyle === 'rounded') {
      roundRect(ctx, x + innerOffset, y + innerOffset, innerSize, innerSize, innerSize * 0.2)
      ctx.fill()
    } else if (innerStyle === 'dots') {
      ctx.beginPath()
      ctx.arc(cx, cy, innerSize / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (innerStyle === 'diamond') {
      ctx.beginPath()
      ctx.moveTo(cx, y + innerOffset)
      ctx.lineTo(x + innerOffset + innerSize, cy)
      ctx.lineTo(cx, y + innerOffset + innerSize)
      ctx.lineTo(x + innerOffset, cy)
      ctx.closePath()
      ctx.fill()
    } else if (innerStyle === 'leaf') {
      ctx.beginPath()
      ctx.moveTo(cx, y + innerOffset)
      ctx.quadraticCurveTo(x + innerOffset + innerSize, y + innerOffset, x + innerOffset + innerSize, cy)
      ctx.quadraticCurveTo(x + innerOffset + innerSize, y + innerOffset + innerSize, cx, y + innerOffset + innerSize)
      ctx.quadraticCurveTo(x + innerOffset, y + innerOffset + innerSize, x + innerOffset, cy)
      ctx.quadraticCurveTo(x + innerOffset, y + innerOffset, cx, y + innerOffset)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Apply gradient overlay with light opacity for scannability
  const applyGradientOverlay = (ctx: CanvasRenderingContext2D, size: number) => {
    // Create main gradient at 25% opacity (reduced from 85% for better scanning)
    let gradient: CanvasGradient

    if (customization.gradientType === 'linear') {
      gradient = ctx.createLinearGradient(0, 0, size, size)
    } else {
      gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    }

    gradient.addColorStop(0, customization.gradientColor1 + '40') // 25% opacity
    gradient.addColorStop(0.5, customization.gradientColor2 + '40')
    gradient.addColorStop(1, customization.gradientColor3 + '40')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // Edge fading removed to maintain QR code scannability
    // QR codes need high contrast at edges for proper scanning
  }

  // Draw logo
  const drawLogo = async (ctx: CanvasRenderingContext2D, logoSrc: string, size: number) => {
    return new Promise<void>((resolve) => {
      const img = new Image()
      img.onload = () => {
        const logoSize = customization.logoSize
        const x = (size - logoSize) / 2
        const y = (size - logoSize) / 2

        // Draw white background for logo
        const bgSize = logoSize + customization.logoMargin * 2
        ctx.fillStyle = customization.backgroundColor
        roundRect(ctx, x - customization.logoMargin, y - customization.logoMargin, bgSize, bgSize, 10)
        ctx.fill()

        // Draw logo
        ctx.drawImage(img, x, y, logoSize, logoSize)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = logoSrc
    })
  }

  // Helper: Rounded rectangle
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCustomization((prev) => ({
          ...prev,
          logoImage: event.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Reset to default BeautyCita logo
  const resetToDefaultLogo = async () => {
    try {
      const response = await fetch('/media/brand/official-logo.svg')
      const svgText = await response.text()
      const blob = new Blob([svgText], { type: 'image/svg+xml' })
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setCustomization((prev) => ({
          ...prev,
          logoImage: dataUrl
        }))
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error('Failed to load default logo:', error)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeDataUrl
    link.download = `beautycita-qr-${qrType}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadQRCodeSVG = () => {
    const link = document.createElement('a')
    link.href = qrCodeSvg
    link.download = `beautycita-qr-${qrType}-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Quick style presets
  const applyPreset = (preset: 'gradient' | 'minimal' | 'classic' | 'neon' | 'elegant') => {
    switch (preset) {
      case 'gradient':
        setCustomization((prev) => ({
          ...prev,
          moduleStyle: 'rounded',
          moduleColor: '#000000',
          backgroundColor: '#ffffff',
          useGradient: true,
          gradientType: 'linear',
          gradientColor1: '#ec4899',
          gradientColor2: '#a855f7',
          gradientColor3: '#3b82f6',
          finderStyle: 'rounded'
        }))
        break

      case 'minimal':
        setCustomization((prev) => ({
          ...prev,
          moduleStyle: 'dots',
          moduleColor: '#000000',
          backgroundColor: '#ffffff',
          useGradient: false,
          finderStyle: 'rounded'
        }))
        break

      case 'classic':
        setCustomization((prev) => ({
          ...prev,
          moduleStyle: 'square',
          moduleColor: '#000000',
          backgroundColor: '#ffffff',
          useGradient: false,
          finderStyle: 'square'
        }))
        break

      case 'neon':
        setCustomization((prev) => ({
          ...prev,
          moduleStyle: 'extra-rounded',
          moduleColor: '#000000',
          backgroundColor: '#0a0a0a',
          useGradient: true,
          gradientType: 'radial',
          gradientColor1: '#00ff88',
          gradientColor2: '#00ccff',
          gradientColor3: '#cc00ff',
          finderStyle: 'rounded',
          finderOuterColor: '#00ff88',
          finderInnerColor: '#cc00ff'
        }))
        break

      case 'elegant':
        setCustomization((prev) => ({
          ...prev,
          moduleStyle: 'rounded',
          moduleColor: '#1a1a1a',
          backgroundColor: '#f5f5f5',
          useGradient: true,
          gradientType: 'linear',
          gradientColor1: '#d4af37',
          gradientColor2: '#c5a028',
          gradientColor3: '#b38f1a',
          finderStyle: 'rounded',
          finderOuterColor: '#d4af37',
          finderInnerColor: '#1a1a1a'
        }))
        break
    }
  }

  const qrTypes = [
    {
      id: 'profile' as QRType,
      icon: UserIcon,
      label: 'Stylist Profile',
      gradient: 'from-blue-500 to-purple-600',
      description: 'Link to a stylist profile page'
    },
    {
      id: 'booking' as QRType,
      icon: CalendarDaysIcon,
      label: 'Service Booking',
      gradient: 'from-pink-500 to-rose-600',
      description: 'Direct booking link for a service'
    },
    {
      id: 'promo' as QRType,
      icon: SparklesIcon,
      label: 'Promo Code',
      gradient: 'from-orange-500 to-yellow-600',
      description: 'Apply promo code on scan'
    },
    {
      id: 'custom' as QRType,
      icon: LinkIcon,
      label: 'Custom URL',
      gradient: 'from-green-500 to-emerald-600',
      description: 'Any custom link'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/panel/marketing" className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                QR Code Generator
              </h1>
              <p className="mt-2 text-gray-600">Create custom QR codes with advanced styling</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Type Selection */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select QR Code Type</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {qrTypes.map((type) => {
                    const Icon = type.icon
                    const isActive = qrType === type.id
                    return (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setQrType(type.id)}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          isActive
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-2 mx-auto`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className={`text-sm font-semibold ${isActive ? 'text-purple-900' : 'text-gray-900'}`}>
                          {type.label}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Input Fields */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h2>
                <div className="space-y-4">
                  {qrType === 'profile' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stylist ID or Username
                      </label>
                      <input
                        type="text"
                        value={stylistId}
                        onChange={(e) => setStylistId(e.target.value)}
                        placeholder="e.g., 123 or @username"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        URL: {baseUrl}/stylist/{stylistId || '{id}'}
                      </p>
                    </div>
                  )}

                  {qrType === 'booking' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service ID
                      </label>
                      <input
                        type="text"
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        placeholder="e.g., 456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        URL: {baseUrl}/booking/{serviceId || '{id}'}
                      </p>
                    </div>
                  )}

                  {qrType === 'promo' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SUMMER2024"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        URL: {baseUrl}?promo={promoCode || '{CODE}'}
                      </p>
                    </div>
                  )}

                  {qrType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom URL
                      </label>
                      <input
                        type="url"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        URL: {customUrl || 'Enter a URL'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Presets */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Style Presets</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset('gradient')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 mb-2" />
                    <p className="text-xs font-medium">BC Gradient</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset('minimal')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-white border-2 border-gray-300 mb-2" />
                    <p className="text-xs font-medium">Minimal</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset('classic')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-black mb-2" />
                    <p className="text-xs font-medium">Classic</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset('neon')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-green-400 via-cyan-400 to-purple-600 mb-2" />
                    <p className="text-xs font-medium">Neon</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset('elegant')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 transition-all"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-700 mb-2" />
                    <p className="text-xs font-medium">Elegant</p>
                  </motion.button>
                </div>
              </div>

              {/* Advanced Customization */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <SwatchIcon className="w-5 h-5" />
                    Advanced Customization
                  </h2>
                  <motion.div
                    animate={{ rotate: showCustomization ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                {showCustomization && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* Module Style (Data Dots) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Data Dot Style
                        <span className="text-xs text-gray-500 ml-2">(The small dots that make up the QR code)</span>
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {([
                          { value: 'square', label: '◼ Square' },
                          { value: 'rounded', label: '● Rounded' },
                          { value: 'extra-rounded', label: '⬤ Extra' },
                          { value: 'dots', label: '• Dots' },
                          { value: 'classy', label: '◗ Classy' },
                          { value: 'diamond', label: '◆ Diamond' },
                          { value: 'leaf', label: '🍃 Leaf' }
                        ] as { value: ModuleStyle; label: string }[]).map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setCustomization((prev) => ({ ...prev, moduleStyle: style.value }))}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              customization.moduleStyle === style.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <p className="text-xs font-medium whitespace-nowrap">{style.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Module Color</label>
                        <input
                          type="color"
                          value={customization.moduleColor}
                          onChange={(e) => setCustomization((prev) => ({ ...prev, moduleColor: e.target.value }))}
                          className="w-full h-12 rounded-xl cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                        <input
                          type="color"
                          value={customization.backgroundColor}
                          onChange={(e) => setCustomization((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-full h-12 rounded-xl cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Gradient Options */}
                    <div>
                      <label className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={customization.useGradient}
                          onChange={(e) => setCustomization((prev) => ({ ...prev, useGradient: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Gradient Overlay</span>
                      </label>

                      {customization.useGradient && (
                        <div className="space-y-4 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gradient Type</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCustomization((prev) => ({ ...prev, gradientType: 'linear' }))}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                                  customization.gradientType === 'linear'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                Linear
                              </button>
                              <button
                                onClick={() => setCustomization((prev) => ({ ...prev, gradientType: 'radial' }))}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                                  customization.gradientType === 'radial'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                Radial
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Color 1</label>
                              <input
                                type="color"
                                value={customization.gradientColor1}
                                onChange={(e) => setCustomization((prev) => ({ ...prev, gradientColor1: e.target.value }))}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Color 2</label>
                              <input
                                type="color"
                                value={customization.gradientColor2}
                                onChange={(e) => setCustomization((prev) => ({ ...prev, gradientColor2: e.target.value }))}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Color 3</label>
                              <input
                                type="color"
                                value={customization.gradientColor3}
                                onChange={(e) => setCustomization((prev) => ({ ...prev, gradientColor3: e.target.value }))}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Finder Pattern - Eye Frame */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Corner Eye Frame Style
                        <span className="text-xs text-gray-500 ml-2">(The outer ring of the 3 corner squares)</span>
                      </label>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {([
                          { value: 'square', label: '⬜ Square' },
                          { value: 'rounded', label: '⬛ Rounded' },
                          { value: 'dots', label: '⚫ Circle' },
                          { value: 'leaf', label: '🍃 Leaf' },
                          { value: 'flower', label: '✿ Flower' }
                        ] as { value: FinderStyle; label: string }[]).map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setCustomization((prev) => ({ ...prev, finderStyle: style.value }))}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              customization.finderStyle === style.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <p className="text-xs font-medium whitespace-nowrap">{style.label}</p>
                          </button>
                        ))}
                      </div>

                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Corner Eye Center Style
                        <span className="text-xs text-gray-500 ml-2">(The center dot/pupil of the 3 corner squares)</span>
                      </label>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {([
                          { value: 'square', label: '◼ Square' },
                          { value: 'rounded', label: '⬤ Rounded' },
                          { value: 'dots', label: '● Circle' },
                          { value: 'diamond', label: '◆ Diamond' },
                          { value: 'leaf', label: '🍃 Leaf' }
                        ] as { value: FinderInnerStyle; label: string }[]).map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setCustomization((prev) => ({ ...prev, finderInnerStyle: style.value }))}
                            className={`p-3 rounded-xl border-2 transition-all text-center ${
                              customization.finderInnerStyle === style.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <p className="text-xs font-medium whitespace-nowrap">{style.label}</p>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Eye Frame Color</label>
                          <input
                            type="color"
                            value={customization.finderOuterColor}
                            onChange={(e) => setCustomization((prev) => ({ ...prev, finderOuterColor: e.target.value }))}
                            className="w-full h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Eye Center Color</label>
                          <input
                            type="color"
                            value={customization.finderInnerColor}
                            onChange={(e) => setCustomization((prev) => ({ ...prev, finderInnerColor: e.target.value }))}
                            className="w-full h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo <span className="text-gray-500 font-normal">(BeautyCita logo loaded by default)</span>
                      </label>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <PhotoIcon className="w-5 h-5" />
                        Change Logo
                      </button>

                      {customization.logoImage && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Logo Size: {customization.logoSize}px
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="200"
                              value={customization.logoSize}
                              onChange={(e) => setCustomization((prev) => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Logo Margin: {customization.logoMargin}px
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={customization.logoMargin}
                              onChange={(e) => setCustomization((prev) => ({ ...prev, logoMargin: parseInt(e.target.value) }))}
                              className="w-full"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={resetToDefaultLogo}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Reset to Default Logo
                            </button>
                            <button
                              onClick={() => setCustomization((prev) => ({ ...prev, logoImage: null }))}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove Logo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QR Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Error Correction</label>
                        <select
                          value={customization.errorCorrection}
                          onChange={(e) => setCustomization((prev) => ({ ...prev, errorCorrection: e.target.value as ErrorCorrectionLevel }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="L">Low (7%)</option>
                          <option value="M">Medium (15%)</option>
                          <option value="Q">Quartile (25%)</option>
                          <option value="H">High (30%)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={customization.margin}
                          onChange={(e) => setCustomization((prev) => ({ ...prev, margin: parseInt(e.target.value) }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right: Preview & Download */}
            <div className="space-y-6">
              {/* QR Code Preview */}
              <div className="bg-white rounded-3xl shadow-lg p-8 sticky top-20">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">QR Code Preview</h2>
                <div className="flex flex-col items-center">
                  {qrCodeDataUrl ? (
                    <>
                      <div className="bg-white p-6 rounded-2xl border-4 border-purple-500 mb-6">
                        <img src={qrCodeDataUrl} alt="QR Code" className="w-64 h-64" />
                      </div>
                      {generated && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2 text-green-600 mb-4"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          <span className="font-medium">QR Code Generated!</span>
                        </motion.div>
                      )}
                      <div className="flex flex-col gap-3 w-full">
                        <button
                          onClick={downloadQRCode}
                          disabled={!generated}
                          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                            generated
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          Download PNG
                        </button>
                        <button
                          onClick={downloadQRCodeSVG}
                          disabled={!generated}
                          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                            generated
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          Download SVG
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-12">
                      <QrCodeIcon className="w-24 h-24 mx-auto mb-4 opacity-20" />
                      <p>Configure your QR code to see preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hidden canvas for QR code generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
