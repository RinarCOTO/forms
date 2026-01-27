# Authentication System

## Overview

A simple authentication system has been implemented using shadcn/ui components with client-side localStorage. This is a basic implementation suitable for prototyping.

## Features

### Login Page (`/login`)
- Email and password authentication
- Form validation
- Loading states
- Error handling
- "Forgot password" link (placeholder)
- Link to signup page
- Beautiful gradient background with centered card design

### Signup Page (`/signup`)
- Full name, email, password, and confirm password fields
- Password strength requirement (minimum 8 characters)
- Password matching validation
- Loading states
- Error handling
- Link to login page

### User Profile Component
- Displays user name and email in the sidebar
- Logout button with icon
- Located at the bottom of the AppSidebar

### Auth Utilities (`lib/auth.ts`)
- `isAuthenticated()` - Check if user is logged in
- `getUserEmail()` - Get current user's email
- `getUserName()` - Get current user's name
- `logout()` - Clear authentication data
- `requireAuth(router)` - Redirect to login if not authenticated

## Usage

### Accessing the Login Page
Navigate to: `http://localhost:3000/login`

### Test Credentials
Since this is a prototype, any valid email and password will work:
- Email: `test@example.com`
- Password: `password123`

### Protecting Routes
Add this to any page component that requires authentication:

```tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAuthenticated } from '@/lib/auth';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Your page content
}
```

### Using User Data in Components
```tsx
import { getUserName, getUserEmail } from '@/lib/auth';

const userName = getUserName();
const userEmail = getUserEmail();
```

### Logging Out
The logout button is automatically available in the sidebar. To implement logout elsewhere:

```tsx
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const handleLogout = () => {
  logout();
  router.push('/login');
};
```

## Routes

- `/login` - Login page
- `/signup` - Signup page
- `/` - Home page (redirects to login if not authenticated)
- All RPFAAS form pages - Protected by sidebar (user can logout)

## Components Added

1. **`/app/login/page.tsx`** - Login page component
2. **`/app/signup/page.tsx`** - Signup page component
3. **`/components/user-profile.tsx`** - User profile sidebar component
4. **`/lib/auth.ts`** - Authentication utility functions
5. **`/components/ui/card.tsx`** - Card component from shadcn/ui (auto-installed)

## Updated Components

1. **`/app/page.tsx`** - Added authentication check and redirect
2. **`/components/app-sidebar.tsx`** - Added UserProfile component in footer

## Styling

The login and signup pages feature:
- Centered card layout
- Gradient background (light mode: neutral-50 to neutral-100, dark mode: neutral-950 to neutral-900)
- Responsive design (max-width: 28rem)
- Shadow effects on cards
- Form validation with error messages
- Loading states with disabled inputs

## Important Notes

⚠️ **This is a CLIENT-SIDE prototype authentication system**

For production use, you should:

1. **Use a proper authentication solution:**
   - NextAuth.js (Auth.js)
   - Clerk
   - Supabase Auth
   - Auth0

2. **Implement server-side authentication:**
   - API routes for login/signup
   - JWT tokens or session cookies
   - Password hashing (bcrypt)
   - Database storage for users

3. **Add security features:**
   - CSRF protection
   - Rate limiting
   - Email verification
   - Password reset functionality
   - Multi-factor authentication (MFA)

4. **Use middleware for route protection:**
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   
   export function middleware(request: NextRequest) {
     // Check authentication from cookies/JWT
     // Redirect if not authenticated
   }
   
   export const config = {
     matcher: ['/dashboard/:path*', '/rpfaas/:path*'],
   };
   ```

## Next Steps

To upgrade to a production-ready authentication system:

1. Install NextAuth.js:
   ```bash
   npm install next-auth
   ```

2. Follow the NextAuth.js setup guide: https://next-auth.js.org/getting-started/example

3. Set up a database (PostgreSQL) for user storage

4. Configure environment variables for auth secrets

5. Implement proper password hashing and validation

6. Add email verification and password reset flows

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. You should be redirected to `/login`

4. Enter any email and password (minimum 8 characters)

5. You'll be logged in and redirected to the dashboard

6. Your name/email will appear in the sidebar

7. Click logout to return to the login page
