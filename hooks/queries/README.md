# Query Hooks Organization

This directory contains organized query hooks for the EasyStock application, structured by domain/module for better maintainability.

## Structure

```
hooks/
  queries/
    ├── index.ts              # Main export file
    ├── use-stocks.ts         # Stock-related queries
    ├── use-portfolio.ts      # Portfolio queries & mutations
    ├── use-transactions.ts   # Transaction queries
    ├── use-analytics.ts      # Analytics queries
    └── use-users.ts         # User-related queries
```

## Usage Examples

### Import Specific Hooks
```typescript
// Import specific hooks from their modules
import { useStocks, useStock } from '@/hooks/queries/use-stocks'
import { usePortfolio, useAddToPortfolio } from '@/hooks/queries/use-portfolio'
```

### Import All from Index
```typescript
// Import multiple hooks from the main index
import { 
  useStocks, 
  usePortfolio, 
  useTransactions 
} from '@/hooks/queries'
```

### Import Entire Module
```typescript
// Import everything from a specific module
import * as StockQueries from '@/hooks/queries/use-stocks'
import * as PortfolioQueries from '@/hooks/queries/use-portfolio'
```

## Benefits of This Organization

1. **🗂️ Better Organization**: Each domain has its own file
2. **🔍 Easy Discovery**: Find hooks by their domain/feature
3. **🚀 Better Performance**: Import only what you need
4. **👥 Team Collaboration**: Multiple developers can work on different modules
5. **🧪 Easier Testing**: Test hooks by domain
6. **📦 Code Splitting**: Better bundle optimization

## Hook Categories

### Stock Queries (`use-stocks.ts`)
- `useStocks()` - Fetch stocks list with filters
- `useStock()` - Fetch single stock by symbol
- `useStockSearch()` - Search stocks by query
- `useStockPrice()` - Real-time price data
- `useStockHistory()` - Historical price data

### Portfolio Management (`use-portfolio.ts`)
- `usePortfolio()` - Portfolio summary
- `usePortfolioHoldings()` - Holdings list
- `useAddToPortfolio()` - Add stock mutation
- `useRemoveFromPortfolio()` - Remove stock mutation
- `useOptimisticPortfolio()` - Optimistic updates

### Transactions (`use-transactions.ts`)
- `useTransactions()` - Transaction history
- `useTransaction()` - Single transaction
- `useRecentTransactions()` - Recent transactions

### Analytics (`use-analytics.ts`)
- `useAnalytics()` - Dashboard analytics
- `useAnalyticsReport()` - Specific reports
- `usePerformanceAnalytics()` - Performance data
- `useRiskAnalytics()` - Risk analysis

### Users (`use-users.ts`)
- `useUserProfile()` - Current user profile
- `useUser()` - User by ID
- `useUsers()` - Users list

## Migration from Single File

If you were using the old `use-query-hooks.ts`, simply update your imports:

```typescript
// Old way
import { useStocks, usePortfolio } from '@/hooks/use-query-hooks'

// New way - specific modules
import { useStocks } from '@/hooks/queries/use-stocks'
import { usePortfolio } from '@/hooks/queries/use-portfolio'

// Or from index
import { useStocks, usePortfolio } from '@/hooks/queries'
```
