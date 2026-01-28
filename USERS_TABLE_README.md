# Users Table Documentation

## Overview
The users table extends Supabase Auth to store additional user profile information and roles.

## Database Setup

### 1. Create the Users Table in Supabase

Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

Run the SQL from `CREATE_USERS_TABLE.sql` or the full `CREATE_DB_SIMPLE.sql`

### 2. What the Setup Does

- **Creates users table** that references `auth.users`
- **Automatic profile creation** - When a user signs up, a profile is automatically created
- **Row Level Security (RLS)** - Users can only see/edit their own profile, admins can manage all users
- **Indexes** - For faster lookups by email and role

## User Schema

```typescript
{
  id: string;              // UUID from Supabase Auth
  email: string;           // User's email
  full_name?: string;      // Full name
  role: 'admin' | 'user' | 'assessor' | 'manager' | 'viewer';
  department?: string;     // Department
  position?: string;       // Job position
  phone?: string;          // Phone number
  is_active: boolean;      // Account active status
  last_login?: string;     // Last login timestamp
  created_at: string;      // Account creation date
  updated_at: string;      // Last update date
}
```

## API Endpoints

### Get Current User
```typescript
GET /api/auth/user
// Returns the logged-in user's profile
```

### Update Current User Profile
```typescript
PATCH /api/auth/user
Body: {
  full_name?: string;
  department?: string;
  position?: string;
  phone?: string;
}
// Users can update their own profile (not role or is_active)
```

### Get All Users (Admin Only)
```typescript
GET /api/users
// Returns all users (admins only)
```

### Create User (Admin Only)
```typescript
POST /api/users
Body: {
  email: string;
  password: string;
  full_name?: string;
  role?: string;
  department?: string;
  position?: string;
  phone?: string;
}
// Creates a new user (admins only)
```

### Get Specific User (Admin Only)
```typescript
GET /api/users/[id]
// Returns specific user by ID (admins only or own profile)
```

### Update User (Admin Only)
```typescript
PATCH /api/users/[id]
Body: {
  full_name?: string;
  role?: string;
  department?: string;
  position?: string;
  phone?: string;
  is_active?: boolean;
}
// Updates user (admins only)
```

### Delete User (Admin Only)
```typescript
DELETE /api/users/[id]
// Deletes user (admins only, cannot delete self)
```

## Usage Examples

### 1. Sign Up (Creates user automatically)
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
// User profile is created automatically via trigger
```

### 2. Fetch Current User
```typescript
const response = await fetch('/api/auth/user');
const { user } = await response.json();
console.log(user.role); // 'user', 'admin', etc.
```

### 3. Update Profile
```typescript
const response = await fetch('/api/auth/user', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    full_name: 'Jane Doe',
    department: 'Assessments',
    position: 'Senior Assessor'
  })
});
```

### 4. Admin: Create New User
```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'password123',
    full_name: 'New User',
    role: 'assessor',
    department: 'Field Operations'
  })
});
```

### 5. Admin: Update User Role
```typescript
const response = await fetch(`/api/users/${userId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'admin',
    is_active: true
  })
});
```

## User Roles

- **admin** - Full access to all features and user management
- **user** - Basic access
- **assessor** - Can create and manage assessments
- **manager** - Can view and approve assessments
- **viewer** - Read-only access

## Security Features

1. **Row Level Security (RLS)** - Enabled on the users table
2. **User Isolation** - Users can only see/edit their own profile
3. **Admin Access** - Admins have full access via RLS policies
4. **Foreign Key Constraints** - Links to auth.users with CASCADE delete
5. **Automatic Profile Creation** - Trigger ensures profiles are always created

## Tracking Changes

All tables now use `created_by` and `updated_by` fields that reference the users table:
- `created_by UUID REFERENCES users(id)`
- `updated_by UUID REFERENCES users(id)`

This allows tracking who created/modified records in:
- building_structures
- land_improvements
- machinery
- audit_logs

## Next Steps

1. Run the SQL to create the users table
2. Create your first admin user in Supabase Auth
3. Manually update that user's role to 'admin' in the users table
4. Use the admin account to create other users via API

## Making First Admin

After creating your first user via signup, run this SQL:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Then refresh your session and you'll have admin access.
