import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BaseActions, LoadingState, initialLoadingState } from './store-utils'

// Counter for notification IDs to avoid hydration issues
let notificationCounter = 0

// Theme type
export type Theme = 'light' | 'dark' | 'system'

// Notification type
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: Date
}

// UI state interface
interface UIState extends LoadingState {
  theme: Theme
  sidebarOpen: boolean
  notifications: Notification[]
}

// UI actions interface
interface UIActions extends BaseActions {
  // Loading actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Theme management
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  
  // Sidebar management
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

// Combined UI store type
type UIStore = UIState & UIActions

// Initial state
const initialState: UIState = {
  ...initialLoadingState,
  theme: 'system',
  sidebarOpen: true,
  notifications: [],
}

// Create the UI store
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Base actions
        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),
        clearError: () => set({ error: null }),
        reset: () => set(initialState),

        // Theme management
        setTheme: (theme: Theme) => set({ theme }),
        toggleTheme: () => {
          const currentTheme = get().theme
          const newTheme = currentTheme === 'light' ? 'dark' : 'light'
          set({ theme: newTheme })
        },

        // Sidebar management
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        // Notification management
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification-${++notificationCounter}`,
            timestamp: new Date(),
          }
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }))

          // Auto-remove notification after duration
          if (notification.duration) {
            setTimeout(() => {
              get().removeNotification(newNotification.id)
            }, notification.duration)
          }
        },

        removeNotification: (id: string) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        },

        clearNotifications: () => set({ notifications: [] }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: 'ui-store' }
  )
)
