import { toast } from 'sonner'

// Common error types in the application
export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: Record<string, any>
}

// Type guard to check if error is an ApiError
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  )
}

// Format error message for display
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

// Error handling for mutations
export const handleMutationError = (error: unknown) => {
  const message = getErrorMessage(error)
  toast.error('Error', {
    description: message,
  })
}

// Error handling for queries (more silent, usually handled by components)
export const handleQueryError = (error: unknown) => {
  console.error('Query error:', error)

  // Only show toast for network errors or 5xx errors
  if (isApiError(error) && (!error.status || error.status >= 500)) {
    const message = getErrorMessage(error)
    toast.error('Something went wrong', {
      description: message,
    })
  }
}

// Default error retry logic
export const shouldRetryError = (error: unknown): boolean => {
  if (isApiError(error) && error.status) {
    // Don't retry client errors (4xx) except for rate limiting and timeouts
    if (error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429
    }
    // Retry server errors (5xx)
    return error.status >= 500
  }

  // Retry network errors
  return true
}
