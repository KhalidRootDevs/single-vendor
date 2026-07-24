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
import { RegisterFormValues, registerSchema } from '@/lib/validations/index';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function UserRegisterForm() {
  const { register: registerUser } = useAuth();
  const { isLoginModalOpen, authMode, closeAuthModal, switchAuthMode } =
    useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register: registerRegisterForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await registerUser(data.name, data.email, data.password);
      if (result.ok) {
        resetRegisterForm();
        setSuccess('Registration successful! You are now logged in.');
        setTimeout(() => {
          closeAuthModal();
        }, 1500);
      } else {
        setError(
          result.error ??
            'Email already registered. Please use a different email address.'
        );
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: 'google' | 'facebook' | 'apple'
  ) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate social login - replace with actual OAuth implementation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(`Logging in with ${provider}...`);
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch (err) {
      setError(`Failed to login with ${provider}. Please try again.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setError(null);
    setSuccess(null);
    switchAuthMode('login');
  };

  // Theme-aware styles
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
    <form onSubmit={handleRegisterSubmit(onRegisterSubmit)}>
      <FieldGroup>
        {error && <div className={errorClass}>{error}</div>}

        {success && <div className={successClass}>{success}</div>}

        <Field>
          <Button
            variant="outline"
            type="button"
            className={buttonOutlineClass}
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 h-5 w-5"
            >
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Sign up with Google
          </Button>
        </Field>

        <FieldSeparator
          className={`*:data-[slot=field-separator-content]:bg-background ${textMutedClass}`}
        >
          Or continue with
        </FieldSeparator>

        <Field>
          <FieldLabel htmlFor="register-name" className={textPrimaryClass}>
            Full Name
          </FieldLabel>
          <Input
            id="register-name"
            placeholder="Enter your full name"
            className={inputClass}
            {...registerRegisterForm('name')}
          />
          {registerErrors.name && (
            <p className="mt-1 text-sm text-destructive">
              {registerErrors.name.message}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="register-email" className={textPrimaryClass}>
            Email
          </FieldLabel>
          <Input
            id="register-email"
            type="email"
            placeholder="m@example.com"
            className={inputClass}
            {...registerRegisterForm('email')}
          />
          {registerErrors.email && (
            <p className="mt-1 text-sm text-destructive">
              {registerErrors.email.message}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="register-password" className={textPrimaryClass}>
            Password
          </FieldLabel>
          <Input
            id="register-password"
            type="password"
            placeholder="Create a password"
            className={inputClass}
            {...registerRegisterForm('password')}
          />
          {registerErrors.password && (
            <p className="mt-1 text-sm text-destructive">
              {registerErrors.password.message}
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel
            htmlFor="register-confirmPassword"
            className={textPrimaryClass}
          >
            Confirm Password
          </FieldLabel>
          <Input
            id="register-confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={inputClass}
            {...registerRegisterForm('confirmPassword')}
          />
          {registerErrors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">
              {registerErrors.confirmPassword.message}
            </p>
          )}
        </Field>

        <FieldDescription className={`px-0 text-center ${textMutedClass} `}>
          By clicking continue, you agree to our{' '}
          <a
            href="#"
            className={`${textPrimaryClass} underline-offset-4 hover:underline`}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="#"
            className={`${textPrimaryClass} underline-offset-4 hover:underline`}
          >
            Privacy Policy
          </a>
          .
        </FieldDescription>

        <Field>
          <Button
            type="submit"
            className={buttonPrimaryClass}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          <FieldDescription className={`text-center ${textMutedClass}`}>
            Already have an account?{' '}
            <button
              type="button"
              className={`${textPrimaryClass} cursor-pointer border-none bg-transparent underline-offset-4 hover:underline`}
              onClick={switchToLogin}
            >
              Login
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
