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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SettingsFormData } from '@/lib/validations';
import { Cloud, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

export default function AdvanceSettings({
  handleBooleanChange
}: {
  handleBooleanChange: (path: string, value: boolean) => void;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext<SettingsFormData>();
  const watchedValues = watch();

  const [showCloudinarySecrets, setShowCloudinarySecrets] = useState({
    apiKey: false,
    apiSecret: false
  });

  const toggleCloudinarySecretVisibility = (field: 'apiKey' | 'apiSecret') => {
    setShowCloudinarySecrets((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Analytics Card - Remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>
            Configure analytics tracking for your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-analytics">Google Analytics ID</Label>
            <Input
              id="google-analytics"
              {...register('advanced.analytics.googleAnalyticsId')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook-pixel">Facebook Pixel ID</Label>
            <Input
              id="facebook-pixel"
              {...register('advanced.analytics.facebookPixelId')}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="enable-analytics" className="font-medium">
                Enable Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Track visitor and conversion data
              </p>
            </div>
            <Switch
              id="enable-analytics"
              checked={watchedValues.advanced?.analytics?.enabled}
              onCheckedChange={(value) =>
                handleBooleanChange('advanced.analytics.enabled', value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Cloudinary Card - NEW */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Cloudinary Configuration
          </CardTitle>
          <CardDescription>
            Configure your Cloudinary account for image storage and
            optimization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cloudinary-cloud-name">Cloud Name</Label>
              <Input
                id="cloudinary-cloud-name"
                {...register('advanced.cloudinary.cloudName')}
                placeholder="your-cloud-name"
              />
              {errors.advanced?.cloudinary?.cloudName && (
                <p className="text-sm text-red-500">
                  {errors.advanced.cloudinary.cloudName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudinary-folder">Default Folder</Label>
              <Input
                id="cloudinary-folder"
                {...register('advanced.cloudinary.folder')}
                placeholder="ecommerce"
              />
              {errors.advanced?.cloudinary?.folder && (
                <p className="text-sm text-red-500">
                  {errors.advanced.cloudinary.folder.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloudinary-api-key">API Key</Label>
            <div className="relative">
              <Input
                id="cloudinary-api-key"
                type={showCloudinarySecrets.apiKey ? 'text' : 'password'}
                {...register('advanced.cloudinary.apiKey')}
                placeholder="Your Cloudinary API Key"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleCloudinarySecretVisibility('apiKey')}
              >
                {showCloudinarySecrets.apiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.advanced?.cloudinary?.apiKey && (
              <p className="text-sm text-red-500">
                {errors.advanced.cloudinary.apiKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloudinary-api-secret">API Secret</Label>
            <div className="relative">
              <Input
                id="cloudinary-api-secret"
                type={showCloudinarySecrets.apiSecret ? 'text' : 'password'}
                {...register('advanced.cloudinary.apiSecret')}
                placeholder="Your Cloudinary API Secret"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleCloudinarySecretVisibility('apiSecret')}
              >
                {showCloudinarySecrets.apiSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.advanced?.cloudinary?.apiSecret && (
              <p className="text-sm text-red-500">
                {errors.advanced.cloudinary.apiSecret.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cloudinary-upload-preset">Upload Preset</Label>
              <Input
                id="cloudinary-upload-preset"
                {...register('advanced.cloudinary.uploadPreset')}
                placeholder="Optional upload preset"
              />
            </div>
            <div className="flex items-center justify-between space-x-2 pt-6">
              <div>
                <Label htmlFor="cloudinary-secure" className="font-medium">
                  Secure URLs
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use HTTPS for image delivery
                </p>
              </div>
              <Switch
                id="cloudinary-secure"
                checked={watchedValues.advanced?.cloudinary?.secure}
                onCheckedChange={(value) =>
                  handleBooleanChange('advanced.cloudinary.secure', value)
                }
              />
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h4 className="mb-2 text-sm font-medium">
              Cloudinary Setup Instructions:
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>1. Sign up for a Cloudinary account at cloudinary.com</li>
              <li>2. Find your credentials in the Cloudinary Dashboard</li>
              <li>3. Enter your Cloud Name, API Key, and API Secret above</li>
              <li>
                4. Set up upload presets in your Cloudinary dashboard if needed
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Card - Remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>
            Configure API settings for your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              {...register('advanced.api.apiKey')}
            />
            {errors.advanced?.api?.apiKey && (
              <p className="text-sm text-red-500">
                {errors.advanced.api.apiKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              {...register('advanced.api.webhookUrl')}
              placeholder="https://example.com/webhook"
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="webhooks-enabled" className="font-medium">
                Enable Webhooks
              </Label>
              <p className="text-sm text-muted-foreground">
                Send webhook notifications for store events
              </p>
            </div>
            <Switch
              id="webhooks-enabled"
              checked={watchedValues.advanced?.api?.webhooksEnabled}
              onCheckedChange={(value) =>
                handleBooleanChange('advanced.api.webhooksEnabled', value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Cache & Performance Card - Remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>Cache & Performance</CardTitle>
          <CardDescription>
            Configure caching and performance settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="enable-cache" className="font-medium">
                Enable Page Caching
              </Label>
              <p className="text-sm text-muted-foreground">
                Cache pages to improve loading speed
              </p>
            </div>
            <Switch
              id="enable-cache"
              checked={watchedValues.advanced?.performance?.pageCaching}
              onCheckedChange={(value) =>
                handleBooleanChange('advanced.performance.pageCaching', value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-duration">Cache Duration (minutes)</Label>
            <Input
              id="cache-duration"
              type="number"
              {...register('advanced.performance.cacheDuration', {
                valueAsNumber: true
              })}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="image-optimization" className="font-medium">
                Image Optimization
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically optimize uploaded images
              </p>
            </div>
            <Switch
              id="image-optimization"
              checked={watchedValues.advanced?.performance?.imageOptimization}
              onCheckedChange={(value) =>
                handleBooleanChange(
                  'advanced.performance.imageOptimization',
                  value
                )
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="minify-assets" className="font-medium">
                Minify CSS/JS
              </Label>
              <p className="text-sm text-muted-foreground">
                Minify CSS and JavaScript files
              </p>
            </div>
            <Switch
              id="minify-assets"
              checked={watchedValues.advanced?.performance?.minifyAssets}
              onCheckedChange={(value) =>
                handleBooleanChange('advanced.performance.minifyAssets', value)
              }
            />
          </div>

          <Button variant="outline">Clear Cache</Button>
        </CardContent>
      </Card>

      {/* Maintenance Mode Card - Remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Configure maintenance mode settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="maintenance-mode" className="font-medium">
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Temporarily disable your store for maintenance
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={watchedValues.advanced?.maintenance?.enabled}
              onCheckedChange={(value) =>
                handleBooleanChange('advanced.maintenance.enabled', value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              rows={3}
              {...register('advanced.maintenance.message')}
            />
            {errors.advanced?.maintenance?.message && (
              <p className="text-sm text-red-500">
                {typeof errors.advanced?.maintenance?.message === 'object' &&
                  errors.advanced.maintenance.message.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="admin-access" className="font-medium">
                Allow Admin Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow administrators to access the site during maintenance
              </p>
            </div>
            <Switch
              id="admin-access"
              checked={watchedValues.advanced?.maintenance?.allowAdminAccess}
              onCheckedChange={(value) =>
                handleBooleanChange(
                  'advanced.maintenance.allowAdminAccess',
                  value
                )
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
