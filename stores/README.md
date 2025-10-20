# Zustand State Management

This directory contains the Zustand stores for the EasyStock application, organized by domain for better maintainability and separation of concerns.

## Store Architecture

```
stores/
├── index.ts                   # Main exports
├── store-utils.ts            # Common utilities and types
├── use-auth-store.ts         # Authentication & user state
├── use-portfolio-store.ts    # Portfolio management state
├── use-stocks-store.ts       # Stocks & watchlist state
└── use-ui-store.ts          # UI state (theme, modals, etc.)
```

## Store Overview

### 🔐 Auth Store (`use-auth-store.ts`)
Manages user authentication and profile data with persistence.

**State:**
- User profile data
- Authentication status
- JWT token
- Loading states

**Key Actions:**
- `login(email, password)` - User login
- `logout()` - User logout
- `setUser(user)` - Update user data
- `updateUserPreferences(prefs)` - Update user preferences

### 📊 Portfolio Store (`use-portfolio-store.ts`)
Manages portfolio holdings, summary, and related operations.

**State:**
- Holdings array
- Portfolio summary
- Sorting and filtering options
- Selected holding

**Key Actions:**
- `setHoldings(holdings)` - Update holdings
- `addHolding(holding)` - Add new holding
- `updateHolding(id, updates)` - Update existing holding
- `getFilteredHoldings()` - Get filtered holdings
- `getSortedHoldings(holdings)` - Sort holdings

### 📈 Stocks Store (`use-stocks-store.ts`)
Manages stock data, watchlists, and stock-related operations with persistence.

**State:**
- All stocks data
- Watchlist items
- Recently viewed stocks
- Search and filter state
- Sorting preferences

**Key Actions:**
- `addToWatchlist(item)` - Add to watchlist
- `removeFromWatchlist(id)` - Remove from watchlist
- `setSelectedStock(symbol)` - Select stock for detailed view
- `getFilteredStocks()` - Get filtered stocks
- `getSortedStocks(stocks)` - Sort stocks

### 🎨 UI Store (`use-ui-store.ts`)
Manages UI state, theme, modals, and user interface preferences with persistence.

**State:**
- Theme (light/dark/system)
- Sidebar state
- Modal states
- Search state
- Notifications
- Loading states
- Active views/tabs

**Key Actions:**
- `setTheme(theme)` - Set theme
- `toggleSidebar()` - Toggle sidebar
- `openModal(modal)` - Open specific modal
- `addNotification(notification)` - Add notification
- `setActiveView(view)` - Set active view

## Usage Examples

### Basic Usage
```typescript
import { useAuthStore, usePortfolioStore, useUIStore } from '@/stores'

function MyComponent() {
  // Get state and actions
  const { user, login, logout } = useAuthStore()
  const { holdings, addHolding } = usePortfolioStore()
  const { theme, setTheme, openModal } = useUIStore()

  // Use in component
  return (
    <div>
      <p>Welcome {user?.name}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => openModal('addStockModal')}>Add Stock</button>
    </div>
  )
}
```

### Selective Subscription
```typescript
import { useAuthStore } from '@/stores'

function UserProfile() {
  // Only subscribe to user data (not the entire store)
  const user = useAuthStore((state) => state.user)
  const updatePreferences = useAuthStore((state) => state.updateUserPreferences)

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => updatePreferences({ theme: 'dark' })}>
        Set Dark Theme
      </button>
    </div>
  )
}
```

### Multiple Store Usage
```typescript
import { usePortfolioStore, useStocksStore, useUIStore } from '@/stores'

function Dashboard() {
  // Portfolio data
  const { holdings, summary } = usePortfolioStore()
  
  // Watchlist from stocks store
  const { watchlist, getWatchlistStocks } = useStocksStore()
  
  // UI state
  const { addNotification } = useUIStore()

  const handleAddStock = () => {
    // Add stock logic
    addNotification({
      type: 'success',
      title: 'Stock Added',
      message: 'Stock successfully added to portfolio',
      duration: 3000
    })
  }

  return <div>/* Dashboard content */</div>
}
```

### Computed Values
```typescript
import { usePortfolioStore } from '@/stores'

function PortfolioSummary() {
  // Get computed/filtered data
  const getFilteredHoldings = usePortfolioStore((state) => state.getFilteredHoldings)
  const getSortedHoldings = usePortfolioStore((state) => state.getSortedHoldings)
  
  const filteredHoldings = getFilteredHoldings()
  const sortedHoldings = getSortedHoldings(filteredHoldings)

  return (
    <div>
      {sortedHoldings.map(holding => (
        <div key={holding.id}>{holding.symbol}</div>
      ))}
    </div>
  )
}
```

## Store Integration with TanStack Query

Zustand works perfectly with TanStack Query for a complete state management solution:

```typescript
import { usePortfolioStore } from '@/stores'
import { usePortfolio } from '@/hooks/queries'

function Portfolio() {
  // Server state from TanStack Query
  const { data: portfolioData, isLoading } = usePortfolio()
  
  // Client state from Zustand
  const { setSummary, setHoldings, sortBy, setSortBy } = usePortfolioStore()

  // Update Zustand when server data changes
  useEffect(() => {
    if (portfolioData) {
      setSummary(portfolioData.summary)
      setHoldings(portfolioData.holdings)
    }
  }, [portfolioData])

  return <div>/* Portfolio content */</div>
}
```

## Best Practices

### 1. **Domain Separation**
Each store handles a specific domain (auth, portfolio, UI, etc.)

### 2. **Selective Subscriptions**
Use selector functions to subscribe only to needed state:
```typescript
// ✅ Good - only subscribes to user
const user = useAuthStore((state) => state.user)

// ❌ Avoid - subscribes to entire store
const { user } = useAuthStore()
```

### 3. **Actions Over Direct State Mutation**
Use store actions instead of setting state directly:
```typescript
// ✅ Good
const addToWatchlist = useStocksStore((state) => state.addToWatchlist)
addToWatchlist({ symbol: 'AAPL', name: 'Apple Inc.' })

// ❌ Avoid
const { watchlist } = useStocksStore()
watchlist.push(newItem) // Don't mutate directly
```

### 4. **Persistence Configuration**
Only persist what's necessary:
- Auth: user data, token
- UI: theme, sidebar preferences
- Stocks: watchlist, recently viewed
- Portfolio: sorting preferences (not holdings - that's server data)

### 5. **Loading States**
Use loading states appropriately:
- Auth store: for login/logout operations
- UI store: for component-level loading
- Let TanStack Query handle server data loading

## DevTools

All stores are configured with Redux DevTools support in development mode. Use the browser extension to inspect state changes, time travel, and debug issues.

## Store Reset

All stores implement a `reset()` action for cleanup:
```typescript
const resetAuth = useAuthStore((state) => state.reset)
const resetUI = useUIStore((state) => state.reset)

// Reset all stores (e.g., on logout)
const handleLogout = () => {
  resetAuth()
  resetUI()
  // etc.
}
```
