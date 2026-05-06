'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';

// Dismiss tracking — stop prompting after 3 dismissals within 24h
const DISMISS_KEY = 'gsi_dismiss_count';
const DISMISS_TS_KEY = 'gsi_dismiss_ts';
const MAX_DISMISSALS = 3;
const DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000;

function shouldShowOneTap(): boolean {
  try {
    const count = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    const ts = Number(localStorage.getItem(DISMISS_TS_KEY) ?? '0');
    const windowExpired = Date.now() - ts > DISMISS_WINDOW_MS;

    if (windowExpired) {
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_TS_KEY);
      return true;
    }

    return count < MAX_DISMISSALS;
  } catch {
    return true;
  }
}

function recordDismissal() {
  try {
    const count = Number(localStorage.getItem(DISMISS_KEY) ?? '0');
    localStorage.setItem(DISMISS_KEY, String(count + 1));
    localStorage.setItem(DISMISS_TS_KEY, String(Date.now()));
  } catch {
    // localStorage not available — ignore
  }
}

// GIS type declarations
interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface PromptMomentNotification {
  getMomentType(): 'display' | 'skipped' | 'dismissed';
  isDismissedMoment(): boolean;
  isSkippedMoment(): boolean;
  getDismissedReason(): string;
  getSkippedReason(): string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: 'signin' | 'signup' | 'use';
            itp_support?: boolean;
          }): void;
          prompt(
            momentListener?: (notification: PromptMomentNotification) => void
          ): void;
          cancel(): void;
        };
      };
    };
  }
}

export function GoogleOneTap() {
  const { user, checkAuth } = useAuth();
  const initialized = useRef(false);

  const initOneTap = () => {
    if (
      initialized.current ||
      user ||
      !window.google?.accounts?.id ||
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    ) {
      return;
    }

    if (!shouldShowOneTap()) return;

    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: true,
      cancel_on_tap_outside: true,
      context: 'signin',
      itp_support: true
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
        recordDismissal();
      }
    });
  };

  const handleCredentialResponse = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error('Sign-in failed. Please try again.');
      return;
    }

    try {
      const res = await fetch('/api/auth/google/one-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessages: Record<string, string> = {
          account_suspended:
            'Your account has been suspended. Please contact support.',
          'Token audience mismatch': 'Sign-in failed. Please try again.',
          'Invalid token issuer': 'Sign-in failed. Please try again.',
          'Token expired': 'Sign-in session expired. Please try again.'
        };
        toast.error(
          errorMessages[data.error] ?? 'Sign-in failed. Please try again.'
        );
        return;
      }

      await checkAuth();
      toast.success(`Welcome, ${data.user.name}!`);
    } catch {
      toast.error('Sign-in failed. Please try again.');
    }
  };

  // Re-initialize when user logs out (user becomes null)
  useEffect(() => {
    if (!user) {
      initialized.current = false;
    }
  }, [user]);

  // Don't render anything for authenticated users
  if (user) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initOneTap}
    />
  );
}
