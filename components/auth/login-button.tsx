'use client';

import { Button, type ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { LogIn, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LoginButtonProps extends ButtonProps {
  showIcon?: boolean;
  mode?: 'login' | 'register';
}

export function LoginButton({
  showIcon = true,
  mode = 'login',
  children,
  ...props
}: LoginButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Safe access to context
  const modal = useModal();
  const auth = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't attempt to use context values until client-side
  if (!isMounted) {
    return (
      <Button {...props}>
        {showIcon && <LogIn className="mr-2 h-4 w-4" />}
        {children || (mode === 'register' ? 'Register' : 'Login')}
      </Button>
    );
  }

  // Now it's safe to use context values
  if (auth?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/account">
          <Button variant="outline" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            My Account
          </Button>
        </Link>
        <Button onClick={auth.logout} variant="ghost" size="icon" {...props}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    );
  }

  const handleClick = () => {
    if (mode === 'register') {
      modal.openRegisterModal();
    } else {
      modal.openLoginModal();
    }
  };

  return (
    <Button onClick={handleClick} {...props}>
      {showIcon && <LogIn className="mr-2 h-4 w-4" />}
      {children || (mode === 'register' ? 'Register' : 'Login')}
    </Button>
  );
}
