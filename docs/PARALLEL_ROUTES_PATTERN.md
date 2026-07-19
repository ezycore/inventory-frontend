# Category Quick Add - Parallel Routes Implementation

## Overview
Implemented using **Next.js Parallel Routes** and **Intercepting Routes** for a clean, URL-based modal pattern.

## Architecture

### File Structure
```
app/(protected)/
├── layout.tsx                           # Updated to accept @modal slot
├── @modal/
│   ├── default.tsx                      # Default slot (renders null)
│   └── (.)categories/
│       └── new/
│           └── page.tsx                 # Modal intercepting route
└── categories/
    └── new/
        └── page.tsx                     # Fallback full-page route
```

## How It Works

### 1. Button in Form Config
```tsx
// components/products/form-config.tsx
action: {
  icon: <Plus />,
  label: "Add Category",
  href: "/categories/new"  // Just a link!
}
```

### 2. Intercepting Route (Modal)
When you click the link from `/products/new`:
- Next.js intercepts the navigation
- Shows modal via `@modal/(.)categories/new/page.tsx`
- URL becomes `/products/new` (stays on same page)
- Modal rendered via parallel route slot

### 3. Auto-Selection Flow
```tsx
// After successful creation:
router.push('/products/new?selectedCategory=123')

// Product form reads searchParams:
useEffect(() => {
  const selectedCategory = searchParams.get('selectedCategory')
  if (selectedCategory) {
    form.setValue('categoryId', selectedCategory)
  }
}, [searchParams])
```

### 4. Cache Invalidation
```tsx
// In modal success handler:
queryClient.invalidateQueries({ 
  queryKey: ['select-options', '/categories'] 
})
// Dropdown refreshes automatically
```

## Key Features

✅ **No Custom Hooks** - Uses native Next.js routing  
✅ **URL-Based** - Shareable, browser back button works  
✅ **~80% Less Code** - No modal state management needed  
✅ **Framework Native** - Leverages Next.js features properly  
✅ **Auto Cache Refresh** - React Query invalidation  
✅ **Auto Selection** - Via URL searchParams  

## Benefits Over Previous Approach

| Feature | Previous (Modal Component) | New (Parallel Routes) |
|---------|---------------------------|----------------------|
| Code Lines | ~150 lines | ~50 lines |
| State Management | Custom hooks required | None needed |
| URL Support | ❌ No | ✅ Yes |
| Browser Back | ❌ Doesn't close modal | ✅ Works naturally |
| Reusability | Component-based | Route-based |
| Learning Curve | Simple | Moderate |

## Usage

### In Form Config
```tsx
{
  name: "categoryId",
  type: "select",
  label: "Category",
  optionsApi: "/categories",
  action: {
    icon: <Plus />,
    label: "Add Category",
    href: "/categories/new"  // That's it!
  }
}
```

### Extending to Other Entities

**For Brand:**
1. Create `@modal/(.)brands/new/page.tsx`
2. Create `brands/new/page.tsx`
3. Update form config: `href: "/brands/new"`

**For Unit:**
1. Create `@modal/(.)units/new/page.tsx`
2. Create `units/new/page.tsx`
3. Update form config: `href: "/units/new"`

## Technical Details

### Form Helper Enhancement
Added `href` support to action buttons:
```tsx
// ui/components/form/form-field.tsx
{field.action.href ? (
  <Link href={field.action.href}>
    <Button>{field.action.icon}</Button>
  </Link>
) : (
  <Button onClick={field.action.onClick}>
    {field.action.icon}
  </Button>
)}
```

### Layout Update
```tsx
// app/(protected)/layout.tsx
export default function ProtectedLayout({
  children,
  modal,  // New parallel route slot
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
```

### Intercepting Route Convention
- `(.)` - Same level
- `(..)` - One level up
- `(...)` - Root

## Files Modified/Created

### Created:
- `app/(protected)/@modal/default.tsx`
- `app/(protected)/@modal/(.)categories/new/page.tsx`
- `app/(protected)/categories/new/page.tsx`

### Modified:
- `app/(protected)/layout.tsx`
- `components/products/form-config.tsx`
- `ui/components/form/form-field.tsx`
- `ui/components/form/type.ts`

### Removed:
- `components/categories/category-quick-add.tsx`
- `hooks/use-category-quick-add.ts`

<!-- docs-verify: absent
  components/categories/category-quick-add.tsx
  hooks/use-category-quick-add.ts
-->
The two files above were deleted by this change and are intentionally gone.

## Best Practices

1. **Always provide fallback route** - Direct navigation to `/categories/new` should work
2. **Clean up URL params** - Remove searchParams after reading them
3. **Invalidate queries** - Ensure dropdowns refresh after creation
4. **Use router.back()** - Instead of manual modal state management

## References

- [Next.js Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Next.js Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)
