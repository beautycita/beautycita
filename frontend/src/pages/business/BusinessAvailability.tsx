import StylistAvailabilityEditor from '../../components/booking/StylistAvailabilityEditor'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function BusinessAvailability() {
  const { user } = useAuthStore()

  if (!user?.stylist_id) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Stylist profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Availability</h1>
        <p className="text-gray-600">Set your working hours and time off</p>
      </div>

      <StylistAvailabilityEditor
        stylistId={user.stylist_id}
        onSave={() => toast.success('Availability updated successfully!')}
      />
    </div>
  )
}
