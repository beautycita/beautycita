import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

export interface Country {
  code: string
  name: string
  dial: string
  flag: string
  format?: string
  maxLength?: number
}

const countries: Country[] = [
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽', format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', format: 'XXXX XXX XXXX', maxLength: 11 },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸', format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', format: 'XX XX XX XX XX', maxLength: 10 },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', format: 'XXXX XXXXXXX', maxLength: 11 },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹', format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷', format: '(XX) XXXXX-XXXX', maxLength: 11 },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', format: 'XX XXXX-XXXX', maxLength: 10 },
]

export interface PhoneInputProps {
  value?: string
  onChange: (value: string, countryCode: string) => void
  onCountryChange?: (country: Country) => void
  onBlur?: () => void
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  defaultCountry?: string
}

export default function PhoneInput({
  value = '',
  onChange,
  onCountryChange,
  onBlur,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  defaultCountry = 'US'
}: PhoneInputProps) {
  const { t } = useTranslation()
  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    countries.find(c => c.code === defaultCountry) || countries[0]
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState(value.replace(selectedCountry.dial, '').trim())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside - improved for mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node

      // Don't close if clicking within the dropdown or the trigger button
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Also check if we're clicking the trigger button
        const isClickingTrigger = (target as Element).closest('[aria-label="Select Country"]')
        if (!isClickingTrigger) {
          console.log('📞 Closing dropdown - clicked outside')
          setIsDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Format phone number based on country
  const formatPhoneNumber = (input: string, country: Country): string => {
    const cleaned = input.replace(/\D/g, '')
    const maxLength = country.maxLength || 15
    const truncated = cleaned.slice(0, maxLength)

    if (!country.format) return truncated

    let formatted = ''
    let digitIndex = 0

    for (const char of country.format) {
      if (char === 'X' && digitIndex < truncated.length) {
        formatted += truncated[digitIndex]
        digitIndex++
      } else if (char !== 'X') {
        formatted += char
      } else {
        break
      }
    }

    return formatted
  }

  const handleCountrySelect = (country: Country) => {
    console.log('🌍 Country selected:', country.name, country.dial)

    setSelectedCountry(country)
    setIsDropdownOpen(false)
    onCountryChange?.(country)

    // Keep the same phone number but update country code
    const cleanedNumber = phoneNumber.replace(/\D/g, '')
    const maxLength = country.maxLength || 15
    const limitedNumber = cleanedNumber.slice(0, maxLength)
    const formattedNumber = formatPhoneNumber(limitedNumber, country)
    setPhoneNumber(formattedNumber)

    // Send full phone number with country code
    const fullNumber = limitedNumber ? `${country.dial}${limitedNumber}` : ''
    onChange(fullNumber, country.code)

    // Focus back to input with mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const cleanedInput = input.replace(/\D/g, '')

    // Limit to max length for country
    const maxLength = selectedCountry.maxLength || 15
    const limitedInput = cleanedInput.slice(0, maxLength)

    // Format for display but keep editing smooth
    const formattedNumber = formatPhoneNumber(limitedInput, selectedCountry)
    setPhoneNumber(formattedNumber)

    // Send full phone number with country code
    const fullNumber = limitedInput ? `${selectedCountry.dial}${limitedInput}` : ''
    onChange(fullNumber, selectedCountry.code)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow navigation in dropdown
    if (isDropdownOpen) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        inputRef.current?.focus()
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Country selector */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('📞 Country selector clicked, current state:', isDropdownOpen)
              setIsDropdownOpen(!isDropdownOpen)
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!disabled) {
                setIsDropdownOpen(!isDropdownOpen)
              }
            }}
            disabled={disabled}
            className="h-full px-3 py-0 flex items-center space-x-1 bg-gray-50 border-r border-gray-300 rounded-l-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-200 transition-colors duration-150 cursor-pointer touch-manipulation"
            style={{
              minHeight: '42px',
              touchAction: 'manipulation'
            }}
            aria-label="Select Country"
          >
            <span className="text-lg" role="img" aria-label={selectedCountry.name}>
              {selectedCountry.flag}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {selectedCountry.dial}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isDropdownOpen ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Phone number input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Enter phone number'}
          disabled={disabled}
          required={required}
          className={`block w-full pl-24 pr-3 py-2 border ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          } rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50`}
          autoComplete="tel"
        />

        {/* Country dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            data-country-dropdown
            className="absolute z-[9999] mt-1 w-full bg-white shadow-xl max-h-60 rounded-3xl py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200"
            style={{
              zIndex: 9999,
              WebkitOverflowScrolling: 'touch',
              minWidth: '280px',
              boxSizing: 'border-box',
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0
            }}
          >
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCountrySelect(country)
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCountrySelect(country)
                }}
                className="w-full text-left px-3 py-3 flex items-center space-x-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none active:bg-gray-200 transition-colors duration-150 cursor-pointer touch-manipulation"
                style={{
                  minHeight: '48px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
                  userSelect: 'none'
                }}
              >
                <span className="text-lg" role="img" aria-label={country.name}>
                  {country.flag}
                </span>
                <div className="flex-1">
                  <span className="block text-sm text-gray-900">{country.name}</span>
                  <span className="block text-xs text-gray-500">{country.dial}</span>
                </div>
                {selectedCountry.code === country.code && (
                  <span className="text-primary-600 text-sm font-medium">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Format hint */}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          Hint: 1234567890
        </p>
      )}
    </div>
  )
}