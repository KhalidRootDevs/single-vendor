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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SettingsFormData } from '@/lib/validations';
import { useFormContext } from 'react-hook-form';

export default function EmailSettings({
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

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>
            Configure your email service provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-provider">Email Service</Label>
            <Select
              value={watchedValues.email?.provider?.service}
              onValueChange={(value: any) =>
                setValue('email.provider.service', value)
              }
            >
              <SelectTrigger id="email-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailchimp">Mailchimp</SelectItem>
                <SelectItem value="aws-ses">Amazon SES</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watchedValues.email?.provider?.service === 'smtp' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  {...register('email.provider.smtp.host')}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    {...register('email.provider.smtp.port', {
                      valueAsNumber: true
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-security">Security</Label>
                  <Select
                    value={watchedValues.email?.provider?.smtp?.security}
                    onValueChange={(value: any) =>
                      setValue('email.provider.smtp.security', value)
                    }
                  >
                    <SelectTrigger id="smtp-security">
                      <SelectValue placeholder="Select security" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-username">SMTP Username</Label>
                <Input
                  id="smtp-username"
                  {...register('email.provider.smtp.username')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  {...register('email.provider.smtp.password')}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="test-email" className="font-medium">
                Test Email Configuration
              </Label>
              <p className="text-sm text-muted-foreground">
                Send a test email to verify settings
              </p>
            </div>
            <Button variant="outline">Send Test Email</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure automated email notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="order-confirmation" className="font-medium">
                  Order Confirmation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email when an order is placed
                </p>
              </div>
              <Switch
                id="order-confirmation"
                checked={watchedValues.email?.notifications?.orderConfirmation}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.orderConfirmation',
                    value
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="shipping-confirmation" className="font-medium">
                  Shipping Confirmation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email when an order ships
                </p>
              </div>
              <Switch
                id="shipping-confirmation"
                checked={
                  watchedValues.email?.notifications?.shippingConfirmation
                }
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.shippingConfirmation',
                    value
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="order-canceled" className="font-medium">
                  Order Canceled
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email when an order is canceled
                </p>
              </div>
              <Switch
                id="order-canceled"
                checked={watchedValues.email?.notifications?.orderCanceled}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.orderCanceled',
                    value
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="customer-account" className="font-medium">
                  Customer Account
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email when a customer creates an account
                </p>
              </div>
              <Switch
                id="customer-account"
                checked={watchedValues.email?.notifications?.customerAccount}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.customerAccount',
                    value
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="password-reset" className="font-medium">
                  Password Reset
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email for password reset requests
                </p>
              </div>
              <Switch
                id="password-reset"
                checked={watchedValues.email?.notifications?.passwordReset}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.passwordReset',
                    value
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="abandoned-cart" className="font-medium">
                  Abandoned Cart
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send reminder emails for abandoned carts
                </p>
              </div>
              <Switch
                id="abandoned-cart"
                checked={watchedValues.email?.notifications?.abandonedCart}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'email.notifications.abandonedCart',
                    value
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
