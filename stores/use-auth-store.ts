import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BaseActions, LoadingState, initialLoadingState } from './store-utils'
import { setAuthTokenGetter, setGlobal401Handler } from '@/lib/api-client'

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
  isAuthenticated: boolean
  token: string | null
}

// Auth actions interface
interface AuthActions extends BaseActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void
  clearAuth: () => void
}

// Combined auth store type
type AuthStore = AuthState & AuthActions

// Initial state
const initialState: AuthState = {
  ...initialLoadingState,
  user: null,
  isAuthenticated: false,
  token: null,
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
            // API call with credentials to receive cookie
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
              credentials: 'include', // Important for cookies
            })

            if (!response.ok) {
              throw new Error('Login failed')
            }

            const { data } = await response.json()
            set({ 
              user: data.user,
              token: data.token, 
              isAuthenticated: true, 
              isLoading: false, 
            })
            // Token is stored in state and will be used for API requests
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false 
            })
          }
        },

        logout: async () => {
          // Call logout API to clear cookie
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
            })
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

        setUser: (user: User) => {
          set({ user, isAuthenticated: true })
        },

        setToken: (token: string) => {
          console.log('Setting token in store', token)
          set({ token })
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
  
  // Configure token getter for API requests
  setAuthTokenGetter(() => {
    const { token } = useAuthStore.getState()
    return token
  })
}
