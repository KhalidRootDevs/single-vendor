'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UNAUTHORIZED_EVENT } from '@/lib/api-fetch';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  email_not_verified: 'Your Google account email is not verified.',
  account_suspended: 'Your account has been suspended. Please contact support.',
  server_error: 'Something went wrong during sign-in. Please try again.'
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator' | 'support';
  phone?: string;
  dateOfBirth?: Date;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  /** True once the initial session check has completed. Gate any auth-dependent UI on this. */
  isAuthReady: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loginWithGoogle: () => void;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Re-fetches user from the database. Call on profile/settings pages for fresh data. */
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();

  // Fast session check — reads JWT without hitting the database.
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  // Full DB refresh — use on profile/settings pages when you need the latest data.
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
          setUser(data.user as AuthUser);
          return { ok: true };
        }

        return { ok: false, error: data.error ?? 'Invalid email or password.' };
      } catch {
        return { ok: false, error: 'Network error. Please try again.' };
      }
    },
    []
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          setUser(data.user as AuthUser);
          return { ok: true };
        }

        return { ok: false, error: data.error ?? 'Registration failed.' };
      } catch {
        return { ok: false, error: 'Network error. Please try again.' };
      }
    },
    []
  );

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Clear client state even if the server call fails
    } finally {
      setUser(null);
    }
  }, []);

  // Run the session check once on mount and handle Google OAuth redirect params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError || params.get('auth_success')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (authError) {
      toast.error(
        AUTH_ERROR_MESSAGES[authError] ?? 'Sign-in failed. Please try again.'
      );
    }
    checkAuth();
  }, [checkAuth]);

  // Global 401 handler — any API returning 401 triggers logout + smart redirect.
  useEffect(() => {
    const handleUnauthorized = async () => {
      await logout();
      const isAdminPath = window.location.pathname.startsWith('/admin');
      router.push(isAdminPath ? '/admin-login' : '/');
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [logout, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthReady,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
