# Qwen Code Interaction Customization

This file is used to customize interactions with Qwen Code for the `netra-ai` project.

## Project Overview

- **Root Directory**: `C:\Users\bkr72\OneDrive\Desktop\Work\netra-ai`
- **Frontend Framework**: React (TypeScript)
- **Backend Framework**: Node.js (TypeScript)
- **Build Tool**: Rsbuild
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS
- **Linting/Formatting**: Biome.js, Prettier, ESLint

## Customization Points

### File Ignoring
- `.gitignore` and `.prettierignore` are respected by default.
- Specific patterns can be added here if needed for Qwen Code interactions.

### Preferred Libraries
- For frontend: React, Tailwind CSS, shadcn/ui components.
- For backend: Node.js, Express.js (if used), standard libraries.
- For utilities: Lodash (if used), classnames, etc.

### UI Components
- For UI components, use the pre-built shadcn/ui components located in `@/components/ui`. These components are styled with Tailwind CSS and provide a consistent look and feel.
- When creating new components, prefer composing existing shadcn/ui components or creating new components in the `@/components/ui` directory following the established patterns.
- For larger, self-contained UI sections or features (e.g., a patient dashboard section, an appointment calendar, a modal dialog), create dedicated components within the `@/components` directory, organizing them into subdirectories by feature or type (e.g., `@/components/dashboard`, `@/components/calendar`, `@/components/modals`). These components can then utilize the atomic `@/components/ui` elements.

### Utility Functions and Lib Utilities
- Reusable utility functions and logic related to side effects should be placed in the `@/lib` directory.
- When adding new utility functions, follow the existing patterns in files like `utils.ts` (e.g., `cn` function for `clsx` and `tailwind-merge`).
- For complex logic or side effects (e.g., API request helpers, Supabase interactions, mock data), create or extend modules within `@/lib`.
- The `@/lib` directory serves as the central location for shared, non-component-specific logic.

### Coding Style
- Follow the styles defined in `biome.json`, `.prettierrc`, and `eslint.config.mjs`.
- Use functional components in React.
- Prefer TypeScript interfaces and types.
- Use async/await for asynchronous operations.

### Testing
- If tests are added, they should follow the project's existing patterns (e.g., if using Jest, Vitest, or another framework).

### Deployment
- Any specific deployment instructions or environment variables should be noted here.

### Custom Hooks

#### General Hook Creation

- Place custom React hooks in the `@/hooks` directory.
- Use the `use` prefix for hook names (e.g., `useLocalStorage`, `useToggle`).
- Leverage existing hooks like `useToast` from `@/hooks/use-toast` for displaying notifications.
- For data fetching and state management related to Supabase, prefer using the hooks provided in `@/hooks/useSupabase.ts` (e.g., `useSupabaseQuery`, `useSupabaseMutation`) which integrate with `@tanstack/react-query`.

#### Supabase Hooks (`@/hooks/useSupabase.ts`)

This file contains a collection of hooks specifically designed to interact with Supabase services, integrating tightly with `@tanstack/react-query` for efficient data fetching, caching, and mutations.

**Available Hooks:**

1.  **`useAuth`**: Manages the Supabase authentication state, providing `user`, `session`, and `loading` status. It also offers wrapped `signUp`, `signIn`, and `signOut` functions that include toast notifications for user feedback. *Note: This hook is distinct from the one in `@/hooks/useAuth.ts` and the context in `@/components/auth/AuthProvider.tsx`. It's an older version and primarily used within the Supabase hook file itself for toast integration.*
2.  **`useSupabaseQuery(table, columns?, filters?)`**: Fetches data from a specified Supabase table.
    *   Uses `@tanstack/react-query`'s `useQuery`.
    *   Query key: `['supabase', table, columns, filters]`.
    *   Automatically selects the `data` property from the Supabase response.
    *   Default `staleTime`: 5 minutes.
3.  **`useSupabaseMutation(table, operation)`**: Performs `insert`, `update`, or `delete` operations on a Supabase table.
    *   Uses `@tanstack/react-query`'s `useMutation`.
    *   Automatically invalidates related `useSupabaseQuery` cache entries on success or error.
    *   Displays success or error toasts using `useToast`.
4.  **`useSupabaseSubscription(table, callback?)`**: Sets up a real-time subscription to a Supabase table.
    *   Uses `useEffect` to manage the subscription lifecycle.
    *   Automatically invalidates related `useSupabaseQuery` cache entries when data changes.
    *   Accepts an optional custom callback for handling the payload.
5.  **`useSupabaseStorage(bucket)`**: Provides functions for interacting with Supabase Storage.
    *   `uploadFile({ path, file })`: Uploads a file to the specified bucket and path.
    *   `deleteFile(paths)`: Deletes files from the specified bucket.
    *   `getPublicUrl(path)`: Gets the public URL for a file in the bucket.
    *   Includes toast notifications for upload and delete operations.

These hooks abstract away the direct Supabase client calls and provide a more React-friendly, query-managed interface for data interactions.

#### Toast Hook (`@/hooks/use-toast.ts`)

- Use `useToast` to display notifications to the user.
- Import `toast` function from `@/hooks/use-toast` to trigger a toast message.
- The `Toaster` component (from `@/components/ui/toaster`) must be rendered in the application tree (typically in `App.tsx` or `main.tsx`) to display the toasts.

#### Mobile Detection Hook (`@/hooks/use-mobile.tsx`)

- Use `useIsMobile` to determine if the current viewport is considered mobile (based on a `768px` breakpoint).
- Returns a boolean indicating if the device is mobile.

#### Authentication Hook (`src/hooks/useAuth.ts`)

For authentication-related functionality in components, use the `useAuth` hook located at `src/hooks/useAuth.ts`. This hook consumes `useAuthContext` and provides a higher-level API for common authentication actions with integrated navigation.

**Key Functions:**
*   `loginAndRedirect(email, password, redirectTo)`: Attempts to sign in a user and redirects upon success.
*   `signUpAndRedirect(email, password, userData, redirectTo)`: Attempts to sign up a new user and redirects upon success.
*   `logoutAndRedirect(redirectTo)`: Signs out the current user and redirects.
*   `isAuthenticated`: A boolean indicating if a user is currently authenticated.

This hook integrates with `wouter` for navigation.

## Notes
- Always run `pnpm install` after pulling changes to ensure dependencies are up-to-date.
- Use `pnpm run dev` to start the development server.
- Use `pnpm run build` to create a production build.
- Use `pnpm run lint` and `pnpm run format` to check and fix code style issues.

## Author
- Name: Bilal Ullah Khan
- Contact: bkr7250@gmail.comshould 

## Last Updated
- Date: Friday, 29 August 2025