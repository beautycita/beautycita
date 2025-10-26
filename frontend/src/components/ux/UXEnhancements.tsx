/**
 * Progressive Disclosure, Loading States & Empty States - BeautyCita UX Enhancement
 * Complete UX enhancement utilities
 */

import React, { useState } from 'react';

// ==================== PROGRESSIVE DISCLOSURE ====================

/**
 * Accordion for showing/hiding content sections
 */
interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  defaultExpanded = false,
  icon,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 px-6 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Expandable section with "Show More" button
 */
interface ExpandableSectionProps {
  children: React.ReactNode;
  previewLines?: number;
  expandText?: string;
  collapseText?: string;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  children,
  previewLines = 3,
  expandText = 'Show more',
  collapseText = 'Show less',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <div
        className={`overflow-hidden transition-all ${
          !isExpanded ? `line-clamp-${previewLines}` : ''
        }`}
      >
        {children}
      </div>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {isExpanded ? collapseText : expandText}
      </button>
    </div>
  );
};

/**
 * Tabs for organizing content
 */
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTabContent}
      </div>
    </div>
  );
};

/**
 * Show more/less list
 */
interface ShowMoreListProps<T> {
  items: T[];
  initialCount?: number;
  increment?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  showMoreText?: string;
  showLessText?: string;
}

export function ShowMoreList<T>({
  items,
  initialCount = 5,
  increment = 5,
  renderItem,
  showMoreText = 'Show more',
  showLessText = 'Show less',
}: ShowMoreListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const hasMore = visibleCount < items.length;
  const canShowLess = visibleCount > initialCount;

  return (
    <div>
      <div className="space-y-2">
        {items.slice(0, visibleCount).map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>

      {(hasMore || canShowLess) && (
        <div className="mt-4 flex justify-center space-x-4">
          {hasMore && (
            <button
              onClick={() => setVisibleCount(prev => Math.min(prev + increment, items.length))}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showMoreText} ({items.length - visibleCount} more)
            </button>
          )}

          {canShowLess && (
            <button
              onClick={() => setVisibleCount(initialCount)}
              className="text-sm font-medium text-gray-600 hover:text-gray-700"
            >
              {showLessText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== LOADING STATES ====================

/**
 * Spinner loader
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Loading overlay
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
}) => {
  return (
    <div className="relative">
      {children}

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <Spinner size="lg" className="text-blue-600 mx-auto mb-4" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Progress bar
 */
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          )}
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Loading button
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={isLoading || disabled}
      className={`relative ${isLoading ? 'cursor-wait' : ''} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="flex items-center justify-center">
          <Spinner size="sm" className="mr-2" />
          {loadingText}
        </span>
      )}
      {!isLoading && children}
    </button>
  );
};

// ==================== EMPTY STATES ====================

/**
 * Generic empty state
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center justify-center space-x-3">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * No results state (for search/filter)
 */
interface NoResultsProps {
  searchQuery?: string;
  onClearFilters?: () => void;
}

export const NoResults: React.FC<NoResultsProps> = ({
  searchQuery,
  onClearFilters,
}) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find any results for "${searchQuery}". Try adjusting your search.`
          : "We couldn't find any results matching your filters."
      }
      action={
        onClearFilters
          ? { label: 'Clear filters', onClick: onClearFilters }
          : undefined
      }
    />
  );
};

/**
 * No bookings state
 */
export const NoBookings: React.FC<{ onCreateBooking: () => void }> = ({
  onCreateBooking,
}) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      title="No bookings yet"
      description="You haven't made any bookings yet. Find a stylist and book your first appointment!"
      action={{
        label: 'Book appointment',
        onClick: onCreateBooking,
      }}
    />
  );
};

/**
 * No notifications state
 */
export const NoNotifications: React.FC = () => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      }
      title="No notifications"
      description="You're all caught up! We'll notify you when something important happens."
    />
  );
};

/**
 * Error state
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content. Please try again.',
  onRetry,
}) => {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-500">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title={title}
      description={message}
      action={
        onRetry
          ? { label: 'Try again', onClick: onRetry }
          : undefined
      }
    />
  );
};

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Accordion for FAQs
<div>
  <AccordionItem title="How do I book an appointment?" defaultExpanded>
    <p>Simply browse stylists, select a service, and choose your preferred time.</p>
  </AccordionItem>
  <AccordionItem title="What's your cancellation policy?">
    <p>Free cancellation up to 24 hours before your appointment.</p>
  </AccordionItem>
</div>

// Example 2: Tabs for content organization
<Tabs
  tabs={[
    { id: 'upcoming', label: 'Upcoming', content: <UpcomingBookings />, badge: 3 },
    { id: 'past', label: 'Past', content: <PastBookings /> },
    { id: 'cancelled', label: 'Cancelled', content: <CancelledBookings /> },
  ]}
  onChange={(tabId) => console.log('Tab changed:', tabId)}
/>

// Example 3: Show more list
<ShowMoreList
  items={bookings}
  initialCount={5}
  renderItem={(booking, index) => (
    <BookingCard key={booking.id} booking={booking} />
  )}
/>

// Example 4: Loading overlay
<LoadingOverlay isLoading={isLoading} message="Fetching bookings...">
  <BookingList bookings={bookings} />
</LoadingOverlay>

// Example 5: Progress bar
<ProgressBar
  progress={75}
  label="Profile completion"
  color="green"
/>

// Example 6: Loading button
<LoadingButton
  isLoading={isSubmitting}
  loadingText="Creating booking..."
  onClick={handleSubmit}
>
  Book Appointment
</LoadingButton>

// Example 7: Empty state
{bookings.length === 0 ? (
  <NoBookings onCreateBooking={() => navigate('/book')} />
) : (
  <BookingList bookings={bookings} />
)}

// Example 8: Error state
{error ? (
  <ErrorState
    title="Failed to load bookings"
    message="We couldn't load your bookings. Please try again."
    onRetry={refetch}
  />
) : (
  <BookingList bookings={bookings} />
)}

// Example 9: No search results
{filteredResults.length === 0 ? (
  <NoResults
    searchQuery={searchQuery}
    onClearFilters={() => setFilters({})}
  />
) : (
  <ResultsList results={filteredResults} />
)}

// Example 10: Expandable section
<ExpandableSection previewLines={3}>
  <p>Long description text that will be truncated...</p>
</ExpandableSection>
*/

// ==================== CSS ANIMATIONS ====================
/*
Add to your global CSS:

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
*/
