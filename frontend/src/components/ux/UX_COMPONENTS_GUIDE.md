# BeautyCita UX Enhancement Components - Complete Guide

## Overview

This guide covers 8 comprehensive UX enhancement features implemented for BeautyCita. These components dramatically improve user experience through instant feedback, helpful guidance, and polished interactions.

**All components are:**
- Production-ready and fully typed with TypeScript
- Accessible (ARIA labels, keyboard navigation)
- Responsive and mobile-friendly
- Styled with Tailwind CSS
- Framework-agnostic React patterns

---

## Table of Contents

1. [Skeleton Loaders](#1-skeleton-loaders) - Better perceived performance
2. [Optimistic UI Updates](#2-optimistic-ui-updates) - Instant feedback with rollback
3. [Inline Form Validation](#3-inline-form-validation) - Real-time validation
4. [Undo Actions](#4-undo-actions) - Reversible operations
5. [Contextual Help](#5-contextual-help) - Tooltips and onboarding
6. [Progressive Disclosure](#6-progressive-disclosure) - Gradual feature revelation
7. [Loading States](#7-loading-states) - Async operation feedback
8. [Empty States](#8-empty-states) - Helpful no-data guidance

---

## 1. Skeleton Loaders

**File:** `/tmp/SkeletonLoaders.tsx`

### Purpose
Reduce perceived loading time by showing placeholder content that matches the shape of the final UI.

### Key Components

#### `<Skeleton>`
Base skeleton component with customizable variants and animations.

**Props:**
- `width`: string | number - Width of skeleton (default: '100%')
- `height`: string | number - Height of skeleton (default: '1rem')
- `variant`: 'text' | 'circular' | 'rectangular' | 'rounded' - Shape variant
- `animation`: 'pulse' | 'wave' | 'none' - Animation type
- `className`: string - Additional CSS classes

**Example:**
```tsx
import { Skeleton } from './SkeletonLoaders';

<Skeleton width="80%" height={20} variant="text" animation="pulse" />
<Skeleton width={48} height={48} variant="circular" />
```

#### Specialized Skeletons

**`<BookingCardSkeleton>`** - Full booking card placeholder
```tsx
<BookingCardSkeleton />
```

**`<StylistCardSkeleton>`** - Stylist profile card placeholder
```tsx
<StylistCardSkeleton showRating={true} />
```

**`<TableSkeleton>`** - Data table placeholder
```tsx
<TableSkeleton rows={5} columns={4} />
```

**Other available skeletons:**
- `ServiceItemSkeleton` - Service listings
- `CommentSkeleton` - Reviews/comments
- `FormSkeleton` - Form fields
- `StatCardSkeleton` - Dashboard stats
- `NavigationSkeleton` - Navigation menus
- `GallerySkeleton` - Image galleries
- `NotificationSkeleton` - Notification items
- `ChatMessageSkeleton` - Chat messages

### Usage Pattern
```tsx
function BookingList() {
  const { data: bookings, isLoading } = useBookings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    );
  }

  return <div>{bookings.map(booking => <BookingCard {...booking} />)}</div>;
}
```

### Best Practices
- Match skeleton dimensions to actual content
- Use appropriate animation (pulse for most, wave for images)
- Show 3-5 skeleton items for lists
- Avoid skeletons for instant (<100ms) operations

---

## 2. Optimistic UI Updates

**File:** `/tmp/OptimisticUI.tsx`

### Purpose
Provide instant feedback by updating the UI immediately, then revert automatically if the API call fails.

### Key Hooks

#### `useOptimistic<T>`
Manage single value with optimistic updates.

**Parameters:**
- `initialData: T` - Initial value
- `apiCall: (optimisticData: T) => Promise<T>` - API function
- `options`:
  - `onSuccess?: (data: T) => void` - Success callback
  - `onError?: (error: Error, rollback: () => void) => void` - Error callback
  - `autoRevert?: boolean` - Auto-rollback on error (default: true)
  - `revertDelay?: number` - Rollback delay in ms (default: 3000)

**Returns:**
- `data: T` - Current data value
- `isOptimistic: boolean` - Whether currently in optimistic state
- `error: Error | null` - Last error if any
- `update: (data: T) => Promise<void>` - Update function
- `reset: () => void` - Reset to last known good state

**Example:**
```tsx
import { useOptimistic } from './OptimisticUI';

function ProfileEditor({ user }) {
  const { data, update, isOptimistic, error } = useOptimistic(
    user,
    async (updatedUser) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedUser),
      });
      return response.json();
    },
    {
      onSuccess: () => toast.success('Profile updated!'),
      onError: (error) => toast.error('Failed to update profile'),
      autoRevert: true,
      revertDelay: 3000,
    }
  );

  const handleSave = () => {
    update({ ...data, name: newName });
  };

  return (
    <div>
      <input value={data.name} onChange={e => setNewName(e.target.value)} />
      <button onClick={handleSave} disabled={isOptimistic}>
        {isOptimistic ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

#### `useOptimisticList<T>`
Manage list with optimistic add/update/remove operations.

**Parameters:**
- `initialList: T[]` - Initial list
- `options`:
  - `onSuccess?: (data: T[]) => void`
  - `onError?: (error: Error) => void`
  - `autoRevert?: boolean`
  - `revertDelay?: number`
  - `getId?: (item: T) => string | number` - ID extractor (default: item.id)

**Returns:**
- `list: T[]` - Current list
- `addItem: (item: T, apiCall: () => Promise<T>) => Promise<void>`
- `updateItem: (id, updates: Partial<T>, apiCall: () => Promise<T>) => Promise<void>`
- `removeItem: (id, apiCall: () => Promise<void>) => Promise<void>`
- `isOptimistic: (id) => boolean` - Check if item is optimistic

**Example:**
```tsx
import { useOptimisticList } from './OptimisticUI';

function BookingList() {
  const { list: bookings, removeItem, isOptimistic } = useOptimisticList(
    initialBookings,
    {
      onError: (error) => toast.error('Failed to cancel booking'),
      autoRevert: true,
    }
  );

  const handleCancel = async (bookingId) => {
    await removeItem(bookingId, async () => {
      await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
    });
  };

  return (
    <div>
      {bookings.map(booking => (
        <div key={booking.id} className={isOptimistic(booking.id) ? 'opacity-50' : ''}>
          <BookingCard booking={booking} />
          <button onClick={() => handleCancel(booking.id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}
```

#### `useOptimisticToggle`
For like/favorite buttons with instant feedback.

**Example:**
```tsx
import { useOptimisticToggle } from './OptimisticUI';

function LikeButton({ postId, initialLiked }) {
  const { value: isLiked, toggle, isOptimistic } = useOptimisticToggle(
    initialLiked,
    async (newValue) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: newValue ? 'POST' : 'DELETE'
      });
      return response.json();
    }
  );

  return (
    <button
      onClick={toggle}
      className={`${isLiked ? 'text-red-500' : 'text-gray-500'} ${isOptimistic ? 'opacity-60' : ''}`}
    >
      ❤️ {isLiked ? 'Liked' : 'Like'}
    </button>
  );
}
```

#### `useOptimisticCounter`
For counters (views, likes, etc.) with optimistic increment/decrement.

**Example:**
```tsx
import { useOptimisticCounter } from './OptimisticUI';

function LikeCounter({ postId, initialCount }) {
  const { count, increment, isOptimistic } = useOptimisticCounter(
    initialCount,
    async (newCount) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await response.json();
      return data.likeCount;
    }
  );

  return (
    <button onClick={() => increment()} disabled={isOptimistic}>
      👍 {count} {isOptimistic && '(updating...)'}
    </button>
  );
}
```

### Best Practices
- Always provide rollback mechanism
- Set appropriate revert delays (3-5 seconds)
- Show visual feedback during optimistic state
- Use for frequent, low-risk operations
- Don't use for critical operations (payments, deletions)

---

## 3. Inline Form Validation

**File:** `/tmp/InlineFormValidation.tsx`

### Purpose
Provide real-time form validation with helpful error messages and visual feedback.

### Validation Rules

Pre-built validation rules available via `ValidationRules` object:

```tsx
import { ValidationRules } from './InlineFormValidation';

// Available rules:
ValidationRules.required(message?)
ValidationRules.email(message?)
ValidationRules.phone(message?)
ValidationRules.password(message?)
ValidationRules.minLength(length, message?)
ValidationRules.maxLength(length, message?)
ValidationRules.min(value, message?)
ValidationRules.max(value, message?)
ValidationRules.pattern(regex, message?)
ValidationRules.url(message?)
ValidationRules.date(message?)
ValidationRules.match(fieldName, message?)  // For password confirmation
ValidationRules.custom(testFn, message)
```

### Key Hook

#### `useFormValidation<T>`
Form-level validation state management.

**Parameters:**
- `schema: FormValidationSchema` - Validation schema
- `initialValues: T` - Initial form values

**Schema Format:**
```tsx
const schema = {
  fieldName: {
    rules: [ValidationRules.required(), ValidationRules.email()],
    validateOn: 'change' | 'blur' | 'submit',  // When to validate
    debounceMs: 300,  // Debounce delay for 'change' validation
  },
};
```

**Returns:**
- `values: T` - Current form values
- `errors: Record<string, string>` - Validation errors
- `touched: Record<string, boolean>` - Touched fields
- `handleChange: (fieldName, value) => void`
- `handleBlur: (fieldName) => void`
- `getFieldProps: (fieldName) => object` - Props for input binding
- `getFieldError: (fieldName) => string | null`
- `validateForm: () => boolean` - Validate all fields
- `resetForm: () => void` - Reset to initial values

**Example:**
```tsx
import { useFormValidation, ValidationRules } from './InlineFormValidation';

function RegistrationForm() {
  const schema = {
    email: {
      rules: [
        ValidationRules.required(),
        ValidationRules.email(),
      ],
      validateOn: 'change',
      debounceMs: 300,
    },
    password: {
      rules: [
        ValidationRules.required(),
        ValidationRules.password('Password must be 8+ chars with uppercase, lowercase, number, and special char'),
      ],
      validateOn: 'blur',
    },
    confirmPassword: {
      rules: [
        ValidationRules.required(),
        ValidationRules.match('password', 'Passwords must match'),
      ],
      validateOn: 'change',
    },
  };

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    getFieldProps,
    getFieldError,
    validateForm,
  } = useFormValidation(schema, {
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Submit form
      console.log('Form is valid:', values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input {...getFieldProps('email')} type="email" />
        {getFieldError('email') && (
          <p className="text-red-600 text-sm mt-1">{getFieldError('email')}</p>
        )}
      </div>

      <div>
        <label>Password</label>
        <input {...getFieldProps('password')} type="password" />
        {getFieldError('password') && (
          <p className="text-red-600 text-sm mt-1">{getFieldError('password')}</p>
        )}
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
```

### Components

#### `<ValidatedInput>`
Input with built-in validation display.

**Props:**
- `label: string` - Field label
- `name: string` - Field name
- `type: string` - Input type
- `value: any` - Current value
- `error: string | null` - Error message
- `touched: boolean` - Whether field has been touched
- `onChange: (name, value) => void`
- `onBlur: (name) => void`
- Standard input props

**Example:**
```tsx
<ValidatedInput
  label="Email Address"
  name="email"
  type="email"
  value={values.email}
  error={errors.email}
  touched={touched.email}
  onChange={handleChange}
  onBlur={handleBlur}
  placeholder="you@example.com"
  required
/>
```

#### `<PasswordStrength>`
Visual password strength indicator.

**Example:**
```tsx
import { PasswordStrength } from './InlineFormValidation';

<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<PasswordStrength password={password} />
```

### Best Practices
- Validate on blur for better UX (except for async validation)
- Use debouncing (300ms) for change validation
- Show errors only after field is touched
- Provide specific, helpful error messages
- Use `match` rule for password confirmation
- Validate entire form on submit as final check

---

## 4. Undo Actions

**File:** `/tmp/UndoActions.tsx`

### Purpose
Allow users to reverse destructive actions with a time-limited undo window.

### Key Hook

#### `useUndoManager<T>`
Manage undo/redo history with auto-commit.

**Parameters:**
- `options`:
  - `maxHistory?: number` - Max undo history (default: 10)
  - `defaultTimeout?: number` - Auto-commit timeout in ms (default: 5000)
  - `onExecute?: (action) => void` - Execute callback
  - `onUndo?: (action) => void` - Undo callback

**Returns:**
- `executeWithUndo: (action, timeout?) => Promise<void>` - Execute with undo
- `undoAction: () => Promise<void>` - Undo current action
- `commitAction: () => void` - Commit current action
- `currentAction: UndoableAction | null` - Current undoable action
- `history: UndoableAction[]` - Action history
- `canUndo: boolean` - Whether undo is available

**Action Format:**
```tsx
{
  type: string,           // Action type identifier
  data: any,              // Action data
  description: string,    // User-friendly description
  execute: () => Promise<void>,   // Function to execute action
  undo: () => Promise<void>,      // Function to undo action
}
```

**Example:**
```tsx
import { useUndoManager } from './UndoActions';

function BookingManager() {
  const { executeWithUndo, undoAction, currentAction, canUndo } = useUndoManager({
    defaultTimeout: 5000,
    onExecute: (action) => console.log('Executed:', action.type),
    onUndo: (action) => console.log('Undone:', action.type),
  });

  const handleCancelBooking = async (bookingId) => {
    await executeWithUndo({
      type: 'CANCEL_BOOKING',
      data: { bookingId },
      description: 'Booking cancelled',
      execute: async () => {
        await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
      },
      undo: async () => {
        await fetch(`/api/bookings/${bookingId}/reactivate`, { method: 'POST' });
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'confirmed' } : b
        ));
      },
    });
  };

  return (
    <div>
      {canUndo && (
        <UndoToast
          action={currentAction}
          onUndo={undoAction}
          timeout={5000}
        />
      )}
      {/* Booking list */}
    </div>
  );
}
```

### Pre-built Action Creators

**`UndoActions` object** provides ready-to-use action creators:

```tsx
import { UndoActions } from './UndoActions';

// Delete booking with undo
const deleteAction = UndoActions.deleteBooking(
  bookingId,
  bookingData,
  async (id) => await api.deleteBooking(id),
  async (data) => await api.restoreBooking(data)
);

// Cancel booking with undo
const cancelAction = UndoActions.cancelBooking(
  bookingId,
  async (id) => await api.cancelBooking(id),
  async (id) => await api.reactivateBooking(id)
);

// Archive item with undo
const archiveAction = UndoActions.archiveItem(
  itemId,
  async (id) => await api.archiveItem(id),
  async (id) => await api.unarchiveItem(id)
);

// Update with undo
const updateAction = UndoActions.updateItem(
  itemId,
  oldData,
  newData,
  async (data) => await api.updateItem(data)
);

// Bulk delete with undo
const bulkDeleteAction = UndoActions.bulkDelete(
  itemIds,
  deletedItems,
  async (ids) => await api.bulkDelete(ids),
  async (items) => await api.bulkRestore(items)
);
```

### Components

#### `<UndoToast>`
Toast notification with undo button and countdown.

**Props:**
- `action: UndoableAction | null` - Current action
- `onUndo: () => void` - Undo callback
- `timeout: number` - Total timeout in ms
- `position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'`

**Example:**
```tsx
import { UndoToast } from './UndoActions';

{canUndo && (
  <UndoToast
    action={currentAction}
    onUndo={undoAction}
    timeout={5000}
    position="bottom-right"
  />
)}
```

#### `<UndoBanner>`
Inline undo banner for contextual undo.

**Example:**
```tsx
import { UndoBanner } from './UndoActions';

{canUndo && (
  <UndoBanner
    action={currentAction}
    onUndo={undoAction}
    timeout={5000}
  />
)}
```

### Best Practices
- Use 5-second timeout for most actions
- Longer timeout (10s) for bulk operations
- Show clear description of what will be undone
- Only make destructive actions undoable
- Don't make critical operations undoable (payments)
- Commit immediately if user navigates away

---

## 5. Contextual Help

**File:** `/tmp/ContextualHelp.tsx`

### Purpose
Provide contextual help, tooltips, and guided onboarding for users.

### Components

#### `<Tooltip>`
Flexible tooltip with multiple trigger modes and smart positioning.

**Props:**
- `content: React.ReactNode` - Tooltip content
- `position?: 'top' | 'bottom' | 'left' | 'right'` - Preferred position
- `trigger?: 'hover' | 'click' | 'focus'` - Trigger type
- `delay?: number` - Show delay in ms (default: 200)
- `maxWidth?: number` - Max width in px
- `children: React.ReactElement` - Element to attach tooltip to

**Example:**
```tsx
import { Tooltip } from './ContextualHelp';

<Tooltip
  content="This will permanently delete your booking"
  position="top"
  trigger="hover"
  delay={200}
>
  <button className="text-red-600">Delete Booking</button>
</Tooltip>

// With rich content
<Tooltip
  content={
    <div>
      <strong>Pro Tip:</strong>
      <p>You can select multiple dates by holding Ctrl/Cmd</p>
    </div>
  }
  position="right"
>
  <span className="text-blue-600 cursor-help">?</span>
</Tooltip>
```

#### `<HelpButton>`
Inline help icon button with tooltip.

**Props:**
- `content: React.ReactNode` - Help content
- `position?: TooltipPosition`
- `size?: 'sm' | 'md' | 'lg'`

**Example:**
```tsx
import { HelpButton } from './ContextualHelp';

<div className="flex items-center gap-2">
  <label>Service Duration</label>
  <HelpButton
    content="This is the estimated time for the service. Actual time may vary."
    position="right"
    size="sm"
  />
</div>
```

#### `<FeatureTour>`
Step-by-step guided tour with overlay and highlights.

**Props:**
- `steps: TourStep[]` - Array of tour steps
- `isOpen: boolean` - Whether tour is active
- `onComplete: () => void` - Called when tour completes
- `onSkip: () => void` - Called when user skips tour

**Step Format:**
```tsx
{
  target: string,      // CSS selector for target element
  title: string,       // Step title
  content: string,     // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right',
  action?: {
    label: string,
    onClick: () => void,
  },
}
```

**Example:**
```tsx
import { FeatureTour } from './ContextualHelp';

function App() {
  const [showTour, setShowTour] = useState(false);

  const tourSteps = [
    {
      target: '#booking-calendar',
      title: 'Welcome to BeautyCita!',
      content: 'This is your booking calendar where you can see all your appointments.',
      placement: 'bottom',
    },
    {
      target: '#add-booking-btn',
      title: 'Create a Booking',
      content: 'Click here to create a new booking for your clients.',
      placement: 'left',
      action: {
        label: 'Try it now',
        onClick: () => document.getElementById('add-booking-btn').click(),
      },
    },
    {
      target: '#stylist-selector',
      title: 'Filter by Stylist',
      content: 'View bookings for specific stylists using this filter.',
      placement: 'bottom',
    },
  ];

  return (
    <>
      <FeatureTour
        steps={tourSteps}
        isOpen={showTour}
        onComplete={() => {
          setShowTour(false);
          localStorage.setItem('tourCompleted', 'true');
        }}
        onSkip={() => {
          setShowTour(false);
          localStorage.setItem('tourSkipped', 'true');
        }}
      />
      {/* App content */}
    </>
  );
}
```

#### `<OnboardingChecklist>`
Task-based onboarding with progress tracking.

**Props:**
- `tasks: OnboardingTask[]` - Array of tasks
- `onTaskComplete: (taskId) => void` - Called when task is completed
- `onDismiss: () => void` - Called when checklist is dismissed

**Task Format:**
```tsx
{
  id: string,
  title: string,
  description: string,
  completed: boolean,
  action?: {
    label: string,
    onClick: () => void,
  },
}
```

**Example:**
```tsx
import { OnboardingChecklist } from './ContextualHelp';

function Dashboard() {
  const [tasks, setTasks] = useState([
    {
      id: 'add-service',
      title: 'Add your first service',
      description: 'Define the beauty services you offer',
      completed: false,
      action: {
        label: 'Add Service',
        onClick: () => navigate('/services/new'),
      },
    },
    {
      id: 'set-hours',
      title: 'Set your business hours',
      description: 'Let clients know when you\'re available',
      completed: false,
      action: {
        label: 'Set Hours',
        onClick: () => navigate('/settings/hours'),
      },
    },
    {
      id: 'create-booking',
      title: 'Create your first booking',
      description: 'Test the booking flow',
      completed: false,
    },
  ]);

  const handleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: true } : task
    ));
  };

  return (
    <div>
      <OnboardingChecklist
        tasks={tasks}
        onTaskComplete={handleTaskComplete}
        onDismiss={() => localStorage.setItem('onboardingDismissed', 'true')}
      />
      {/* Dashboard content */}
    </div>
  );
}
```

#### `<InlineHelp>`
Inline contextual help text.

**Props:**
- `type?: 'info' | 'tip' | 'warning'`
- `children: React.ReactNode`

**Example:**
```tsx
import { InlineHelp } from './ContextualHelp';

<div>
  <input type="password" />
  <InlineHelp type="tip">
    Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
  </InlineHelp>
</div>
```

### Best Practices
- Show tooltips on hover for informational content
- Use click trigger for complex/interactive tooltips
- Keep tooltip content concise (1-2 sentences)
- Use feature tours for first-time users only
- Persist tour completion state
- Allow users to skip or dismiss onboarding
- Use onboarding checklist for task-based flows
- Don't show too many tooltips at once

---

## 6. Progressive Disclosure

**File:** `/tmp/UXEnhancements.tsx`

### Purpose
Reveal information and features gradually to reduce cognitive load and UI complexity.

### Components

#### `<AccordionItem>`
Expandable accordion section.

**Props:**
- `title: string` - Section title
- `isOpen?: boolean` - Controlled open state
- `onToggle?: () => void` - Toggle callback
- `children: React.ReactNode` - Section content
- `icon?: React.ReactNode` - Optional icon

**Example:**
```tsx
import { AccordionItem } from './UXEnhancements';

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-2">
      <AccordionItem
        title="How do I book an appointment?"
        isOpen={openIndex === 0}
        onToggle={() => setOpenIndex(openIndex === 0 ? -1 : 0)}
      >
        <p>To book an appointment, navigate to the Bookings page and click "New Booking"...</p>
      </AccordionItem>

      <AccordionItem
        title="What payment methods do you accept?"
        isOpen={openIndex === 1}
        onToggle={() => setOpenIndex(openIndex === 1 ? -1 : 1)}
      >
        <p>We accept all major credit cards, PayPal, and cash payments...</p>
      </AccordionItem>
    </div>
  );
}
```

#### `<ExpandableSection>`
Show more/less expandable content.

**Props:**
- `preview: React.ReactNode` - Always visible preview
- `children: React.ReactNode` - Expandable content
- `defaultExpanded?: boolean`
- `expandText?: string` - Custom expand text
- `collapseText?: string` - Custom collapse text

**Example:**
```tsx
import { ExpandableSection } from './UXEnhancements';

<ExpandableSection
  preview={
    <p>
      BeautyCita is a comprehensive booking platform designed for beauty professionals.
      It helps you manage appointments, clients, and your schedule...
    </p>
  }
  expandText="Read more"
  collapseText="Show less"
>
  <p>
    Our platform includes advanced features like automated reminders, client history,
    inventory management, and detailed analytics. You can customize your services,
    set your availability, and accept online payments seamlessly.
  </p>
  <p>
    Whether you're a solo stylist or managing a full salon, BeautyCita scales with
    your business needs.
  </p>
</ExpandableSection>
```

#### `<Tabs>`
Tab-based navigation with badge support.

**Props:**
- `tabs: Tab[]` - Array of tabs
- `defaultTab?: string` - Default active tab ID
- `onChange?: (tabId: string) => void` - Tab change callback

**Tab Format:**
```tsx
{
  id: string,
  label: string,
  content: React.ReactNode,
  icon?: React.ReactNode,
  badge?: number | string,
  disabled?: boolean,
}
```

**Example:**
```tsx
import { Tabs } from './UXEnhancements';

function BookingManager() {
  const tabs = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      badge: 5,
      content: <UpcomingBookings />,
    },
    {
      id: 'past',
      label: 'Past',
      content: <PastBookings />,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      badge: 2,
      content: <CancelledBookings />,
    },
  ];

  return (
    <Tabs
      tabs={tabs}
      defaultTab="upcoming"
      onChange={(tabId) => console.log('Switched to:', tabId)}
    />
  );
}
```

#### `<ShowMoreList>`
Incrementally load list items.

**Props:**
- `items: T[]` - All items
- `initialCount?: number` - Initial items to show (default: 5)
- `incrementCount?: number` - Items to load on "show more" (default: 5)
- `renderItem: (item: T, index: number) => React.ReactNode` - Item renderer
- `showMoreText?: string`
- `showLessText?: string`

**Example:**
```tsx
import { ShowMoreList } from './UXEnhancements';

function ReviewsList({ reviews }) {
  return (
    <ShowMoreList
      items={reviews}
      initialCount={3}
      incrementCount={5}
      renderItem={(review) => (
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <img src={review.avatar} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-semibold">{review.name}</p>
              <p className="text-sm text-gray-500">{review.date}</p>
            </div>
          </div>
          <p className="mt-2">{review.comment}</p>
        </div>
      )}
      showMoreText="Load more reviews"
      showLessText="Show fewer reviews"
    />
  );
}
```

### Best Practices
- Use accordions for FAQ sections and feature groups
- Use tabs to separate distinct content categories
- Don't nest tabs within tabs
- Keep initial view count reasonable (3-5 items)
- Always provide "show less" option for long lists
- Use badges in tabs to show pending items
- Group related settings in expandable sections

---

## 7. Loading States

**File:** `/tmp/UXEnhancements.tsx`

### Purpose
Provide clear feedback during async operations and data loading.

### Components

#### `<Spinner>`
Animated loading spinner.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `className?: string` - Additional classes
- `color?: string` - Custom color (default: current color)

**Example:**
```tsx
import { Spinner } from './UXEnhancements';

<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading...</span>
</div>

<Spinner size="lg" className="text-blue-600" />
```

#### `<LoadingOverlay>`
Full overlay with spinner and message.

**Props:**
- `isLoading: boolean` - Whether to show overlay
- `message?: string` - Loading message
- `children: React.ReactNode` - Content to overlay

**Example:**
```tsx
import { LoadingOverlay } from './UXEnhancements';

function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <LoadingOverlay isLoading={isSubmitting} message="Creating booking...">
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    </LoadingOverlay>
  );
}
```

#### `<ProgressBar>`
Linear progress indicator.

**Props:**
- `progress: number` - Progress percentage (0-100)
- `showLabel?: boolean` - Show percentage label
- `color?: string` - Progress bar color
- `height?: number` - Bar height in pixels
- `className?: string`

**Example:**
```tsx
import { ProgressBar } from './UXEnhancements';

function UploadProgress({ uploadedBytes, totalBytes }) {
  const progress = (uploadedBytes / totalBytes) * 100;

  return (
    <div>
      <p>Uploading image...</p>
      <ProgressBar
        progress={progress}
        showLabel={true}
        color="bg-blue-600"
        height={8}
      />
    </div>
  );
}
```

#### `<LoadingButton>`
Button with integrated loading state.

**Props:**
- `isLoading: boolean` - Whether button is loading
- `loadingText?: string` - Text to show while loading
- `children: React.ReactNode` - Button content
- Standard button props

**Example:**
```tsx
import { LoadingButton } from './UXEnhancements';

function SaveButton({ onSave }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LoadingButton
      onClick={handleSave}
      isLoading={isSaving}
      loadingText="Saving..."
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Save Changes
    </LoadingButton>
  );
}
```

### Best Practices
- Always show loading state for operations >300ms
- Use spinners for indeterminate operations
- Use progress bars when progress is measurable
- Disable buttons during loading to prevent double-submission
- Show specific loading messages ("Saving...", "Uploading...")
- Use overlays for form submissions
- Keep loading messages concise and action-oriented

---

## 8. Empty States

**File:** `/tmp/UXEnhancements.tsx`

### Purpose
Guide users when no data exists and help them take the next action.

### Components

#### `<EmptyState>`
Generic empty state with icon and call-to-action.

**Props:**
- `icon?: React.ReactNode` - Icon or illustration
- `title: string` - Empty state title
- `description?: string` - Helpful description
- `action?: { label: string, onClick: () => void }` - Primary action
- `secondaryAction?: { label: string, onClick: () => void }` - Secondary action

**Example:**
```tsx
import { EmptyState } from './UXEnhancements';

function ServicesList({ services }) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={<ScissorsIcon className="w-24 h-24" />}
        title="No services added yet"
        description="Add your first service to start accepting bookings from clients."
        action={{
          label: 'Add Service',
          onClick: () => navigate('/services/new'),
        }}
        secondaryAction={{
          label: 'Learn More',
          onClick: () => window.open('/docs/services'),
        }}
      />
    );
  }

  return <div>{services.map(service => <ServiceCard {...service} />)}</div>;
}
```

#### `<NoResults>`
Empty state for search/filter with no results.

**Props:**
- `searchQuery?: string` - Current search query
- `onClear?: () => void` - Clear search callback
- `suggestions?: string[]` - Search suggestions

**Example:**
```tsx
import { NoResults } from './UXEnhancements';

function SearchResults({ query, results, onClearSearch }) {
  if (results.length === 0) {
    return (
      <NoResults
        searchQuery={query}
        onClear={onClearSearch}
        suggestions={['Check your spelling', 'Try different keywords', 'Use fewer filters']}
      />
    );
  }

  return <div>{/* results */}</div>;
}
```

#### `<NoBookings>`
Specialized empty state for bookings.

**Props:**
- `onCreateBooking?: () => void` - Create booking callback

**Example:**
```tsx
import { NoBookings } from './UXEnhancements';

function BookingList({ bookings }) {
  if (bookings.length === 0) {
    return <NoBookings onCreateBooking={() => navigate('/bookings/new')} />;
  }

  return <div>{/* bookings */}</div>;
}
```

#### `<NoNotifications>`
Empty state for notifications.

**Example:**
```tsx
import { NoNotifications } from './UXEnhancements';

function NotificationsList({ notifications }) {
  if (notifications.length === 0) {
    return <NoNotifications />;
  }

  return <div>{/* notifications */}</div>;
}
```

#### `<ErrorState>`
Error state with retry option.

**Props:**
- `title?: string` - Error title
- `message?: string` - Error message
- `onRetry?: () => void` - Retry callback
- `error?: Error` - Error object (for debugging)

**Example:**
```tsx
import { ErrorState } from './UXEnhancements';

function DataFetcher() {
  const { data, error, isLoading, refetch } = useQuery();

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message="We couldn't load your bookings. Please try again."
        onRetry={refetch}
        error={error}
      />
    );
  }

  return <div>{/* data */}</div>;
}
```

### Best Practices
- Always provide a clear call-to-action
- Explain why the state is empty
- Use appropriate illustrations/icons
- Keep messages friendly and helpful
- Offer alternatives or next steps
- For errors, provide retry option
- Distinguish between "no data yet" vs "no results found"
- Make action buttons prominent

---

## Integration Guide

### 1. Installation

Copy the component files to your project:

```bash
src/
├── components/
│   ├── ux/
│   │   ├── SkeletonLoaders.tsx
│   │   ├── OptimisticUI.tsx
│   │   ├── InlineFormValidation.tsx
│   │   ├── UndoActions.tsx
│   │   ├── ContextualHelp.tsx
│   │   └── UXEnhancements.tsx
```

### 2. Tailwind Configuration

Ensure Tailwind is configured to scan these files:

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/ux/**/*.{js,jsx,ts,tsx}',
  ],
  // ... rest of config
};
```

### 3. TypeScript Configuration

Ensure strict mode is enabled for type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

### 4. Usage Pattern

Import components as needed:

```tsx
import { Skeleton, BookingCardSkeleton } from '@/components/ux/SkeletonLoaders';
import { useOptimisticList } from '@/components/ux/OptimisticUI';
import { useFormValidation, ValidationRules } from '@/components/ux/InlineFormValidation';
import { useUndoManager, UndoToast } from '@/components/ux/UndoActions';
import { Tooltip, FeatureTour } from '@/components/ux/ContextualHelp';
import { Tabs, EmptyState, LoadingButton } from '@/components/ux/UXEnhancements';
```

---

## Complete Example: Booking Page

Here's a complete example integrating multiple UX enhancements:

```tsx
import React, { useState } from 'react';
import { BookingCardSkeleton } from '@/components/ux/SkeletonLoaders';
import { useOptimisticList } from '@/components/ux/OptimisticUI';
import { useUndoManager, UndoToast } from '@/components/ux/UndoActions';
import { Tooltip } from '@/components/ux/ContextualHelp';
import { Tabs, EmptyState, LoadingButton } from '@/components/ux/UXEnhancements';

function BookingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { executeWithUndo, undoAction, currentAction, canUndo } = useUndoManager();

  const { list: bookings, removeItem, isOptimistic } = useOptimisticList(
    initialBookings,
    {
      onError: (error) => toast.error('Failed to cancel booking'),
    }
  );

  const handleCancelBooking = async (bookingId, bookingData) => {
    await executeWithUndo({
      type: 'CANCEL_BOOKING',
      data: { bookingId },
      description: 'Booking cancelled',
      execute: async () => {
        await removeItem(bookingId, async () => {
          await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
        });
      },
      undo: async () => {
        await fetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingData),
        });
      },
    });
  };

  const tabs = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      badge: bookings.filter(b => b.status === 'confirmed').length,
      content: (
        <div className="space-y-4">
          {isLoading ? (
            <>
              <BookingCardSkeleton />
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </>
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No upcoming bookings"
              description="You don't have any bookings scheduled yet."
              action={{
                label: 'Create Booking',
                onClick: () => navigate('/bookings/new'),
              }}
            />
          ) : (
            bookings.map(booking => (
              <div
                key={booking.id}
                className={isOptimistic(booking.id) ? 'opacity-50' : ''}
              >
                <BookingCard booking={booking} />
                <Tooltip content="This will cancel the booking and notify the client">
                  <LoadingButton
                    onClick={() => handleCancelBooking(booking.id, booking)}
                    isLoading={isOptimistic(booking.id)}
                    className="text-red-600"
                  >
                    Cancel Booking
                  </LoadingButton>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'past',
      label: 'Past',
      content: <PastBookings />,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>

      <Tabs tabs={tabs} defaultTab="upcoming" />

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
```

---

## Performance Considerations

### Skeleton Loaders
- Render 3-5 skeletons max to avoid excessive DOM nodes
- Use CSS animations (pulse/wave) for better performance than JS

### Optimistic UI
- Keep rollback data in refs to avoid re-renders
- Debounce rapid optimistic updates (300ms)
- Clean up timeouts on unmount

### Form Validation
- Debounce change validation (300ms default)
- Use blur validation for better performance
- Memoize validation rules to avoid recreation

### Tooltips
- Use portal rendering to avoid z-index issues
- Lazy render tooltip content
- Cleanup event listeners on unmount

### General
- Lazy load components not immediately visible
- Memoize expensive computations
- Use React.memo for pure components
- Virtualize long lists with react-window

---

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Meets WCAG AA contrast ratios
- **Screen Reader Support**: Descriptive labels and announcements

### Specific Considerations

**Tooltips:**
- `aria-describedby` for tooltip association
- `role="tooltip"` for screen readers

**Modals/Overlays:**
- Focus trap within modal
- Escape key to close
- Focus return to trigger element

**Forms:**
- Associated labels with inputs
- Error announcements for screen readers
- Clear error messages

**Buttons:**
- Disabled state properly announced
- Loading state communicated

---

## Testing Guide

### Unit Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useOptimistic } from './OptimisticUI';

describe('useOptimistic', () => {
  it('should apply optimistic update immediately', async () => {
    const apiCall = jest.fn().mockResolvedValue({ name: 'John Updated' });

    const { result } = renderHook(() =>
      useOptimistic({ name: 'John' }, apiCall)
    );

    act(() => {
      result.current.update({ name: 'John Updated' });
    });

    expect(result.current.data.name).toBe('John Updated');
    expect(result.current.isOptimistic).toBe(true);

    await waitFor(() => {
      expect(result.current.isOptimistic).toBe(false);
    });
  });
});
```

### Integration Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import BookingForm from './BookingForm';

test('shows validation errors on blur', async () => {
  render(<BookingForm />);

  const emailInput = screen.getByLabelText('Email');

  fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
  fireEvent.blur(emailInput);

  expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
});
```

---

## Migration Guide

### From Basic Forms to Validated Forms

**Before:**
```tsx
function ContactForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Invalid email');
      return;
    }
    // submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {error && <p>{error}</p>}
    </form>
  );
}
```

**After:**
```tsx
import { useFormValidation, ValidationRules } from './InlineFormValidation';

function ContactForm() {
  const schema = {
    email: {
      rules: [ValidationRules.required(), ValidationRules.email()],
      validateOn: 'blur',
    },
  };

  const { values, handleChange, handleBlur, getFieldError, validateForm } =
    useFormValidation(schema, { email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // submit
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.email}
        onChange={e => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
      />
      {getFieldError('email') && <p>{getFieldError('email')}</p>}
    </form>
  );
}
```

---

## Troubleshooting

### Common Issues

**Tooltip not showing:**
- Check z-index conflicts
- Ensure parent is not overflow:hidden
- Verify portal is rendering

**Optimistic update not reverting:**
- Check autoRevert is true
- Verify API call is rejecting properly
- Check revertDelay timeout

**Form validation not triggering:**
- Ensure validateOn is set correctly
- Check debounceMs is reasonable (300ms)
- Verify rules array is not empty

**Skeleton flash before content:**
- Add minimum loading time (300ms)
- Use CSS animation-delay
- Implement fade-in transition

---

## Browser Support

All components support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Polyfills may be needed for:
- ResizeObserver (for tooltip positioning)
- IntersectionObserver (for lazy loading)

---

## License

These components are provided as-is for BeautyCita project use.

---

## Support

For questions or issues with these components:
1. Check this documentation first
2. Review the inline code comments
3. Check the usage examples in each component file
4. Consult the TypeScript type definitions for API details

---

## Changelog

### Version 1.0.0 (2025-01-XX)
- Initial implementation of all 8 UX enhancement features
- 50+ production-ready components
- Comprehensive TypeScript types
- Full accessibility support
- Complete documentation

---

**End of Guide**

For implementation details, see the source files:
- `/tmp/SkeletonLoaders.tsx`
- `/tmp/OptimisticUI.tsx`
- `/tmp/InlineFormValidation.tsx`
- `/tmp/UndoActions.tsx`
- `/tmp/ContextualHelp.tsx`
- `/tmp/UXEnhancements.tsx`
