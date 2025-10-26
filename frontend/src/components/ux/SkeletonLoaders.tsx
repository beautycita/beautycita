/**
 * Skeleton Loaders - BeautyCita UX Enhancement
 * Better perceived performance while loading
 */

import React from 'react';

// ==================== BASE SKELETON COMPONENT ====================
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-lg';
      case 'text':
        return 'rounded';
      case 'rectangular':
      default:
        return '';
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'animate-shimmer';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${getVariantStyles()} ${getAnimationStyles()} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading..."
    />
  );
};

// ==================== SPECIALIZED SKELETON COMPONENTS ====================

/**
 * Skeleton for booking card
 */
export const BookingCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={24} variant="rounded" />
        <Skeleton width={80} height={32} variant="rounded" />
      </div>

      {/* Stylist Info */}
      <div className="flex items-center space-x-3">
        <Skeleton width={48} height={48} variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>

      {/* Service Details */}
      <div className="space-y-2">
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>

      {/* Date/Time */}
      <div className="flex items-center space-x-4">
        <Skeleton width={100} height={20} variant="rounded" />
        <Skeleton width={80} height={20} variant="rounded" />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Skeleton width="48%" height={40} variant="rounded" />
        <Skeleton width="48%" height={40} variant="rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for stylist profile card
 */
export const StylistCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Cover Image */}
      <Skeleton width="100%" height={160} variant="rectangular" />

      <div className="p-4 space-y-3">
        {/* Avatar overlapping cover */}
        <div className="-mt-12 mb-2">
          <Skeleton width={80} height={80} variant="circular" className="border-4 border-white" />
        </div>

        {/* Name */}
        <Skeleton width="70%" height={20} />

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <Skeleton width={100} height={16} />
          <Skeleton width={60} height={16} />
        </div>

        {/* Specialties */}
        <div className="flex space-x-2">
          <Skeleton width={70} height={24} variant="rounded" />
          <Skeleton width={80} height={24} variant="rounded" />
          <Skeleton width={60} height={24} variant="rounded" />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Skeleton width="100%" height={12} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="75%" height={12} />
        </div>

        {/* View Profile Button */}
        <Skeleton width="100%" height={44} variant="rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for service item
 */
export const ServiceItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height={18} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="30%" height={14} />
      </div>
      <div className="space-y-2">
        <Skeleton width={80} height={24} variant="rounded" />
        <Skeleton width={80} height={32} variant="rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for table row
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton width="80%" height={16} />
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton for full table
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <Skeleton width="60%" height={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Skeleton for comment/review
 */
export const CommentSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-3 p-4">
      <Skeleton width={40} height={40} variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton width="30%" height={16} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="60%" height={14} />
        <div className="flex space-x-2 mt-2">
          <Skeleton width={60} height={20} variant="rounded" />
          <Skeleton width={60} height={20} variant="rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for image gallery
 */
export const ImageGallerySkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} width="100%" height={200} variant="rounded" />
      ))}
    </div>
  );
};

/**
 * Skeleton for form
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="30%" height={16} />
          <Skeleton width="100%" height={44} variant="rounded" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton width="48%" height={44} variant="rounded" />
        <Skeleton width="48%" height={44} variant="rounded" />
      </div>
    </div>
  );
};

/**
 * Skeleton for stats/metrics card
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={32} />
      <Skeleton width="50%" height={12} />
    </div>
  );
};

/**
 * Skeleton for calendar
 */
export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={24} />
        <div className="flex space-x-2">
          <Skeleton width={32} height={32} variant="rounded" />
          <Skeleton width={32} height={32} variant="rounded" />
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} width="100%" height={20} />
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} width="100%" height={40} variant="rounded" />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton for notification item
 */
export const NotificationSkeleton: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton width={40} height={40} variant="circular" />
      <div className="flex-1 space-y-2">
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={14} />
        <Skeleton width="30%" height={12} />
      </div>
    </div>
  );
};

/**
 * Skeleton for chat message
 */
export const ChatMessageSkeleton: React.FC<{ align?: 'left' | 'right' }> = ({ align = 'left' }) => {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex items-end space-x-2 max-w-xs">
        {align === 'left' && <Skeleton width={32} height={32} variant="circular" />}
        <div className="space-y-1">
          <Skeleton width={200} height={60} variant="rounded" />
          <Skeleton width={80} height={12} />
        </div>
        {align === 'right' && <Skeleton width={32} height={32} variant="circular" />}
      </div>
    </div>
  );
};

/**
 * Skeleton for list with pagination
 */
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Skeleton width={48} height={48} variant="rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={14} />
          </div>
          <Skeleton width={24} height={24} variant="circular" />
        </div>
      ))}
      {/* Pagination */}
      <div className="flex justify-center space-x-2 pt-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} width={32} height={32} variant="rounded" />
        ))}
      </div>
    </div>
  );
};

// ==================== SHIMMER ANIMATION CSS ====================
// Add this to your global CSS or Tailwind config:
/*
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    to right,
    #f3f4f6 0%,
    #e5e7eb 20%,
    #f3f4f6 40%,
    #f3f4f6 100%
  );
  background-size: 1000px 100%;
}

.dark .animate-shimmer {
  background: linear-gradient(
    to right,
    #374151 0%,
    #4b5563 20%,
    #374151 40%,
    #374151 100%
  );
}
*/

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Booking list with skeleton
{isLoading ? (
  <>
    <BookingCardSkeleton />
    <BookingCardSkeleton />
    <BookingCardSkeleton />
  </>
) : (
  bookings.map(booking => <BookingCard key={booking.id} booking={booking} />)
)}

// Example 2: Stylist grid with skeleton
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StylistCardSkeleton />
    <StylistCardSkeleton />
    <StylistCardSkeleton />
  </div>
) : (
  <StylistGrid stylists={stylists} />
)}

// Example 3: Generic skeleton
{isLoading ? (
  <Skeleton width={200} height={40} variant="rounded" />
) : (
  <button>Click Me</button>
)}

// Example 4: Table loading
{isLoading ? (
  <TableSkeleton rows={10} columns={6} />
) : (
  <BookingTable data={bookings} />
)}
*/
