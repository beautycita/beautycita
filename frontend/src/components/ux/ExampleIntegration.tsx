/**
 * BeautyCita UX Components - Integration Examples
 *
 * This file demonstrates how to integrate the new UX enhancement components
 * into existing BeautyCita pages.
 */

import React, { useState } from 'react';
import {
  // Skeleton Loaders
  BookingCardSkeleton,
  StylistCardSkeleton,
  // Optimistic UI
  useOptimisticList,
  OptimisticButton,
  // Form Validation
  useFormValidation,
  ValidationRules,
  ValidatedInput,
  // Undo Actions
  useUndoManager,
  UndoToast,
  UndoActions,
  // Contextual Help
  Tooltip,
  HelpButton,
  // Progressive Disclosure & Loading
  Tabs,
  LoadingButton,
  EmptyState,
  NoBookings,
} from '@/components/ux';

// ============================================================================
// EXAMPLE 1: Enhanced Booking List with Optimistic Updates & Undo
// ============================================================================

interface Booking {
  id: number;
  clientName: string;
  service: string;
  date: string;
  status: 'confirmed' | 'cancelled';
}

export function EnhancedBookingList() {
  const [isLoading, setIsLoading] = useState(false);

  // Optimistic list management
  const { list: bookings, removeItem, isOptimistic } = useOptimisticList<Booking>(
    [], // Will be loaded from API
    {
      onError: (error) => {
        console.error('Failed to update booking:', error);
        // Show toast notification
      },
    }
  );

  // Undo manager for cancellations
  const { executeWithUndo, undoAction, currentAction, canUndo } = useUndoManager({
    defaultTimeout: 5000,
  });

  const handleCancelBooking = async (booking: Booking) => {
    await executeWithUndo(
      UndoActions.deleteBooking(
        booking.id,
        booking,
        async (id) => {
          // Cancel booking optimistically
          await removeItem(id, async () => {
            await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
          });
        },
        async (bookingData) => {
          // Restore booking
          await fetch('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
          });
        }
      ),
      5000 // 5 second undo window
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    );
  }

  // Empty state
  if (bookings.length === 0) {
    return <NoBookings onCreateBooking={() => window.location.href = '/bookings/new'} />;
  }

  return (
    <div>
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className={`border rounded-lg p-4 ${
              isOptimistic(booking.id) ? 'opacity-50' : ''
            }`}
          >
            <h3 className="font-semibold">{booking.clientName}</h3>
            <p className="text-sm text-gray-600">{booking.service}</p>
            <p className="text-sm text-gray-500">{booking.date}</p>

            <div className="mt-3 flex gap-2">
              <Tooltip
                content="This will cancel the booking and send a notification to the client"
                position="top"
              >
                <button
                  onClick={() => handleCancelBooking(booking)}
                  className="text-red-600 text-sm hover:underline"
                  disabled={isOptimistic(booking.id)}
                >
                  {isOptimistic(booking.id) ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {/* Undo Toast */}
      {canUndo && (
        <UndoToast
          action={currentAction}
          onUndo={undoAction}
          timeout={5000}
          position="bottom-right"
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Booking Form with Inline Validation
// ============================================================================

export function EnhancedBookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = {
    clientName: {
      rules: [
        ValidationRules.required('Client name is required'),
        ValidationRules.minLength(2, 'Name must be at least 2 characters'),
      ],
      validateOn: 'blur',
    },
    clientEmail: {
      rules: [
        ValidationRules.required('Email is required'),
        ValidationRules.email(),
      ],
      validateOn: 'change',
      debounceMs: 300,
    },
    clientPhone: {
      rules: [
        ValidationRules.required('Phone number is required'),
        ValidationRules.phone(),
      ],
      validateOn: 'blur',
    },
    date: {
      rules: [
        ValidationRules.required('Date is required'),
        ValidationRules.date(),
      ],
      validateOn: 'blur',
    },
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  } = useFormValidation(schema, {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      // Success - redirect or show success message
      window.location.href = '/bookings';
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Client Name
          </label>
          <HelpButton
            content="Enter the full name of the client for this booking"
            size="sm"
          />
        </div>
        <ValidatedInput
          name="clientName"
          type="text"
          value={values.clientName}
          error={touched.clientName ? errors.clientName : null}
          touched={touched.clientName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <ValidatedInput
          name="clientEmail"
          type="email"
          value={values.clientEmail}
          error={touched.clientEmail ? errors.clientEmail : null}
          touched={touched.clientEmail}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="john@example.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <ValidatedInput
          name="clientPhone"
          type="tel"
          value={values.clientPhone}
          error={touched.clientPhone ? errors.clientPhone : null}
          touched={touched.clientPhone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="+1 (555) 123-4567"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Booking Date
        </label>
        <ValidatedInput
          name="date"
          type="date"
          value={values.date}
          error={touched.date ? errors.date : null}
          touched={touched.date}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
      </div>

      <div className="flex gap-3">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText="Creating booking..."
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Booking
        </LoadingButton>

        <button
          type="button"
          onClick={() => resetForm()}
          className="text-gray-600 px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// EXAMPLE 3: Stylist Search with Tabs, Loading & Empty States
// ============================================================================

export function EnhancedStylistSearch() {
  const [stylists, setStylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    {
      id: 'nearby',
      label: 'Nearby',
      badge: stylists.filter((s: any) => s.distance < 5).length,
      content: (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StylistCardSkeleton />
              <StylistCardSkeleton />
              <StylistCardSkeleton />
            </div>
          ) : stylists.length === 0 ? (
            <EmptyState
              title="No stylists found nearby"
              description="Try expanding your search radius or browse all stylists."
              action={{
                label: 'Browse All Stylists',
                onClick: () => console.log('Browse all'),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stylist cards */}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'favorites',
      label: 'Favorites',
      badge: 3,
      content: <div>Favorite stylists content</div>,
    },
    {
      id: 'recent',
      label: 'Recent',
      content: <div>Recently viewed stylists</div>,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Find Stylists</h1>
        <p className="text-gray-600">Discover talented beauty professionals near you</p>
      </div>

      <Tabs
        tabs={tabs}
        defaultTab="nearby"
        onChange={(tabId) => console.log('Switched to:', tabId)}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Dashboard with Optimistic Like Button
// ============================================================================

import { useOptimisticToggle } from '@/components/ux';

export function StylistLikeButton({ stylistId, initialLiked }: { stylistId: number; initialLiked: boolean }) {
  const { value: isLiked, toggle, isOptimistic } = useOptimisticToggle(
    initialLiked,
    async (newValue) => {
      const response = await fetch(`/api/stylists/${stylistId}/favorite`, {
        method: newValue ? 'POST' : 'DELETE',
      });
      const data = await response.json();
      return data.isFavorited;
    }
  );

  return (
    <Tooltip content={isLiked ? 'Remove from favorites' : 'Add to favorites'}>
      <OptimisticButton
        onClick={toggle}
        isOptimistic={isOptimistic}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
        }`}
      >
        <span>{isLiked ? '❤️' : '🤍'}</span>
        <span>{isLiked ? 'Favorited' : 'Favorite'}</span>
      </OptimisticButton>
    </Tooltip>
  );
}

// ============================================================================
// MIGRATION TIPS
// ============================================================================

/*
1. REPLACE LOADING SPINNERS:
   Before: <div className="spinner">Loading...</div>
   After:  <BookingCardSkeleton />

2. ADD OPTIMISTIC UPDATES:
   Before: await deleteBooking(id); refetch();
   After:  const { removeItem } = useOptimisticList(...);
           await removeItem(id, () => api.deleteBooking(id));

3. ENHANCE FORMS:
   Before: <input onChange={e => setValue(e.target.value)} />
   After:  <ValidatedInput {...getFieldProps('fieldName')} />

4. ADD UNDO TO DESTRUCTIVE ACTIONS:
   Before: await cancelBooking(id);
   After:  await executeWithUndo(UndoActions.cancelBooking(...));

5. IMPROVE EMPTY STATES:
   Before: {items.length === 0 && <p>No items</p>}
   After:  {items.length === 0 && <NoBookings onCreateBooking={...} />}
*/

export default {
  EnhancedBookingList,
  EnhancedBookingForm,
  EnhancedStylistSearch,
  StylistLikeButton,
};
