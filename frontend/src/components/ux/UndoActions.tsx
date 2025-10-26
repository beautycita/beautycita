/**
 * Undo Actions System - BeautyCita UX Enhancement
 * For cancellations, deletions, and other reversible actions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ==================== TYPES ====================

interface UndoableAction<T = any> {
  id: string;
  type: string;
  data: T;
  execute: () => Promise<void> | void;
  undo: () => Promise<void> | void;
  description: string;
  timestamp: number;
}

interface UndoManagerOptions {
  maxHistory?: number;
  defaultTimeout?: number;
  onExecute?: (action: UndoableAction) => void;
  onUndo?: (action: UndoableAction) => void;
}

// ==================== UNDO MANAGER HOOK ====================

export function useUndoManager<T = any>(options: UndoManagerOptions = {}) {
  const {
    maxHistory = 10,
    defaultTimeout = 5000,
    onExecute,
    onUndo,
  } = options;

  const [history, setHistory] = useState<UndoableAction<T>[]>([]);
  const [currentAction, setCurrentAction] = useState<UndoableAction<T> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Execute action with undo option
  const executeWithUndo = useCallback(
    async (
      action: Omit<UndoableAction<T>, 'id' | 'timestamp'>,
      timeout: number = defaultTimeout
    ) => {
      const fullAction: UndoableAction<T> = {
        ...action,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };

      setIsProcessing(true);
      setCurrentAction(fullAction);

      try {
        // Execute the action
        await fullAction.execute();
        onExecute?.(fullAction);

        // Set timeout for auto-commit
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          commitAction();
        }, timeout);
      } catch (error) {
        console.error('Failed to execute action:', error);
        setCurrentAction(null);
        setIsProcessing(false);
        throw error;
      }

      setIsProcessing(false);
    },
    [defaultTimeout, onExecute]
  );

  // Undo current action
  const undoAction = useCallback(async () => {
    if (!currentAction || isProcessing) return;

    setIsProcessing(true);

    try {
      await currentAction.undo();
      onUndo?.(currentAction);
      setCurrentAction(null);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (error) {
      console.error('Failed to undo action:', error);
      throw error;
    }

    setIsProcessing(false);
  }, [currentAction, isProcessing, onUndo]);

  // Commit action (no longer undoable)
  const commitAction = useCallback(() => {
    if (!currentAction) return;

    setHistory((prev) => {
      const newHistory = [currentAction, ...prev].slice(0, maxHistory);
      return newHistory;
    });

    setCurrentAction(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [currentAction, maxHistory]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return {
    executeWithUndo,
    undoAction,
    commitAction,
    clearHistory,
    currentAction,
    history,
    isProcessing,
    canUndo: currentAction !== null && !isProcessing,
  };
}

// ==================== UNDO TOAST COMPONENT ====================

interface UndoToastProps {
  action: UndoableAction | null;
  onUndo: () => void;
  onDismiss: () => void;
  timeout?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  action,
  onUndo,
  onDismiss,
  timeout = 5000,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeout);

  useEffect(() => {
    if (!action) return;

    setTimeLeft(timeout);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [action, timeout]);

  if (!action) return null;

  const progress = (timeLeft / timeout) * 100;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-lg shadow-xl p-4 min-w-[320px] max-w-md">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{action.description}</p>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onUndo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Undo
          </button>
          <span className="text-xs text-gray-400">
            {Math.ceil(timeLeft / 1000)}s
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ==================== UNDO BANNER COMPONENT ====================

interface UndoBannerProps {
  isVisible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoBanner: React.FC<UndoBannerProps> = ({
  isVisible,
  message,
  onUndo,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-yellow-800">{message}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onUndo}
                className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Undo
              </button>
              <button
                onClick={onDismiss}
                className="text-yellow-600 hover:text-yellow-800"
                aria-label="Dismiss"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PREDEFINED ACTION CREATORS ====================

export const UndoActions = {
  /**
   * Delete booking with undo
   */
  deleteBooking: (
    bookingId: number,
    bookingData: any,
    onDelete: (id: number) => Promise<void>,
    onRestore: (data: any) => Promise<void>
  ): Omit<UndoableAction, 'id' | 'timestamp'> => ({
    type: 'DELETE_BOOKING',
    data: { bookingId, bookingData },
    description: 'Booking cancelled',
    execute: async () => {
      await onDelete(bookingId);
    },
    undo: async () => {
      await onRestore(bookingData);
    },
  }),

  /**
   * Cancel booking with undo
   */
  cancelBooking: (
    bookingId: number,
    onCancel: (id: number) => Promise<void>,
    onReactivate: (id: number) => Promise<void>
  ): Omit<UndoableAction, 'id' | 'timestamp'> => ({
    type: 'CANCEL_BOOKING',
    data: { bookingId },
    description: 'Booking cancelled',
    execute: async () => {
      await onCancel(bookingId);
    },
    undo: async () => {
      await onReactivate(bookingId);
    },
  }),

  /**
   * Delete service with undo
   */
  deleteService: (
    serviceId: number,
    serviceData: any,
    onDelete: (id: number) => Promise<void>,
    onRestore: (data: any) => Promise<void>
  ): Omit<UndoableAction, 'id' | 'timestamp'> => ({
    type: 'DELETE_SERVICE',
    data: { serviceId, serviceData },
    description: 'Service deleted',
    execute: async () => {
      await onDelete(serviceId);
    },
    undo: async () => {
      await onRestore(serviceData);
    },
  }),

  /**
   * Archive item with undo
   */
  archiveItem: <T,>(
    itemId: number,
    onArchive: (id: number) => Promise<void>,
    onUnarchive: (id: number) => Promise<void>,
    itemType: string = 'Item'
  ): Omit<UndoableAction<T>, 'id' | 'timestamp'> => ({
    type: 'ARCHIVE_ITEM',
    data: { itemId } as T,
    description: `${itemType} archived`,
    execute: async () => {
      await onArchive(itemId);
    },
    undo: async () => {
      await onUnarchive(itemId);
    },
  }),

  /**
   * Bulk delete with undo
   */
  bulkDelete: <T,>(
    items: T[],
    onDelete: (items: T[]) => Promise<void>,
    onRestore: (items: T[]) => Promise<void>,
    count: number
  ): Omit<UndoableAction<T[]>, 'id' | 'timestamp'> => ({
    type: 'BULK_DELETE',
    data: items,
    description: `${count} items deleted`,
    execute: async () => {
      await onDelete(items);
    },
    undo: async () => {
      await onRestore(items);
    },
  }),

  /**
   * Update field with undo
   */
  updateField: <T,>(
    fieldName: string,
    oldValue: T,
    newValue: T,
    onUpdate: (value: T) => Promise<void>
  ): Omit<UndoableAction, 'id' | 'timestamp'> => ({
    type: 'UPDATE_FIELD',
    data: { fieldName, oldValue, newValue },
    description: `${fieldName} updated`,
    execute: async () => {
      await onUpdate(newValue);
    },
    undo: async () => {
      await onUpdate(oldValue);
    },
  }),
};

// ==================== USAGE EXAMPLES ====================
/*
// Example 1: Delete booking with undo
function BookingCard({ booking }) {
  const { executeWithUndo, currentAction, undoAction, canUndo } = useUndoManager({
    onExecute: () => toast.success('Booking cancelled'),
    onUndo: () => toast.success('Booking restored'),
  });

  const handleCancelBooking = async () => {
    const action = UndoActions.cancelBooking(
      booking.id,
      async (id) => {
        await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
      },
      async (id) => {
        await fetch(`/api/bookings/${id}/reactivate`, { method: 'POST' });
      }
    );

    await executeWithUndo(action, 5000); // 5 second undo window
  };

  return (
    <div>
      <h3>{booking.title}</h3>
      <button onClick={handleCancelBooking}>Cancel Booking</button>

      <UndoToast
        action={currentAction}
        onUndo={undoAction}
        onDismiss={() => {}}
      />
    </div>
  );
}

// Example 2: Bulk delete with undo
function BookingList({ bookings }) {
  const [selectedBookings, setSelectedBookings] = useState([]);
  const { executeWithUndo, currentAction, undoAction } = useUndoManager();

  const handleBulkDelete = async () => {
    const action = UndoActions.bulkDelete(
      selectedBookings,
      async (items) => {
        await fetch('/api/bookings/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids: items.map(b => b.id) }),
        });
      },
      async (items) => {
        await fetch('/api/bookings/bulk-restore', {
          method: 'POST',
          body: JSON.stringify({ items }),
        });
      },
      selectedBookings.length
    );

    await executeWithUndo(action);
  };

  return (
    <div>
      <button onClick={handleBulkDelete} disabled={selectedBookings.length === 0}>
        Delete Selected ({selectedBookings.length})
      </button>

      <UndoToast
        action={currentAction}
        onUndo={undoAction}
        onDismiss={() => {}}
      />
    </div>
  );
}

// Example 3: Archive item with undo banner
function ServiceCard({ service }) {
  const { executeWithUndo, currentAction, undoAction } = useUndoManager();

  const handleArchive = async () => {
    const action = UndoActions.archiveItem(
      service.id,
      async (id) => {
        await fetch(`/api/services/${id}/archive`, { method: 'POST' });
      },
      async (id) => {
        await fetch(`/api/services/${id}/unarchive`, { method: 'POST' });
      },
      'Service'
    );

    await executeWithUndo(action);
  };

  return (
    <div>
      <h3>{service.name}</h3>
      <button onClick={handleArchive}>Archive</button>

      <UndoBanner
        isVisible={!!currentAction}
        message={currentAction?.description || ''}
        onUndo={undoAction}
        onDismiss={() => {}}
      />
    </div>
  );
}

// Example 4: Custom undo action
function CustomAction() {
  const { executeWithUndo, currentAction, undoAction } = useUndoManager();

  const handleCustomAction = async () => {
    await executeWithUndo({
      type: 'CUSTOM_ACTION',
      data: { customData: 'value' },
      description: 'Custom action completed',
      execute: async () => {
        // Do something
        await customApiCall();
      },
      undo: async () => {
        // Undo it
        await undoCustomApiCall();
      },
    });
  };

  return (
    <div>
      <button onClick={handleCustomAction}>Perform Action</button>
      <UndoToast action={currentAction} onUndo={undoAction} onDismiss={() => {}} />
    </div>
  );
}
*/

// ==================== CSS ANIMATIONS ====================
/*
Add to your global CSS:

@keyframes slide-up {
  from {
    transform: translate(-50%, 100px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
*/
