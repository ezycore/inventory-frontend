import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BaseActions, LoadingState, initialLoadingState } from './store-utils'
import { setGlobal401Handler, setAuthTokenGetter } from '@/lib/api-client'

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
            // API call to get Bearer token
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
              throw new Error('Login failed')
            }

            const result = await response.json()
            console.log('🔐 Auth Store - Login Response:', {
              success: result.success,
              hasData: !!result.data,
              hasToken: !!(result.data?.token || result.token),
              hasUser: !!(result.data?.user || result.user)
            })
            
            const token = result.data?.token || result.token
            const user = result.data?.user || result.user
            
            console.log('🔐 Auth Store - Setting State:', {
              hasToken: !!token,
              hasUser: !!user,
              tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
            })
            
            set({ 
              user,
              token,
              isAuthenticated: true, 
              isLoading: false 
            })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false 
            })
          }
        },

        logout: async () => {
          // Clear token and user data first
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
          
          // Then try to call logout API (don't await or block on this)
          try {
            fetch('/api/auth/logout', {
              method: 'POST',
            }).catch(() => {
              // Ignore errors - we're already logged out locally
            })
          } catch (error) {
            console.error('Logout error:', error)
          }
          
          // Redirect to login page after a small delay
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/login'
            }, 100)
          }
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true })
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
// 🔒 Setup global 401 handler and token getter when store is initialized
if (typeof window !== 'undefined') {
  setGlobal401Handler(() => {
    const { logout } = useAuthStore.getState()
    logout()
  })
  
  setAuthTokenGetter(() => {
    const { token } = useAuthStore.getState()
    return token
  })
}