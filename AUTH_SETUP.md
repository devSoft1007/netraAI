# Authentication Setup Guide for Netra AI

## Overview
This guide explains the complete authentication system implemented using Supabase for your Netra AI application.

## Features Implemented

### 1. **AuthProvider Context**
- Centralized authentication state management
- Auto-refresh tokens
- Session persistence
- Auth state listeners

### 2. **Route Protection**
- **ProtectedRoute**: Wraps private routes requiring authentication
- **PublicRoute**: Wraps public routes (login/signup) with optional redirect when authenticated

### 3. **Custom Hooks**
- **useAuth**: Main auth hook with login/logout/signup functions
- **useAuthContext**: Direct access to auth context

### 4. **Environment Configuration**
- Proper Vite environment variable handling
- Fallback for different environments

## Implementation Details

### Route Structure:
```
Public Routes (No Auth Required):
- /login
- /signup  
- /registration-success (can be accessed when authenticated)

Protected Routes (Auth Required):
- / (Dashboard)
- /dashboard
- /patients
- /appointments
- /procedures
- /ai-diagnosis
- /billing
```

### Authentication Flow:
1. User visits a protected route
2. ProtectedRoute checks authentication status
3. If not authenticated → redirect to /login
4. If authenticated → render the component
5. If loading → show loading spinner

### Key Components:

#### **AuthProvider** (`src/components/auth/AuthProvider.tsx`)
- Wraps the entire app
- Manages user session state
- Provides auth functions (signIn, signUp, signOut, resetPassword)

#### **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
- Protects routes requiring authentication
- Shows loading state during auth check
- Redirects unauthenticated users to login

#### **PublicRoute** (`src/components/auth/PublicRoute.tsx`)
- For login/signup pages
- Can redirect authenticated users to dashboard
- Optional restriction when already authenticated

#### **useAuth Hook** (`src/hooks/useAuth.ts`)
- Convenience functions with automatic redirects
- `loginAndRedirect(email, password, redirectTo)`
- `signUpAndRedirect(email, password, userData, redirectTo)`
- `logoutAndRedirect(redirectTo)`

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Project Setup
1. Create a Supabase project at https://supabase.com
2. Go to Settings > API to get your URL and anon key
3. Set up authentication in the Supabase dashboard
4. Configure email templates, redirect URLs, etc.

### 3. Database Schema (Optional)
If you need user profiles, create a profiles table:
```sql
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);
```

### 4. Usage Examples

#### In Login Component:
```tsx
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { loginAndRedirect } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await loginAndRedirect(email, password, '/dashboard');
    if (error) {
      // Handle error
    }
  };
}
```

#### In Any Component (Check Auth Status):
```tsx
import { useAuth } from '@/hooks/useAuth';

export default function SomeComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Welcome {user.email}!</div>;
}
```

#### In Header (Logout):
```tsx
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { logoutAndRedirect } = useAuth();
  
  const handleLogout = async () => {
    await logoutAndRedirect('/login');
  };
}
```

## Security Features

### 1. **Auto Token Refresh**
- Supabase handles token refresh automatically
- Sessions persist across browser restarts

### 2. **Route Protection**
- All sensitive routes are wrapped with ProtectedRoute
- Automatic redirects for unauthorized access

### 3. **Session Management**
- Secure session storage
- Automatic cleanup on logout

### 4. **Error Handling**
- Comprehensive error handling in all auth functions
- User-friendly error messages

## Best Practices Implemented

1. **Loading States**: Proper loading indicators during auth operations
2. **Error Handling**: Consistent error handling across all auth functions
3. **Type Safety**: Full TypeScript support with proper types
4. **Security**: Row Level Security ready, secure session management
5. **UX**: Smooth redirects and loading states

## Customization Options

### Custom Redirect Logic:
```tsx
// Redirect to specific page after login based on user role
const handleLogin = async (email: string, password: string) => {
  const { error } = await loginAndRedirect(
    email, 
    password, 
    user?.role === 'admin' ? '/admin' : '/dashboard'
  );
};
```

### Custom Loading Component:
```tsx
<ProtectedRoute fallback={<CustomLoadingSpinner />}>
  <YourComponent />
</ProtectedRoute>
```

### Password Reset:
```tsx
const { resetPassword } = useAuth();

const handlePasswordReset = async (email: string) => {
  const { error } = await resetPassword(email);
  // Handle result
};
```

This implementation provides a robust, secure, and user-friendly authentication system for your medical application.
