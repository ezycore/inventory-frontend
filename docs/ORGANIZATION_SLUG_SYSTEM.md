# Organization Slug Management System

## Overview

This system provides a flexible way to handle organization identification that works seamlessly with both **subdomain-based** and **manual slug input** approaches. It automatically detects if the application is accessed via a subdomain and handles the organization slug accordingly.

## Key Features

- **Automatic Subdomain Detection**: Detects if user is accessing via subdomain (e.g., `abc-company.eazystock.com`)
- **Conditional Field Rendering**: Shows/hides organization slug field based on subdomain presence
- **Seamless Data Handling**: Automatically includes organization slug in requests whether from subdomain or manual input
- **Backend Integration**: Backend properly handles organization slug for user authentication and identification

## Frontend Implementation

### Utility Functions (`lib/organization-utils.ts`)

The core utility file provides several functions:

#### Main Functions

```typescript
// Get subdomain from URL (returns null if none)
getSubdomain(): string | null

// Check if subdomain mode is active
isSubdomainMode(): boolean

// Get organization slug (from subdomain if available)
getOrganizationSlug(): string | null

// Enhance form data with organization slug
withOrganizationSlug<T>(formData: T, manualSlug?: string): T & { organizationSlug?: string }

// Check if slug field should be shown
shouldShowOrganizationSlugField(): boolean

// Helper text functions
getOrganizationSlugPlaceholder(): string
getOrganizationSlugDescription(): string

// Validation
isValidOrganizationSlug(slug: string): boolean
generateSlugFromName(name: string): string
```

### Usage in Auth Pages

#### Example: Login Form

```tsx
import {
  withOrganizationSlug,
  shouldShowOrganizationSlugField,
  getOrganizationSlugPlaceholder,
  getOrganizationSlugDescription,
} from "@/lib/organization-utils";

export function LoginForm() {
  const [formData, setFormData] = useState({
    organizationSlug: "",
    email: "",
    password: "",
  });

  // Check if slug field should be shown
  const showSlugField = shouldShowOrganizationSlugField();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Automatically add organization slug from subdomain or manual input
    const dataWithSlug = withOrganizationSlug(
      formData,
      formData.organizationSlug,
    );

    loginMutation.mutate(dataWithSlug);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Conditionally show organization slug field */}
      {showSlugField && (
        <div>
          <Label htmlFor="organizationSlug">Organization Slug</Label>
          <Input
            id="organizationSlug"
            type="text"
            placeholder={getOrganizationSlugPlaceholder()}
            value={formData.organizationSlug}
            onChange={(e) =>
              setFormData({ ...formData, organizationSlug: e.target.value })
            }
            required
          />
          <p className="text-xs text-muted-foreground">
            {getOrganizationSlugDescription()}
          </p>
        </div>
      )}

      {/* Other form fields */}
    </form>
  );
}
```

## Backend Implementation

### Auth Controller Updates

The login controller now accepts `organizationSlug`:

```typescript
// src/controllers/auth.controller.ts
login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password, twoFactorToken, organizationSlug } = req.body;

    const result = await authService.login(
      email,
      password,
      twoFactorToken,
      organizationSlug,
    );

    // ... rest of login logic
  } catch (error) {
    next(error);
  }
};
```

### Auth Service Updates

The auth service queries users by organization when slug is provided:

```typescript
// src/services/auth.service.ts
async login(
  email: string,
  password: string,
  twoFactorToken?: string,
  organizationSlug?: string
): Promise<LoginResult> {
  // Build query for finding user
  let query: any = { email: email.toLowerCase() };

  // If organization slug is provided, find the organization first
  if (organizationSlug) {
    const organization = await OrganizationModel.findOne({
      slug: organizationSlug.toLowerCase(),
    });
    if (organization) {
      query.organizationId = organization._id;
    }
  }

  // Find user by email (and optionally by organization)
  const user = await UserModel.findOne(query).select("+password");

  // ... rest of login logic
}
```

## How It Works

### Scenario 1: Subdomain-Based Access

**URL**: `https://abc-company.eazystock.com/login`

1. User navigates to login page
2. `getSubdomain()` detects "abc-company" from URL
3. `shouldShowOrganizationSlugField()` returns `false`
4. Organization slug field is **hidden** from the form
5. On submit, `withOrganizationSlug()` automatically adds `organizationSlug: "abc-company"` to request
6. Backend receives organization slug and queries user within that organization

### Scenario 2: Manual Slug Input

**URL**: `https://eazystock.com/login` or `http://localhost:3000/login`

1. User navigates to login page
2. `getSubdomain()` returns `null` (no subdomain)
3. `shouldShowOrganizationSlugField()` returns `true`
4. Organization slug field is **visible** in the form
5. User manually enters "abc-company"
6. On submit, `withOrganizationSlug()` uses the manual input
7. Backend receives organization slug and queries user within that organization

## Updated Files

### Frontend

- ✅ `lib/organization-utils.ts` - Core utility functions
- ✅ `components/login/login-form.tsx` - Login form with conditional slug field
- ✅ `app/(auth)/forgot-password/page.tsx` - Forgot password with conditional slug field
- ✅ `app/(auth)/resend-verification/page.tsx` - Resend verification with conditional slug field
- ✅ `services/api/modules/auth/api.ts` - Updated API types to accept organizationSlug
- ✅ `services/api/modules/auth/hooks.ts` - Updated mutation types

### Backend

- ✅ `src/controllers/auth.controller.ts` - Accept organizationSlug in login
- ✅ `src/services/auth.service.ts` - Query users by organization when slug provided

## Testing

### Test Subdomain Mode (Development)

Since localhost doesn't support subdomains, you can:

1. **Edit hosts file** to create test subdomain:

   ```
   127.0.0.1 abc-company.localhost
   ```

2. **Use a reverse proxy** like ngrok or localtunnel with subdomain support

3. **Mock the hostname** in development (add to your `.env.local`):
   ```
   NEXT_PUBLIC_MOCK_SUBDOMAIN=abc-company
   ```

### Test Manual Mode

Simply access the application via:

- `http://localhost:3000/login`
- `https://eazystock.com/login` (production without subdomain)

## Migration Path

### Current State

Users manually enter organization slug in all auth forms.

### Future State (Subdomain Enabled)

1. Configure DNS to support wildcard subdomains: `*.eazystock.com`
2. Update Next.js config to handle dynamic subdomains
3. No code changes needed - system automatically detects subdomain
4. Forms will automatically hide slug field and use subdomain

### Gradual Migration

Both methods work simultaneously:

- Users with subdomain URLs: Automatic slug detection
- Users with regular URLs: Manual slug input
- No breaking changes for existing users

## Environment Configuration

Add to `.env` or `.env.local`:

```bash
# Frontend
NEXT_PUBLIC_APP_DOMAIN=eazystock.com
NEXT_PUBLIC_SUBDOMAIN_ENABLED=false  # Set to true when ready

# Backend
APP_DOMAIN=eazystock.com
SUBDOMAIN_ENABLED=false  # Set to true when ready
```

## Best Practices

1. **Always use `withOrganizationSlug()`** before submitting auth-related forms
2. **Use `shouldShowOrganizationSlugField()`** to conditionally render the field
3. **Test both subdomain and manual modes** before deploying
4. **Validate organization slug** on backend even if frontend hides the field
5. **Log subdomain detection** for debugging purposes

## Security Considerations

- Organization slug is validated on backend regardless of source (subdomain or manual)
- User must exist within the specified organization
- Prevents user enumeration across organizations
- Token-based authentication remains organization-scoped

## Future Enhancements

- [ ] Middleware to extract subdomain on backend
- [ ] Organization-specific theming based on subdomain
- [ ] Cached organization lookup for performance
- [ ] Organization slug in JWT claims
- [ ] Admin dashboard for subdomain management
