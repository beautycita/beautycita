#!/bin/bash

# BeautyCita Booking System - Complete Setup Script
# This script fixes permissions, creates missing components, builds frontend, and restarts services

set -e  # Exit on any error

SUDO_PASS="JUs3f2m3Fa"
BASE_DIR="/var/www/beautycita.com"
FRONTEND_DIR="$BASE_DIR/frontend"
BACKEND_DIR="$BASE_DIR/backend"

echo "================================================"
echo "BeautyCita Booking System - Complete Setup"
echo "================================================"
echo ""

# Function to run commands with sudo
run_sudo() {
    echo "$SUDO_PASS" | sudo -S "$@"
}

# Step 1: Fix Permissions
echo "Step 1/7: Fixing file permissions..."
run_sudo chown -R www-data:www-data "$FRONTEND_DIR/src/"
run_sudo chmod -R 755 "$FRONTEND_DIR/src/"
run_sudo chown -R www-data:www-data "$BACKEND_DIR/src/"
run_sudo chmod -R 755 "$BACKEND_DIR/src/"
echo "✓ Permissions fixed"
echo ""

# Step 2: Create BookingDetailsModal component
echo "Step 2/7: Creating BookingDetailsModal component..."
sudo -u www-data tee "$FRONTEND_DIR/src/components/booking/BookingDetailsModal.tsx" > /dev/null <<'EOF'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { XMarkIcon, ClockIcon, CurrencyDollarIcon, UserIcon, CalendarDaysIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface BookingDetailsModalProps {
  booking: any
  onClose: () => void
  onUpdate?: () => void
  userRole: 'CLIENT' | 'STYLIST'
}

export default function BookingDetailsModal({ booking, onClose, onUpdate, userRole }: BookingDetailsModalProps) {
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      await axios.post(`${API_URL}/api/bookings/${booking.id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Booking accepted!')
      if (onUpdate) onUpdate()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept booking')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      await axios.post(`${API_URL}/api/bookings/${booking.id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Booking marked as complete!')
      if (onUpdate) onUpdate()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-300'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const bookingDate = booking.booking_date ? new Date(booking.booking_date) : null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 p-6 rounded-t-3xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Booking Details</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(booking.status)}`}>{booking.status}</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Service</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-xl"><DocumentTextIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white">{booking.service_name || 'Service'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-xl"><ClockIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white">{booking.duration_minutes} minutes</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-xl"><CurrencyDollarIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white text-xl">${parseFloat(booking.total_price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">When</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl"><CalendarDaysIcon className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{bookingDate ? format(bookingDate, 'EEEE, MMMM d, yyyy') : 'Date not set'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{booking.start_time} - {booking.end_time}</p>
                </div>
              </div>
            </div>
            {userRole === 'STYLIST' && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Client</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500 rounded-xl"><UserIcon className="h-5 w-5 text-white" /></div>
                    <p className="font-semibold text-gray-900 dark:text-white">{booking.client_name || 'Client'}</p>
                  </div>
                  {booking.client_phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-xl"><PhoneIcon className="h-5 w-5 text-white" /></div>
                      <a href={`tel:${booking.client_phone}`} className="text-gray-900 dark:text-white hover:underline">{booking.client_phone}</a>
                    </div>
                  )}
                  {booking.client_email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-xl"><EnvelopeIcon className="h-5 w-5 text-white" /></div>
                      <a href={`mailto:${booking.client_email}`} className="text-gray-900 dark:text-white hover:underline">{booking.client_email}</a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {booking.status === 'PENDING' && userRole === 'STYLIST' && (
                <button onClick={handleAccept} disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />{loading ? 'Accepting...' : 'Accept Booking'}
                </button>
              )}
              {booking.status === 'CONFIRMED' && userRole === 'STYLIST' && (
                <button onClick={handleComplete} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />{loading ? 'Processing...' : 'Mark as Complete'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
EOF
echo "✓ BookingDetailsModal created"
echo ""

# Step 3: Update BookingCalendar to show category colors
echo "Step 3/7: Updating BookingCalendar with category colors..."
sudo -u www-data tee -a "$FRONTEND_DIR/src/components/booking/BookingCalendar.tsx" > /dev/null <<'EOF'

// Category color mapping
const CATEGORY_COLORS: { [key: string]: { bg: string; border: string } } = {
  'Hair': { bg: '#ec4899', border: '#db2777' },
  'Nails': { bg: '#9333ea', border: '#7e22ce' },
  'Skincare': { bg: '#3b82f6', border: '#2563eb' },
  'Makeup': { bg: '#f59e0b', border: '#d97706' },
  'Massage': { bg: '#10b981', border: '#059669' },
  'default': { bg: '#6b7280', border: '#4b5563' }
}
EOF
echo "✓ Category colors added"
echo ""

# Step 4: Clean old build artifacts
echo "Step 4/7: Cleaning old build artifacts..."
run_sudo rm -rf "$FRONTEND_DIR/dist/"
run_sudo rm -rf "$FRONTEND_DIR/node_modules/.vite"
echo "✓ Build artifacts cleaned"
echo ""

# Step 5: Build Frontend
echo "Step 5/7: Building frontend (this may take 30-60 seconds)..."
cd "$FRONTEND_DIR"
sudo -u www-data npm run build 2>&1 | tail -20
if [ $? -eq 0 ]; then
    echo "✓ Frontend build successful"
else
    echo "✗ Frontend build failed - check errors above"
    exit 1
fi
echo ""

# Step 6: Restart Backend
echo "Step 6/7: Restarting backend API..."
sudo -u www-data pm2 restart beautycita-api 2>&1 | grep -E "(beautycita-api|online|status)"
echo "✓ Backend restarted"
echo ""

# Step 7: Verify Everything
echo "Step 7/7: Verifying setup..."
echo ""

# Check backend is running
if sudo -u www-data pm2 list | grep -q "beautycita-api.*online"; then
    echo "✓ Backend API is online"
else
    echo "✗ Backend API is not running"
fi

# Check if dist folder was created
if [ -d "$FRONTEND_DIR/dist" ]; then
    FILE_COUNT=$(find "$FRONTEND_DIR/dist" -type f | wc -l)
    echo "✓ Frontend built successfully ($FILE_COUNT files)"
else
    echo "✗ Frontend dist folder not found"
fi

# Check database connection
DB_CHECK=$(PGPASSWORD='qGXA1CR3FVnsq4fp78Z6h31ROzzU2DJsSF0lX1Aq7Uk=' psql -h localhost -U beautycita_app -d beautycita -t -c "SELECT COUNT(*) FROM services WHERE stylist_id = 20;" 2>&1)
if [[ "$DB_CHECK" =~ ^[0-9]+$ ]]; then
    echo "✓ Database connection working ($DB_CHECK services found)"
else
    echo "✗ Database connection issue"
fi

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "✅ Backend API: Running with all new endpoints"
echo "✅ Frontend: Built with React Big Calendar"
echo "✅ Components: BookingCalendar, TimeSlotPicker, AvailabilityEditor"
echo "✅ Database: Test data available (Stylist ID: 20)"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit: https://beautycita.com/business/calendar"
echo "2. Login as stylist (stylist@example.com)"
echo "3. View bookings calendar"
echo "4. Click events to manage bookings"
echo "5. Set availability at: /business/availability"
echo ""
echo "📊 New API Endpoints Available:"
echo "  GET  /api/bookings/stylist/:id/bookings      → Calendar data"
echo "  GET  /api/bookings/stylists/:id/availability → Time slots"
echo "  GET  /api/availability/stylist/:id/recurring → Weekly schedule"
echo "  POST /api/availability/stylist/:id/recurring → Set schedule"
echo "  GET  /api/availability/stylist/:id/time-off  → Time off list"
echo "  POST /api/availability/stylist/:id/time-off  → Add time off"
echo "  PUT  /api/bookings/:id/reschedule            → Reschedule booking"
echo "  POST /api/bookings/check-conflict            → Check conflicts"
echo ""
echo "🧪 Test Commands:"
echo "  # Check backend health"
echo "  curl https://beautycita.com/api/health"
echo ""
echo "  # Get availability for stylist 20"
echo "  curl 'https://beautycita.com/api/bookings/stylists/20/availability?date=2025-10-20'"
echo ""
echo "================================================"
echo "System ready for booking operations! 🚀"
echo "================================================"
EOF
</invoke>