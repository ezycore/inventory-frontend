import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BaseActions, LoadingState, initialLoadingState } from './store-utils'

// User data interface
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'user' | 'admin'
  preferences: {
    theme: 'light' | 'dark' | 'system'
    currency: string
    timezone: string
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
            // Simulate API call
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })

            if (!response.ok) {
              throw new Error('Login failed')
            }

            const { user, token } = await response.json()
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

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          })
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true })
        },

        setToken: (token: string) => {
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
