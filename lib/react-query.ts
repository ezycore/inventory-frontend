import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized defaults
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors except 408, 429
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status?: number }).status
            if (typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429) {
              return false
            }
          }
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
      },
      mutations: {
        retry: false,
      },
    },
  })

// Create a singleton instance for the client
let clientSingleton: QueryClient | undefined = undefined

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientSingleton ??= createQueryClient())
}
