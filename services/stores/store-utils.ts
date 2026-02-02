// Common action types for consistency
export interface BaseActions {
  reset: () => void
}

// Common loading state interface
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Helper to create loading actions
export const createLoadingActions = (set: any) => ({
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})

// Common state patterns
export const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
}
