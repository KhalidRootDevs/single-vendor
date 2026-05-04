'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// ─── types ───────────────────────────────────────────────────────────────────

interface Preferences {
  newsletter: boolean;
  marketing: boolean;
  notifications: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Preferences = {
  newsletter: true,
  marketing: false,
  notifications: true
};

function PreferenceRow({
  id,
  icon: Icon,
  label,
  description,
  checked,
  disabled,
  onChange
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div>
          <Label htmlFor={id} className="cursor-pointer font-medium">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const isDirty =
    prefs.newsletter !== saved.newsletter ||
    prefs.marketing !== saved.marketing ||
    prefs.notifications !== saved.notifications;

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch('/api/user/preferences', {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load preferences');
      const loaded: Preferences = {
        newsletter: data.preferences.newsletter ?? true,
        marketing: data.preferences.marketing ?? false,
        notifications: data.preferences.notifications ?? true
      };
      setPrefs(loaded);
      setSaved(loaded);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save preferences');

      const updated: Preferences = {
        newsletter: data.preferences.newsletter,
        marketing: data.preferences.marketing,
        notifications: data.preferences.notifications
      };
      setPrefs(updated);
      setSaved(updated);

      toast({
        title: 'Preferences saved',
        description: 'Your notification settings have been updated.'
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to save preferences.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setPrefs({ ...saved });

  const set = (field: keyof Preferences) => (value: boolean) =>
    setPrefs((prev) => ({ ...prev, [field]: value }));

  const controlsDisabled = loading || saving;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Failed to load preferences.</p>
        <Button variant="outline" onClick={fetchPreferences}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage how we communicate with you via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PreferenceRow
            id="newsletter"
            icon={Mail}
            label="Newsletter"
            description="Weekly updates, curated picks, and store news"
            checked={prefs.newsletter}
            disabled={controlsDisabled}
            onChange={set('newsletter')}
          />
          <PreferenceRow
            id="marketing"
            icon={ShoppingBag}
            label="Promotions & Offers"
            description="Sales, discount codes, new arrivals, and price drop alerts"
            checked={prefs.marketing}
            disabled={controlsDisabled}
            onChange={set('marketing')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order & Account Notifications</CardTitle>
          <CardDescription>
            Transactional updates about your orders and account activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferenceRow
            id="notifications"
            icon={Bell}
            label="Order & Delivery Updates"
            description="Shipping confirmations, delivery status, and order changes"
            checked={prefs.notifications}
            disabled={controlsDisabled}
            onChange={set('notifications')}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {isDirty && (
          <Button
            variant="outline"
            onClick={handleDiscard}
            disabled={controlsDisabled}
          >
            Discard changes
          </Button>
        )}
        <Button onClick={handleSave} disabled={!isDirty || controlsDisabled}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
}
