import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

interface AdminSession {
  isActive: boolean;
  startTime: number;
  lastActivity: number;
  expiresAt: number;
  username: string;
  userId: string;
}

interface AdminAuthState {
  session: AdminSession | null;
  isAuthenticated: boolean;
  inactivityWarningShown: boolean;

  // Actions
  startSession: (username: string, userId: string) => void;
  endSession: () => void;
  updateActivity: () => void;
  checkSession: () => boolean;
  getTimeRemaining: () => number;
  extendSession: () => void;
  showInactivityWarning: () => void;
  hideInactivityWarning: () => void;
}

const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes
const WARNING_THRESHOLD = 2 * 60 * 1000; // Show warning 2 minutes before expiry
const ACTIVITY_CHECK_INTERVAL = 30 * 1000; // Check activity every 30 seconds

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => {
      let activityTimer: NodeJS.Timeout | null = null;
      let warningTimer: NodeJS.Timeout | null = null;

      // Start activity monitoring
      const startActivityMonitoring = () => {
        if (activityTimer) clearInterval(activityTimer);

        activityTimer = setInterval(() => {
          const state = get();
          if (state.session && state.isAuthenticated) {
            const now = Date.now();
            const timeLeft = state.session.expiresAt - now;

            // Check if session expired
            if (timeLeft <= 0) {
              toast.error('Admin session expired due to inactivity');
              get().endSession();
              return;
            }

            // Show warning if approaching expiry and not already shown
            if (timeLeft <= WARNING_THRESHOLD && !state.inactivityWarningShown) {
              get().showInactivityWarning();

              // Auto-hide warning and logout if no activity
              if (warningTimer) clearTimeout(warningTimer);
              warningTimer = setTimeout(() => {
                const currentState = get();
                if (currentState.inactivityWarningShown) {
                  toast.error('Admin session expired due to inactivity');
                  get().endSession();
                }
              }, timeLeft);
            }
          }
        }, ACTIVITY_CHECK_INTERVAL);
      };

      // Stop activity monitoring
      const stopActivityMonitoring = () => {
        if (activityTimer) {
          clearInterval(activityTimer);
          activityTimer = null;
        }
        if (warningTimer) {
          clearTimeout(warningTimer);
          warningTimer = null;
        }
      };

      // Monitor user activity (mouse, keyboard, etc.)
      const monitorUserActivity = () => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const activityHandler = () => {
          const state = get();
          if (state.session && state.isAuthenticated) {
            get().updateActivity();
          }
        };

        // Add event listeners
        events.forEach(event => {
          document.addEventListener(event, activityHandler, true);
        });

        // Return cleanup function
        return () => {
          events.forEach(event => {
            document.removeEventListener(event, activityHandler, true);
          });
        };
      };

      // Initialize activity monitoring when store is created
      let cleanupActivity: (() => void) | null = null;

      return {
        session: null,
        isAuthenticated: false,
        inactivityWarningShown: false,

        startSession: (username: string, userId: string) => {
          const now = Date.now();
          const session: AdminSession = {
            isActive: true,
            startTime: now,
            lastActivity: now,
            expiresAt: now + SESSION_DURATION,
            username,
            userId
          };

          set({
            session,
            isAuthenticated: true,
            inactivityWarningShown: false
          });

          // Start monitoring
          startActivityMonitoring();
          if (!cleanupActivity) {
            cleanupActivity = monitorUserActivity();
          }

          toast.success(`Admin session started - expires in ${SESSION_DURATION / 60000} minutes`);
        },

        endSession: () => {
          set({
            session: null,
            isAuthenticated: false,
            inactivityWarningShown: false
          });

          // Stop monitoring
          stopActivityMonitoring();
          if (cleanupActivity) {
            cleanupActivity();
            cleanupActivity = null;
          }
        },

        updateActivity: () => {
          const state = get();
          if (state.session && state.isAuthenticated) {
            const now = Date.now();
            const updatedSession = {
              ...state.session,
              lastActivity: now,
              expiresAt: now + SESSION_DURATION // Reset expiry time
            };

            set({
              session: updatedSession,
              inactivityWarningShown: false // Hide warning on activity
            });

            // Clear any pending warning timeout
            if (warningTimer) {
              clearTimeout(warningTimer);
              warningTimer = null;
            }
          }
        },

        checkSession: () => {
          const state = get();
          if (!state.session || !state.isAuthenticated) {
            return false;
          }

          const now = Date.now();
          const isExpired = now >= state.session.expiresAt;

          if (isExpired) {
            get().endSession();
            return false;
          }

          return true;
        },

        getTimeRemaining: () => {
          const state = get();
          if (!state.session) return 0;

          const now = Date.now();
          return Math.max(0, state.session.expiresAt - now);
        },

        extendSession: () => {
          const state = get();
          if (state.session && state.isAuthenticated) {
            const now = Date.now();
            const updatedSession = {
              ...state.session,
              lastActivity: now,
              expiresAt: now + SESSION_DURATION
            };

            set({
              session: updatedSession,
              inactivityWarningShown: false
            });

            toast.success('Admin session extended');
          }
        },

        showInactivityWarning: () => {
          set({ inactivityWarningShown: true });

          toast('⚠️ Admin session expiring in 2 minutes due to inactivity. Click to extend or logout.', {
            duration: 120000, // 2 minutes
            style: {
              background: '#FEF3C7',
              border: '1px solid #F59E0B',
              borderRadius: '8px',
              color: '#92400e'
            },
            onClick: () => {
              const extend = window.confirm('Extend admin session for another 15 minutes?');
              if (extend) {
                get().extendSession();
              } else {
                get().endSession();
                window.location.href = '/admin';
              }
            }
          });
        },

        hideInactivityWarning: () => {
          set({ inactivityWarningShown: false });
        }
      };
    },
    {
      name: 'admin-auth-session',
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Check session validity after rehydration
        if (state?.session) {
          const now = Date.now();
          const isExpired = now >= state.session.expiresAt;

          if (isExpired) {
            // Session expired, clear it
            state.session = null;
            state.isAuthenticated = false;
          } else {
            // Session valid, resume monitoring
            const timeLeft = state.session.expiresAt - now;
            if (timeLeft > 0) {
              // Resume activity monitoring would be handled by the component
            }
          }
        }
      }
    }
  )
);