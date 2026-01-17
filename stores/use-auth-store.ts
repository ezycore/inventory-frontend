import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BaseActions, LoadingState, initialLoadingState } from './store-utils'
import { setGlobal401Handler } from '@/lib/api-client'

// User data interface
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'user' | 'admin' | 'owner'
  permissions: string[]
  organizationName?: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    currency: string
    timezone: string
    language?: string
  }
}

// Auth state interface
interface AuthState extends LoadingState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// Auth actions interface
interface AuthActions extends BaseActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void
  clearAuth: () => void
}

// Combined auth store type
type AuthStore = AuthState & AuthActions

// Initial state
const initialState: AuthState = {
  ...initialLoadingState,
  user: null,
  token: null,
  isAuthenticated: false,
}

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          try {
            // Import authApi dynamically to avoid circular dependencies
            const { authApi } = await import('@/lib/api')
            const response = await authApi.login({ email, password })

            set({
              user: response.data.user,
              token: response.data.token,
              isAuthenticated: true,
              isLoading: false
            })
          } catch (error: any) {
            set({
              error: error.message || 'Login failed',
              isLoading: false
            })
            throw error
          }
        },

        logout: async () => {
          try {
            // Import authApi dynamically to avoid circular dependencies
            const { authApi } = await import('@/lib/api')
            await authApi.logout()
          } catch (error) {
            console.error('Logout error:', error)
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })

          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }

        },

        setUser: (user: User, token: string) => {
          set({ user, token, isAuthenticated: true })
        },

        updateUserPreferences: (preferences: Partial<User['preferences']>) => {
          const { user } = get()
          if (user) {
            set({
              user: {
                ...user,
                preferences: { ...user.preferences, ...preferences }
              }
            })
          }
        },

        clearAuth: () => {
          set(initialState)
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'easystock-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
)

if (typeof window !== 'undefined') {
  setGlobal401Handler(() => {
    const { logout } = useAuthStore.getState()
    logout()
  })
}
