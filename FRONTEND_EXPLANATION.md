# Frontend Structure & Authentication Flow Explanation

## 📁 Overall Project Structure

```
frontend/
├── app/                          # Next.js App Router (Pages & Routes)
│   ├── (auth)/                  # Authentication routes group
│   │   ├── login/page.tsx       # Login page
│   │   ├── signup/page.tsx      # Signup page
│   │   ├── layout.tsx           # Auth layout (background, theme toggle)
│   │   └── ...
│   ├── interface/               # Protected application routes
│   │   ├── home/page.tsx        # Home page after login
│   │   └── layout.tsx           # Protected layout wrapper
│   ├── page.tsx                 # Landing page (public)
│   ├── layout.tsx               # Root layout (Theme, Loading, RouteTransition)
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx        # Login form component
│   │   ├── SignupForm.tsx       # Signup form component
│   │   ├── ProtectedRoute.tsx   # Route protection wrapper
│   │   └── SocialLogin.tsx      # Social auth buttons
│   ├── landing/                 # Landing page components
│   ├── form/                    # Reusable form components
│   ├── ui/                      # shadcn/ui components (60+ files)
│   └── layout/                  # Layout components
│
├── lib/                         # Utility libraries
│   ├── api/                     # API service functions
│   │   └── user-service/        # User & auth API calls
│   │       └── auth.ts          # Login, signup, token refresh
│   ├── config/                  # Configuration files
│   └── utils/                   # Helper functions
│
├── hooks/                       # Custom React Hooks
│   └── useAuth.ts               # Authentication state hook
│
├── contexts/                    # React Context Providers
│   ├── LoadingContext.tsx       # Loading state management
│   ├── SettingsContext.tsx      # App settings
│   └── TooltipContext.tsx       # Tooltip management
│
├── constants/                    # Constants & Configuration
│   └── auth.ts                  # Auth-related constants
│
├── types/                       # TypeScript type definitions
│   └── auth.ts                  # Auth types (LoginFormData, etc.)
│
├── middleware.ts                # Next.js middleware (route protection)
└── package.json                 # Dependencies
```

---

## 🔐 Authentication Flow - Step by Step

### **1. User Registration (Signup)**

**File: `app/(auth)/signup/page.tsx`**
- Renders the signup page with `SignupForm` component

**File: `components/auth/SignupForm.tsx`**
- **What it does:**
  - Collects user email, password, confirm password
  - Validates form (email format, password length, password match)
  - Calls `signup()` API function
  - On success: Redirects to email verification page
  - On failure: Shows error toast

**File: `lib/api/user-service/auth.ts` → `signup()` function**
- **What it does:**
  - Sends POST request to `/api/v1/auth/register`
  - Backend creates user account
  - Backend sends verification email automatically
  - Returns `{ success: true, requiresVerification: true }`

**Flow:**
```
User fills form → SignupForm validates → API call → Backend creates user → 
Email sent → Redirect to /verify-email
```

---

### **2. User Login**

**File: `app/(auth)/login/page.tsx`**
- Renders the login page with `LoginForm` component

**File: `components/auth/LoginForm.tsx`**
- **What it does:**
  - Collects email and password
  - Validates form
  - Calls `login()` API function
  - On success:
    - Stores token in `localStorage` (`scholarai_token`)
    - Stores user data in `localStorage` (`scholarai_user`)
    - Updates auth state via `useAuth` hook
    - Redirects based on user role:
      - Admin → `/admin`
      - Regular user → `/interface/home`
  - Handles email verification requirement
  - Supports social login (Google, GitHub)

**File: `lib/api/user-service/auth.ts` → `login()` function**
- **What it does:**
  1. Checks if email is verified (calls `checkEmailStatus()`)
  2. If not verified → Returns `requiresEmailVerification: true`
  3. If verified → Sends POST to `/api/v1/auth/login`
  4. Backend validates credentials
  5. Backend returns:
     - `accessToken` (JWT) → Stored in localStorage
     - `refreshToken` → Stored in HttpOnly cookie by backend
  6. Frontend sets refresh token cookie manually (for cross-origin)
  7. Returns token and user data

**Flow:**
```
User enters credentials → LoginForm validates → API checks email status → 
API calls login endpoint → Backend validates → Returns tokens → 
Store in localStorage → Update auth state → Redirect to home
```

---

### **3. Token Storage & Management**

**File: `lib/api/user-service/auth.ts`**

**Token Storage:**
- **Access Token (JWT):** Stored in `localStorage` as `scholarai_token`
  - Used in `Authorization: Bearer <token>` header for API requests
  - Short-lived (expires quickly)
  
- **Refresh Token:** Stored in HttpOnly cookie named `refreshToken`
  - Set by backend automatically
  - Also set manually on frontend for cross-origin support
  - Long-lived (used to get new access tokens)

**Helper Functions:**
- `getAuthToken()` - Gets access token from localStorage
- `getUserData()` - Gets user data from localStorage
- `isAuthenticated()` - Checks if token exists
- `clearAuthData()` - Clears all auth data on logout

---

### **4. Token Refresh (Automatic)**

**File: `lib/api/user-service/auth.ts` → `refreshAccessToken()` function**
- **When it runs:**
  - When access token expires (401 response)
  - On app load if no access token but refresh token exists

**What it does:**
1. Gets refresh token from cookie
2. Sends POST to `/api/v1/auth/refresh` with refresh token
3. Backend validates refresh token
4. Backend returns new access token
5. Stores new access token in localStorage
6. Updates user data if provided

**File: `lib/api/user-service/auth.ts` → `authenticatedFetch()` function**
- **What it does:**
  - Wrapper around `fetch()` that automatically:
    - Adds `Authorization: Bearer <token>` header
    - Handles 401 errors by refreshing token
    - Retries request with new token
    - Redirects to login if refresh fails

---

### **5. Route Protection**

**File: `middleware.ts` (Next.js Middleware)**
- **What it does:**
  - Runs on every request (server-side)
  - Checks if route is public (/, /login, /signup, etc.)
  - For protected routes:
    - Checks for `refreshToken` cookie
    - If missing → Redirects to `/login?session=expired`
    - If present → Allows access

**File: `components/auth/ProtectedRoute.tsx`**
- **What it does:**
  - Client-side route protection wrapper
  - Uses `useAuth()` hook to check authentication
  - Shows loading spinner while checking
  - If not authenticated → Redirects to `/login`
  - If authenticated → Renders children

**File: `app/interface/layout.tsx`**
- **What it does:**
  - Wraps all `/interface/*` routes with `ProtectedRoute`
  - Ensures only authenticated users can access
  - Wraps with `MainLayout` for UI structure

---

### **6. Authentication State Management**

**File: `hooks/useAuth.ts`**
- **What it does:**
  - React hook that manages authentication state
  - On mount:
    - Checks localStorage for token
    - Checks for refresh token cookie
    - If no token but refresh token exists → Attempts refresh
    - Sets initial auth state
  - Listens to storage changes (sync across tabs)
  - Provides:
    - `isAuthenticated` - Boolean
    - `user` - User object
    - `token` - Access token
    - `loading` - Loading state
    - `updateAuthState()` - Update state after login
    - `clearAuth()` - Clear state on logout

**Usage in components:**
```typescript
const { isAuthenticated, user, updateAuthState } = useAuth()
```

---

### **7. Logout**

**File: `lib/api/user-service/auth.ts` → `logout()` function**
- **What it does:**
  1. Calls `/api/v1/auth/logout` endpoint
  2. Backend invalidates refresh token
  3. Frontend clears localStorage (token, user data)
  4. Frontend clears refresh token cookie
  5. Redirects to `/login`

---

## 📄 Key Files Explained

### **Authentication Components**

#### `components/auth/LoginForm.tsx`
- **Purpose:** Login form UI and logic
- **Key Features:**
  - Form validation (email format, required fields)
  - Password visibility toggle
  - Remember me checkbox
  - Social login integration
  - Error handling with toast notifications
  - Redirects based on user role

#### `components/auth/SignupForm.tsx`
- **Purpose:** Registration form UI and logic
- **Key Features:**
  - Email, password, confirm password fields
  - Terms & conditions checkbox
  - Form validation
  - Redirects to email verification

#### `components/auth/ProtectedRoute.tsx`
- **Purpose:** Wrapper component to protect routes
- **How it works:**
  - Checks `isAuthenticated` from `useAuth` hook
  - Shows loading while checking
  - Redirects to login if not authenticated
  - Renders children if authenticated

---

### **API Layer**

#### `lib/api/user-service/auth.ts`
- **Purpose:** All authentication API calls
- **Key Functions:**
  - `login()` - User login
  - `signup()` - User registration
  - `logout()` - User logout
  - `refreshAccessToken()` - Get new access token
  - `authenticatedFetch()` - Fetch with auto token refresh
  - `getAuthToken()` - Get stored token
  - `isAuthenticated()` - Check auth status
  - `clearAuthData()` - Clear all auth data

---

### **State Management**

#### `hooks/useAuth.ts`
- **Purpose:** Central authentication state hook
- **Returns:**
  ```typescript
  {
    isAuthenticated: boolean,
    user: User | null,
    token: string | null,
    loading: boolean,
    updateAuthState: (token, user) => void,
    clearAuth: () => void
  }
  ```

---

### **Route Protection**

#### `middleware.ts`
- **Purpose:** Server-side route protection
- **How it works:**
  1. Runs before every request
  2. Checks if path is in `publicPaths` array
  3. For protected paths, checks for `refreshToken` cookie
  4. Redirects to login if no cookie found

#### `app/interface/layout.tsx`
- **Purpose:** Client-side protection for `/interface/*` routes
- **Wraps:** All interface pages with `ProtectedRoute` component

---

## 🔄 Complete Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> User visits /signup
         ├─> SignupForm renders
         ├─> User fills form → Validates
         ├─> Calls signup() API
         ├─> Backend creates user
         ├─> Backend sends verification email
         └─> Redirects to /verify-email

┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN                              │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> User visits /login
         ├─> LoginForm renders
         ├─> User enters credentials
         ├─> Calls login() API
         │   ├─> Checks email verification status
         │   ├─> Validates credentials
         │   └─> Returns tokens
         ├─> Stores accessToken in localStorage
         ├─> Backend sets refreshToken cookie
         ├─> Updates auth state (useAuth)
         └─> Redirects to /interface/home

┌─────────────────────────────────────────────────────────────┐
│                  PROTECTED ROUTE ACCESS                      │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> User navigates to /interface/*
         ├─> middleware.ts checks refreshToken cookie
         │   └─> If missing → Redirect to /login
         ├─> ProtectedRoute checks isAuthenticated
         │   └─> If false → Redirect to /login
         └─> Renders protected content

┌─────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH                             │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> Access token expires (401 error)
         ├─> authenticatedFetch() catches 401
         ├─> Calls refreshAccessToken()
         │   ├─> Gets refreshToken from cookie
         │   ├─> Calls /api/v1/auth/refresh
         │   └─> Gets new accessToken
         ├─> Stores new token
         └─> Retries original request

┌─────────────────────────────────────────────────────────────┐
│                       LOGOUT                                 │
└─────────────────────────────────────────────────────────────┘
         │
         ├─> User clicks logout
         ├─> Calls logout() API
         ├─> Backend invalidates refreshToken
         ├─> Frontend clears localStorage
         ├─> Frontend clears cookies
         └─> Redirects to /login
```

---

## 🎯 Key Concepts

### **1. Dual Token System**
- **Access Token (JWT):** Short-lived, stored in localStorage, sent in headers
- **Refresh Token:** Long-lived, stored in HttpOnly cookie, used to get new access tokens

### **2. Multi-Layer Protection**
- **Server-side:** `middleware.ts` checks refresh token cookie
- **Client-side:** `ProtectedRoute` checks authentication state
- **API-level:** `authenticatedFetch` handles token refresh automatically

### **3. State Synchronization**
- `useAuth` hook syncs auth state across tabs via storage events
- Token refresh updates state automatically

### **4. Error Handling**
- Network errors → Show toast notification
- 401 errors → Auto-refresh token
- Invalid refresh token → Clear auth & redirect to login

---

## 🚀 How to Explain This to Others

### **Quick Summary:**
1. **Registration:** User signs up → Email verification required → Account created
2. **Login:** User logs in → Tokens stored → Auth state updated → Redirect to home
3. **Protection:** Middleware + ProtectedRoute ensure only authenticated users access protected routes
4. **Token Management:** Access token expires → Auto-refresh using refresh token → Seamless experience
5. **Logout:** Clear all tokens → Redirect to login

### **Key Files to Mention:**
- **Login:** `components/auth/LoginForm.tsx` + `lib/api/user-service/auth.ts` (login function)
- **Signup:** `components/auth/SignupForm.tsx` + `lib/api/user-service/auth.ts` (signup function)
- **Protection:** `middleware.ts` + `components/auth/ProtectedRoute.tsx`
- **State:** `hooks/useAuth.ts`
- **Token Refresh:** `lib/api/user-service/auth.ts` (refreshAccessToken, authenticatedFetch)

---

## 📝 Notes

- All API calls use `credentials: 'include'` to send cookies
- Refresh token is handled by backend as HttpOnly cookie (more secure)
- Access token is in localStorage for easy access in JavaScript
- Email verification is required before login
- Social login (Google/GitHub) follows same token flow
- Middleware runs on server, ProtectedRoute runs on client (double protection)

