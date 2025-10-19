import { useState } from 'react'
import { motion } from 'framer-motion'
import { CogIcon, BellIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function BusinessSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    bookingReminders: true,
    marketingEmails: false,
    autoConfirmBookings: false
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your business preferences</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <label htmlFor={key} className="text-gray-900 font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                id={key}
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                className="h-5 w-5"
              />
            </div>
          ))}
        </div>
        <button className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
          Save Settings
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
        <p className="text-gray-600 mb-6">Connect your payout accounts</p>
        <button className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all">
          <CreditCardIcon className="h-5 w-5" />
          Manage Payment Methods
        </button>
      </div>
    </div>
  )
}
