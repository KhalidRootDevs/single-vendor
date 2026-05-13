'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DatePicker } from '@/components/ui/date-picker';
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Loader2,
  ShoppingBag,
  DollarSign,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// ─── types ───────────────────────────────────────────────────────────────────

interface AccountStats {
  totalOrders: number;
  totalSpent: number;
  addressCount: number;
}

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDateForInput(dateString: string | Date | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  value,
  label,
  loading
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <Icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
      {loading ? (
        <div className="mx-auto mb-1 h-7 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });

  const [stats, setStats] = useState<AccountStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        dateOfBirth: user.dateOfBirth
          ? formatDateForInput(user.dateOfBirth)
          : ''
      });
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const res = await fetch('/api/user/stats', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load stats');
      setStats(data);
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name is required.',
        variant: 'destructive'
      });
      return;
    }
    if (!formData.email.trim()) {
      toast({
        title: 'Validation error',
        description: 'Email is required.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          dateOfBirth: formData.dateOfBirth
            ? new Date(formData.dateOfBirth)
            : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update profile');

      await checkAuth();
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your information has been saved.'
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to update profile.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        dateOfBirth: user.dateOfBirth
          ? formatDateForInput(user.dateOfBirth)
          : ''
      });
    }
    setIsEditing(false);
  };

  const setField =
    (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await fetch('/api/auth/send-verification', {
        method: 'POST',
        credentials: 'include'
      });
      setResendDone(true);
    } catch {
      // noop
    } finally {
      setResendLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!user.emailVerified && (
        <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {resendDone
              ? 'Verification email sent — check your inbox.'
              : 'Your email address is not verified.'}
          </span>
          {!resendDone && (
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="shrink-0 font-medium underline underline-offset-4 hover:opacity-70 disabled:opacity-50"
            >
              {resendLoading ? 'Sending…' : 'Resend email'}
            </button>
          )}
        </div>
      )}
      {/* Profile information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit className="mr-2 h-4 w-4" aria-hidden />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" aria-hidden />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                  )}
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={undefined} alt={user.name} />
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <div>
                <Button variant="outline" size="sm" disabled>
                  Change Photo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Coming soon
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={setField('name')}
                  disabled={!isEditing || isSaving}
                  className="pl-9"
                  placeholder="Enter your full name"
                  required
                  minLength={2}
                  aria-required
                />
              </div>
              {isEditing && !formData.name.trim() && (
                <p className="text-sm text-destructive">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={setField('email')}
                  disabled={!isEditing || isSaving}
                  className="pl-9"
                  placeholder="Enter your email address"
                  required
                  aria-required
                />
              </div>
              {isEditing && !formData.email.trim() && (
                <p className="text-sm text-destructive">Email is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={setField('phone')}
                  disabled={!isEditing || isSaving}
                  className="pl-9"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, dateOfBirth: date }))
                }
                disabled={!isEditing || isSaving}
                placeholder="Select date of birth"
                maxDate={new Date()}
              />
            </div>
          </div>

          {isEditing && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Changing your email may require
                re-verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Your account activity overview</CardDescription>
            </div>
            {statsError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStats}
                aria-label="Retry loading stats"
              >
                <AlertCircle className="mr-1.5 h-4 w-4 text-destructive" />
                Retry
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatItem
              icon={ShoppingBag}
              label="Total Orders"
              value={String(stats?.totalOrders ?? 0)}
              loading={statsLoading}
            />
            <StatItem
              icon={DollarSign}
              label="Total Spent"
              value={formatCurrency(stats?.totalSpent ?? 0)}
              loading={statsLoading}
            />
            <StatItem
              icon={MapPin}
              label="Saved Addresses"
              value={String(stats?.addressCount ?? 0)}
              loading={statsLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
