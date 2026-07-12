# TanStack Query v5 Setup for EzyCore Frontend

This setup provides a modern, developer-friendly TanStack Query v5 configuration with the latest best practices.

## Features

- ✅ **TanStack Query v5** with latest features
- ✅ **Type-safe query keys** for better DX
- ✅ **Smart error handling** with toast notifications
- ✅ **Optimistic updates** support
- ✅ **API client** with automatic error handling
- ✅ **Custom hooks** for common operations
- ✅ **DevTools** integration in development
- ✅ **SSR-ready** configuration

## File Structure

```
lib/
├── react-query.ts         # Query client configuration
├── query-keys.ts          # Type-safe query key factory
├── error-handling.ts      # Error handling utilities
└── api-client.ts          # API client with error handling

components/providers/
├── query-provider.tsx     # React Query provider
└── toaster.tsx           # Toast notifications

hooks/
└── use-query-hooks.ts     # Custom query and mutation hooks
```

## Quick Start

### 1. Using Queries

```tsx
import { useStocks, useStock } from '@/hooks/use-query-hooks'

function StockList() {
  const { data: stocks, isLoading, error } = useStocks({ limit: 10 })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {stocks?.map(stock => (
        <div key={stock.symbol}>{stock.name}</div>
      ))}
    </div>
  )
}

function StockDetail({ symbol }: { symbol: string }) {
  const { data: stock, isLoading } = useStock(symbol)
  
  return (
    <div>
      {isLoading ? 'Loading...' : stock?.name}
    </div>
  )
}
```

### 2. Using Mutations

```tsx
import { useAddToPortfolio } from '@/hooks/use-query-hooks'
import { toast } from 'sonner'

function AddStockButton({ stock }: { stock: Stock }) {
  const addToPortfolio = useAddToPortfolio()
  
  const handleAdd = () => {
    addToPortfolio.mutate(
      {
        symbol: stock.symbol,
        quantity: 10,
        price: stock.currentPrice,
      },
      {
        onSuccess: () => {
          toast.success('Stock added to portfolio!')
        },
      }
    )
  }
  
  return (
    <button
      onClick={handleAdd}
      disabled={addToPortfolio.isPending}
    >
      {addToPortfolio.isPending ? 'Adding...' : 'Add to Portfolio'}
    </button>
  )
}
```

### 3. Using Search with Debouncing

```tsx
import { useStockSearch } from '@/hooks/use-query-hooks'
import { useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

function StockSearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  
  const { data: results, isLoading } = useStockSearch(debouncedQuery)
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search stocks..."
      />
      
      {isLoading && <div>Searching...</div>}
      
      {results?.map(stock => (
        <div key={stock.symbol}>{stock.name}</div>
      ))}
    </div>
  )
}
```

### 4. Optimistic Updates

```tsx
import { useOptimisticPortfolio } from '@/hooks/use-query-hooks'

function OptimisticAddButton({ stock }: { stock: Stock }) {
  const { addStockOptimistic } = useOptimisticPortfolio()
  
  const handleAdd = () => {
    addStockOptimistic.mutate({
      symbol: stock.symbol,
      quantity: 1,
      price: stock.currentPrice,
    })
  }
  
  return (
    <button onClick={handleAdd}>
      Add (Optimistic)
    </button>
  )
}
```

### 5. Manual Cache Management

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

function ManualCacheExample() {
  const queryClient = useQueryClient()
  
  const refreshPortfolio = () => {
    // Invalidate and refetch portfolio data
    queryClient.invalidateQueries({
      queryKey: queryKeys.portfolio.all()
    })
  }
  
  const updateStockPrice = (symbol: string, newPrice: number) => {
    // Update specific stock data in cache
    queryClient.setQueryData(
      queryKeys.stock.detail(symbol),
      (oldData: any) => ({
        ...oldData,
        currentPrice: newPrice,
      })
    )
  }
  
  const prefetchStock = (symbol: string) => {
    // Prefetch data before user navigates
    queryClient.prefetchQuery({
      queryKey: queryKeys.stock.detail(symbol),
      queryFn: () => stockApi.getStock(symbol),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  }
  
  return (
    <div>
      <button onClick={refreshPortfolio}>Refresh Portfolio</button>
      <button onClick={() => updateStockPrice('AAPL', 150)}>
        Update AAPL Price
      </button>
      <button onClick={() => prefetchStock('TSLA')}>
        Prefetch TSLA
      </button>
    </div>
  )
}
```

## Configuration

### Query Client Settings

The query client is configured with sensible defaults:

- **Stale Time**: 1 minute (data stays fresh)
- **GC Time**: 10 minutes (cache retention)
- **Retry Logic**: Smart retry based on error types
- **Window Focus**: Disabled (prevent unwanted refetches)
- **Reconnect**: Always refetch on reconnect

### Error Handling

Errors are automatically handled:

- **Query Errors**: Logged to console, toasts for 5xx errors
- **Mutation Errors**: Always show toast notifications
- **Retry Logic**: Don't retry 4xx errors (except 408, 429)

### Type Safety

Query keys are fully typed:

```tsx
// ✅ Type-safe
const key = queryKeys.stock.detail('AAPL')

// ✅ Intellisense support
queryClient.invalidateQueries({
  queryKey: queryKeys.portfolio.all()
})
```

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Best Practices

1. **Use Query Keys Factory**: Always use `queryKeys` for consistency
2. **Handle Loading States**: Show proper loading indicators
3. **Error Boundaries**: Consider adding error boundaries for better UX
4. **Optimistic Updates**: Use for better perceived performance
5. **Prefetching**: Prefetch data for better navigation experience
6. **Invalidation**: Properly invalidate related queries after mutations

## Troubleshooting

### Common Issues

1. **Hydration Errors**: Make sure QueryProvider is client-side only
2. **Cache Not Updating**: Check if you're invalidating the right query keys
3. **Infinite Requests**: Ensure query functions are stable (use useCallback if needed)

### Debug Tools

- **React Query Devtools**: Available in development mode
- **Console Logs**: Error details are logged to console
- **Network Tab**: Check actual API requests in browser devtools

## Migration from v4

Major changes in v5:
- `cacheTime` → `gcTime`
- `onError` callbacks removed from queries (use error boundaries)
- Improved TypeScript support
- Better SSR support

This setup is ready for production and provides an excellent developer experience! 🚀
