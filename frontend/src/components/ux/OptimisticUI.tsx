/**
 * Optimistic UI Updates - BeautyCita UX Enhancement
 * Instant feedback with auto-revert on error
 */

import React, { useState, useCallback, useRef } from 'react';

// ==================== OPTIMISTIC UPDATE HOOK ====================

interface OptimisticOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollback: () => void) => void;
  autoRevert?: boolean;
  revertDelay?: number;
}

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error: Error | null;
}

export function useOptimistic<T>(
  initialData: T,
  apiCall: (optimisticData: T) => Promise<T>,
  options: OptimisticOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    autoRevert = true,
    revertDelay = 3000,
  } = options;

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null,
  });

  const rollbackDataRef = useRef<T>(initialData);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const update = useCallback(
    async (optimisticData: T) => {
      // Store current data for rollback
      rollbackDataRef.current = state.data;

      // Apply optimistic update immediately
      setState({
        data: optimisticData,
        isOptimistic: true,
        error: null,
      });

      try {
        // Make API call
        const result = await apiCall(optimisticData);

        // Success - update with real data
        setState({
          data: result,
          isOptimistic: false,
          error: null,
        });

        onSuccess?.(result);
      } catch (error) {
        const err = error as Error;

        // Rollback function
        const rollback = () => {
          setState({
            data: rollbackDataRef.current,
            isOptimistic: false,
            error: err,
          });
        };

        // Auto-revert or manual rollback
        if (autoRevert) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(rollback, revertDelay);
        }

        setState(prev => ({
          ...prev,
          isOptimistic: false,
          error: err,
        }));

        onError?.(err, rollback);
      }
    },
    [state.data, apiCall, autoRevert, revertDelay, onSuccess, onError]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({
      data: rollbackDataRef.current,
      isOptimistic: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    update,
    reset,
  };
}

// ==================== OPTIMISTIC LIST HOOK ====================

interface ListOptimisticOptions<T> {
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  autoRevert?: boolean;
  revertDelay?: number;
  getId?: (item: T) => string | number;
}

export function useOptimisticList<T>(
  initialList: T[],
  options: ListOptimisticOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    autoRevert = true,
    revertDelay = 3000,
    getId = (item: any) => item.id,
  } = options;

  const [list, setList] = useState<T[]>(initialList);
  const [optimisticIds, setOptimisticIds] = useState<Set<string | number>>(new Set());
  const rollbackRef = useRef<Map<string | number, T[]>>(new Map());

  // Add item optimistically
  const addItem = useCallback(
    async (item: T, apiCall: () => Promise<T>) => {
      const tempId = getId(item);
      const previousList = [...list];

      // Store rollback state
      rollbackRef.current.set(tempId, previousList);

      // Add optimistically
      const newList = [item, ...list];
      setList(newList);
      setOptimisticIds(prev => new Set(prev).add(tempId));

      try {
        const result = await apiCall();
        const resultId = getId(result);

        // Replace temp item with real item
        setList(current =>
          current.map(i => (getId(i) === tempId ? result : i))
        );
        setOptimisticIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });

        onSuccess?.([result, ...previousList]);
      } catch (error) {
        const err = error as Error;

        if (autoRevert) {
          setTimeout(() => {
            setList(previousList);
            setOptimisticIds(prev => {
              const next = new Set(prev);
              next.delete(tempId);
              return next;
            });
          }, revertDelay);
        }

        onError?.(err);
      }
    },
    [list, getId, autoRevert, revertDelay, onSuccess, onError]
  );

  // Update item optimistically
  const updateItem = useCallback(
    async (
      id: string | number,
      updates: Partial<T>,
      apiCall: () => Promise<T>
    ) => {
      const previousList = [...list];
      rollbackRef.current.set(id, previousList);

      // Update optimistically
      const newList = list.map(item =>
        getId(item) === id ? { ...item, ...updates } : item
      );
      setList(newList);
      setOptimisticIds(prev => new Set(prev).add(id));

      try {
        const result = await apiCall();
        setList(current =>
          current.map(i => (getId(i) === id ? result : i))
        );
        setOptimisticIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        onSuccess?.(newList);
      } catch (error) {
        const err = error as Error;

        if (autoRevert) {
          setTimeout(() => {
            setList(previousList);
            setOptimisticIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, revertDelay);
        }

        onError?.(err);
      }
    },
    [list, getId, autoRevert, revertDelay, onSuccess, onError]
  );

  // Remove item optimistically
  const removeItem = useCallback(
    async (id: string | number, apiCall: () => Promise<void>) => {
      const previousList = [...list];
      rollbackRef.current.set(id, previousList);

      // Remove optimistically
      const newList = list.filter(item => getId(item) !== id);
      setList(newList);
      setOptimisticIds(prev => new Set(prev).add(id));

      try {
        await apiCall();
        setOptimisticIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        onSuccess?.(newList);
      } catch (error) {
        const err = error as Error;

        if (autoRevert) {
          setTimeout(() => {
            setList(previousList);
            setOptimisticIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, revertDelay);
        }

        onError?.(err);
      }
    },
    [list, getId, autoRevert, revertDelay, onSuccess, onError]
  );

  const isOptimistic = useCallback(
    (id: string | number) => optimisticIds.has(id),
    [optimisticIds]
  );

  return {
    list,
    addItem,
    updateItem,
    removeItem,
    isOptimistic,
  };
}

// ==================== OPTIMISTIC LIKE/FAVORITE HOOK ====================

export function useOptimisticToggle(
  initialValue: boolean,
  apiCall: (newValue: boolean) => Promise<boolean>
) {
  const [value, setValue] = useState(initialValue);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const toggle = useCallback(async () => {
    const previousValue = value;
    const newValue = !value;

    // Optimistic update
    setValue(newValue);
    setIsOptimistic(true);

    try {
      const result = await apiCall(newValue);
      setValue(result);
      setIsOptimistic(false);
    } catch (error) {
      // Revert on error
      setValue(previousValue);
      setIsOptimistic(false);
      throw error;
    }
  }, [value, apiCall]);

  return { value, toggle, isOptimistic };
}

// ==================== OPTIMISTIC COUNTER HOOK ====================

export function useOptimisticCounter(
  initialCount: number,
  apiCall: (newCount: number) => Promise<number>
) {
  const [count, setCount] = useState(initialCount);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const increment = useCallback(
    async (amount: number = 1) => {
      const previousCount = count;
      const newCount = count + amount;

      setCount(newCount);
      setIsOptimistic(true);

      try {
        const result = await apiCall(newCount);
        setCount(result);
        setIsOptimistic(false);
      } catch (error) {
        setCount(previousCount);
        setIsOptimistic(false);
        throw error;
      }
    },
    [count, apiCall]
  );

  const decrement = useCallback(
    async (amount: number = 1) => {
      const previousCount = count;
      const newCount = Math.max(0, count - amount);

      setCount(newCount);
      setIsOptimistic(true);

      try {
        const result = await apiCall(newCount);
        setCount(result);
        setIsOptimistic(false);
      } catch (error) {
        setCount(previousCount);
        setIsOptimistic(false);
        throw error;
      }
    },
    [count, apiCall]
  );

  return { count, increment, decrement, isOptimistic };
}

// ==================== COMPONENTS ====================

/**
 * Optimistic button with loading/error states
 */
interface OptimisticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOptimistic?: boolean;
  error?: Error | null;
  successMessage?: string;
  errorMessage?: string;
}

export const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  children,
  isOptimistic = false,
  error = null,
  successMessage,
  errorMessage,
  className = '',
  ...props
}) => {
  const [showMessage, setShowMessage] = useState(false);

  React.useEffect(() => {
    if (!isOptimistic) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOptimistic]);

  return (
    <button
      className={`relative ${isOptimistic ? 'opacity-60 cursor-wait' : ''} ${className}`}
      disabled={isOptimistic || props.disabled}
      {...props}
    >
      {isOptimistic ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : showMessage && error ? (
        <span className="text-red-600">{errorMessage || 'Error occurred'}</span>
      ) : showMessage && successMessage ? (
        <span className="text-green-600">{successMessage}</span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Optimistic badge for items being updated
 */
export const OptimisticBadge: React.FC<{ isOptimistic: boolean }> = ({ isOptimistic }) => {
  if (!isOptimistic) return null;

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Saving...
    </span>
  );
};

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Optimistic like button
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
      <Heart fill={isLiked ? 'currentColor' : 'none'} />
    </button>
  );
}

// Example 2: Optimistic booking list
function BookingList() {
  const { list: bookings, removeItem, isOptimistic } = useOptimisticList(
    initialBookings,
    {
      onError: (error) => toast.error('Failed to cancel booking'),
      autoRevert: true,
      revertDelay: 3000,
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
          <OptimisticBadge isOptimistic={isOptimistic(booking.id)} />
          <button onClick={() => handleCancel(booking.id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}

// Example 3: Optimistic form update
function ProfileForm({ user }) {
  const { data, update, isOptimistic, error } = useOptimistic(
    user,
    async (optimisticData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(optimisticData),
      });
      return response.json();
    },
    {
      onSuccess: () => toast.success('Profile updated!'),
      onError: (error) => toast.error('Failed to update profile'),
    }
  );

  const handleSubmit = (formData) => {
    update({ ...data, ...formData });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input defaultValue={data.name} />
      <OptimisticButton isOptimistic={isOptimistic} error={error}>
        Save Changes
      </OptimisticButton>
    </form>
  );
}

// Example 4: Optimistic counter (likes, views, etc.)
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
      <ThumbsUp /> {count} {isOptimistic && '(updating...)'}
    </button>
  );
}
*/
