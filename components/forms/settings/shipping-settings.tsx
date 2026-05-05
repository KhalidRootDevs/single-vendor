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
import { useFormContext } from 'react-hook-form';

export default function Shipping({
  handleBooleanChange
}: {
  handleBooleanChange: (path: string, value: boolean) => void;
}) {
  const {
    register,
    watch,
    formState: { errors }
  } = useFormContext<SettingsFormData>();
  const watchedValues = watch();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Methods</CardTitle>
          <CardDescription>
            Configure shipping options for your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="free-shipping" className="font-medium">
                  Free Shipping
                </Label>
                <p className="text-sm text-muted-foreground">
                  Offer free shipping to customers
                </p>
              </div>
              <Switch
                id="free-shipping"
                checked={watchedValues.shipping?.methods?.freeShipping?.enabled}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'shipping.methods.freeShipping.enabled',
                    value
                  )
                }
              />
            </div>
            {watchedValues.shipping?.methods?.freeShipping?.enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="free-shipping-min">
                  Minimum Order Amount ($)
                </Label>
                <Input
                  id="free-shipping-min"
                  type="number"
                  {...register('shipping.methods.freeShipping.minimumAmount', {
                    valueAsNumber: true
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount qualify for free shipping
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="flat-rate" className="font-medium">
                  Flat Rate Shipping
                </Label>
                <p className="text-sm text-muted-foreground">
                  Charge a fixed rate for shipping
                </p>
              </div>
              <Switch
                id="flat-rate"
                checked={watchedValues.shipping?.methods?.flatRate?.enabled}
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'shipping.methods.flatRate.enabled',
                    value
                  )
                }
              />
            </div>
            {watchedValues.shipping?.methods?.flatRate?.enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="flat-rate-cost">Flat Rate Cost ($)</Label>
                <Input
                  id="flat-rate-cost"
                  type="number"
                  step="0.01"
                  {...register('shipping.methods.flatRate.cost', {
                    valueAsNumber: true
                  })}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2">
              <div>
                <Label htmlFor="express-shipping" className="font-medium">
                  Express Shipping
                </Label>
                <p className="text-sm text-muted-foreground">
                  Offer expedited shipping option
                </p>
              </div>
              <Switch
                id="express-shipping"
                checked={
                  watchedValues.shipping?.methods?.expressShipping?.enabled
                }
                onCheckedChange={(value) =>
                  handleBooleanChange(
                    'shipping.methods.expressShipping.enabled',
                    value
                  )
                }
              />
            </div>
            {watchedValues.shipping?.methods?.expressShipping?.enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="express-cost">Express Shipping Cost ($)</Label>
                <Input
                  id="express-cost"
                  type="number"
                  step="0.01"
                  {...register('shipping.methods.expressShipping.cost', {
                    valueAsNumber: true
                  })}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Shipping Options</CardTitle>
          <CardDescription>Additional shipping settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="shipping-calculator" className="font-medium">
                Enable Shipping Calculator
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to calculate shipping costs before checkout
              </p>
            </div>
            <Switch
              id="shipping-calculator"
              checked={watchedValues.shipping?.options?.shippingCalculator}
              onCheckedChange={(value) =>
                handleBooleanChange(
                  'shipping.options.shippingCalculator',
                  value
                )
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label htmlFor="international-shipping" className="font-medium">
                International Shipping
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable shipping to international destinations
              </p>
            </div>
            <Switch
              id="international-shipping"
              checked={watchedValues.shipping?.options?.internationalShipping}
              onCheckedChange={(value) =>
                handleBooleanChange(
                  'shipping.options.internationalShipping',
                  value
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-origin">Shipping Origin Address</Label>
            <Textarea
              id="shipping-origin"
              rows={3}
              {...register('shipping.options.shippingOrigin')}
            />
            {errors.shipping?.options?.shippingOrigin && (
              <p className="text-sm text-red-500">
                {errors.shipping.options.shippingOrigin.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
