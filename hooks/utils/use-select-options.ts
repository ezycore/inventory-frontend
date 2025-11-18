import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { SelectOption } from '@/types/form'

/**
 * Generic utility hook for fetching select options from any API endpoint
 * Module-independent and can be used across the entire application
 * 
 * @param url - API endpoint URL (if null/undefined, query won't run)
 * @returns TanStack Query result with transformed options data
 * 
 * Usage:
 * - Products: useSelectOptions('/api/categories') 
 * - Users: useSelectOptions('/api/roles')
 * - Settings: useSelectOptions('/api/languages')
 * - Any module: useSelectOptions('/api/your-endpoint')
 */
export const useSelectOptions = (url: string | null | undefined) => {
  return useQuery({
    queryKey: ['select-options', url] as const,
    queryFn: async (): Promise<SelectOption[]> => {
      if (!url) return []
      
      // Use the centralized API client instead of fetch
      const response = await apiClient.get(url)
      
      // Transform data - expect API to return data.data.items format
      // and convert to {label, value}[] format  
      const items = (response as any)?.data?.items || []
      let options = items.map((item: any) => ({
        value: item._id || item.id,
        label: item.name || item.label,
        disabled: item.disabled || false
      }))

      // Special handling for brands - add "No Brand" option
      if (url.includes('/brands')) {
        options = [
          { value: 'none', label: 'No Brand', disabled: false },
          ...options
        ]
      }

      return options
    }, 
    enabled: !!url, // Only run query if URL is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}