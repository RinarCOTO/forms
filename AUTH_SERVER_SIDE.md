# 🔐 Server-Side Authentication

Your application now uses **server-side authentication** for better security and performance.

## 🏗️ Architecture

### Client-Side (Frontend)
- Login/Signup pages send credentials to API routes
- No direct access to Supabase client from browser
- Session cookies managed automatically

### Server-Side (Backend)
- API routes handle all authentication logic
- Direct communication with Supabase
- Secure session management via cookies

---

## 📁 API Routes Created

### 1. **POST `/api/auth/login`**
Authenticates a user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "user_metadata": { ... }
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid login credentials"
}
```

---

### 2. **POST `/api/auth/signup`**
Creates a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    }
  }
}
```

---

### 3. **POST `/api/auth/logout`**
Signs out the current user.

**Request:** (No body required)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 4. **GET `/api/auth/user`**
Retrieves the current authenticated user.

**Request:** (No body required)

**Response (Authenticated):**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "user_metadata": {
      "full_name": "John Doe"
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "user": null
}
```

---

## 🔒 Security Benefits

### 1. **No Client-Side Credentials**
- API keys and secrets stay on the server
- Browser never sees sensitive data

### 2. **HttpOnly Cookies**
- Session tokens stored in HttpOnly cookies
- Protected from XSS attacks
- Cannot be accessed via JavaScript

### 3. **Server-Side Validation**
- All authentication logic runs on server
- Cannot be bypassed by client manipulation

### 4. **Centralized Auth Logic**
- Single source of truth for authentication
- Easier to maintain and update

---

## 📝 Usage Examples

### Login from Client Component

```typescript
const handleLogin = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (response.ok && data.success) {
    router.push("/dashboard");
  } else {
    setError(data.error);
  }
};
```

### Get Current User

```typescript
const fetchUser = async () => {
  const response = await fetch("/api/auth/user");
  const data = await response.json();
  
  if (data.user) {
    console.log("User:", data.user);
  } else {
    console.log("Not authenticated");
  }
};
```

### Logout

```typescript
const handleLogout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  router.push("/login");
  router.refresh();
};
```

---

## 🛡️ Middleware Protection

Your middleware (`middleware.ts`) automatically:
- ✅ Checks authentication status
- ✅ Protects routes requiring login
- ✅ Redirects unauthenticated users to `/login`
- ✅ Redirects authenticated users away from `/login` and `/signup`

**Protected Routes:**
- `/` (home)
- `/dashboard`
- `/rpfaas/*`
- `/notes`
- `/building-other-structure/*`

---

## 🔧 Server-Side Data Fetching

### In Server Components

```typescript
import { createClient } from "@/lib/supabase/server";

export default async function ServerPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  return <div>Hello, {user.email}</div>;
}
```

### In API Routes

```typescript
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user-specific data
  const data = await prisma.buildingStructure.findMany({
    where: { createdBy: user.email }
  });

  return NextResponse.json({ data });
}
```

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Get User
```bash
curl http://localhost:3000/api/auth/user \
  -H "Cookie: your-session-cookie"
```

### Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

---

## 📊 Session Management

### How Sessions Work

1. **Login**: Server creates session, sends HttpOnly cookie
2. **Requests**: Browser automatically includes cookie
3. **Middleware**: Validates session on each request
4. **Logout**: Server destroys session, clears cookie

### Session Duration
- Default: 1 week (Supabase default)
- Auto-refresh: Handled by Supabase middleware
- Inactive timeout: Can be configured in Supabase dashboard

---

## 🚀 Deployment Considerations

### Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://...
```

### Vercel Configuration

All API routes automatically deployed as serverless functions:
- `/api/auth/login` → Serverless function
- `/api/auth/signup` → Serverless function
- `/api/auth/logout` → Serverless function
- `/api/auth/user` → Serverless function

No additional configuration needed! ✨

---

## 🔍 Debugging

### Enable Debug Logging

In your API routes, logs are already included:
```typescript
console.error('Login error:', error);
```

View logs:
```bash
# Local development
Check your terminal

# Vercel production
vercel logs --prod
```

### Common Issues

**"User not authenticated"**
- Check if session cookie is present
- Verify middleware is running
- Check Supabase project status

**"Invalid login credentials"**
- Verify email/password are correct
- Check if email is confirmed (if email confirmation enabled)
- Check Supabase Auth settings

---

## 📚 Related Files

- **Middleware**: `middleware.ts`
- **Supabase Server**: `lib/supabase/server.ts`
- **Login Page**: `app/login/page.tsx`
- **Signup Page**: `app/signup/page.tsx`
- **User Profile**: `components/user-profile.tsx`

---

## ✅ Migration Complete

Your authentication is now fully server-side! 🎉

All authentication logic runs securely on the server, with automatic session management and route protection.
