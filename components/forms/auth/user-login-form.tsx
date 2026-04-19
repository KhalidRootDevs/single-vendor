'use client';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { LoginFormValues, loginSchema } from '@/lib/validations/index';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function UserLoginForm() {
  const { login, loginWithGoogle } = useAuth();
  const { closeAuthModal, switchAuthMode } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerLoginForm,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const ok = await login(data.email, data.password);
      if (ok) {
        resetLoginForm();
        setSuccess('Login successful!');
        setTimeout(() => closeAuthModal(), 800);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setError(null);
    loginWithGoogle();
  };

  const switchToRegister = () => {
    setError(null);
    setSuccess(null);
    switchAuthMode('register');
  };

  const buttonOutlineClass =
    'w-full bg-secondary border border-border hover:bg-accent text-foreground h-11';
  const buttonPrimaryClass =
    'w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium';
  const inputClass =
    'bg-background border-border text-foreground placeholder:text-muted-foreground h-10 focus:border-primary';
  const textMutedClass = 'text-muted-foreground';
  const textPrimaryClass = 'text-foreground';
  const errorClass =
    'bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm mb-4';
  const successClass =
    'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4';

  return (
    <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
      <FieldGroup>
        {error && <div className={errorClass}>{error}</div>}
        {success && <div className={successClass}>{success}</div>}

        <Field>
          <Button
            variant="outline"
            type="button"
            className={buttonOutlineClass}
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="mr-2 h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </Field>

        <FieldSeparator
          className={`*:data-[slot=field-separator-content]:bg-background ${textMutedClass}`}
        >
          Or continue with email
        </FieldSeparator>

        <Field>
          <FieldLabel htmlFor="login-email" className={textPrimaryClass}>
            Email
          </FieldLabel>
          <Input
            id="login-email"
            type="email"
            placeholder="m@example.com"
            className={inputClass}
            autoComplete="email"
            {...registerLoginForm('email')}
          />
          {loginErrors.email && (
            <p className="mt-1 text-sm text-destructive">
              {loginErrors.email.message}
            </p>
          )}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="login-password" className={textPrimaryClass}>
              Password
            </FieldLabel>
            <a
              href="/forgot-password"
              className={`ml-auto text-sm ${textMutedClass} underline-offset-4 hover:underline`}
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClass} pr-10`}
              autoComplete="current-password"
              {...registerLoginForm('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {loginErrors.password && (
            <p className="mt-1 text-sm text-destructive">
              {loginErrors.password.message}
            </p>
          )}
        </Field>

        <Field>
          <Button
            type="submit"
            className={buttonPrimaryClass}
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
          <FieldDescription className={`text-center ${textMutedClass}`}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className={`${textPrimaryClass} cursor-pointer border-none bg-transparent underline-offset-4 hover:underline`}
              onClick={switchToRegister}
            >
              Sign up
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
