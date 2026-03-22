import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import {
  AdminLoginFormValues,
  adminLoginSchema
} from '@/lib/validations/index';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function AdminLoginForm() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setError(null);
    const success = await login(data.email, data.password);

    if (!success) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/admin/dashboard');
    }
  };

  // One-click development login
  const handleDevLogin = async () => {
    setError(null);
    const devEmail = 'admin@example.com';
    const devPassword = 'admin@example.com';

    // Optionally fill the form fields for visual feedback
    setValue('email', devEmail);
    setValue('password', devPassword);

    const success = await login(devEmail, devPassword);

    if (!success) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert
          variant="destructive"
          className="border-red-500/20 bg-red-500/10"
        >
          <AlertDescription className="text-sm text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-slate-300">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@example.com"
          className="h-11 border-slate-700 bg-slate-900/50 text-white transition-colors placeholder:text-slate-500 focus:border-purple-500"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="password"
          className="text-sm font-medium text-slate-300"
        >
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="h-11 border-slate-700 bg-slate-900/50 pr-10 text-white transition-colors placeholder:text-slate-500 focus:border-purple-500"
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 text-slate-400 hover:bg-transparent hover:text-slate-300"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-11 w-full bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:from-purple-700 hover:to-blue-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in to Admin'
        )}
      </Button>

      {/* Development Login Button */}
      <Button
        type="button"
        onClick={handleDevLogin}
        disabled={isLoading}
        className="h-11 w-full border border-slate-700 bg-slate-800/50 font-medium text-slate-300 transition-all duration-200 hover:bg-slate-800 hover:text-white"
        variant="outline"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          '🔧 Quick Dev Login (admin@example.com)'
        )}
      </Button>
    </form>
  );
}
