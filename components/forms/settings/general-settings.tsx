import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SettingsFormData } from '@/lib/validations';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';

export default function General({
  logo,
  handleLogoChange,
  favicon,
  handleFaviconChange
}: {
  logo: string | null;
  favicon: string | null;
  handleLogoChange: any;
  handleFaviconChange: any;
}) {
  const {
    register,
    formState: { errors }
  } = useFormContext<SettingsFormData>();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Basic information about your store.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input
                id="store-name"
                {...register('general.storeInfo.storeName')}
              />
              {errors.general?.storeInfo?.storeName && (
                <p className="text-sm text-red-500">
                  {errors.general.storeInfo.storeName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Store Email</Label>
              <Input
                id="store-email"
                type="email"
                {...register('general.storeInfo.storeEmail')}
              />
              {errors.general?.storeInfo?.storeEmail && (
                <p className="text-sm text-red-500">
                  {errors.general.storeInfo.storeEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Store Phone</Label>
              <Input
                id="store-phone"
                {...register('general.storeInfo.storePhone')}
              />
              {errors.general?.storeInfo?.storePhone && (
                <p className="text-sm text-red-500">
                  {errors.general.storeInfo.storePhone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Store Address</Label>
              <Input
                id="store-address"
                {...register('general.storeInfo.storeAddress')}
              />
              {errors.general?.storeInfo?.storeAddress && (
                <p className="text-sm text-red-500">
                  {errors.general.storeInfo.storeAddress.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Store Branding</CardTitle>
          <CardDescription>Upload your store logo and favicon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Label>Store Logo</Label>
              <div className="flex flex-col items-center justify-center rounded-md border p-4">
                {logo ? (
                  <div className="relative mb-4 h-20 w-40">
                    <Image
                      src={logo || '/placeholder.svg'}
                      alt="Store logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-20 w-40 items-center justify-center bg-muted">
                    <p className="text-muted-foreground">No logo</p>
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Recommended size: 200x100px. Max file size: 1MB.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <Label>Favicon</Label>
              <div className="flex flex-col items-center justify-center rounded-md border p-4">
                {favicon ? (
                  <div className="relative mb-4 h-10 w-10">
                    <Image
                      src={favicon || '/placeholder.svg'}
                      alt="Favicon"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-10 w-10 items-center justify-center bg-muted">
                    <p className="text-xs text-muted-foreground">No icon</p>
                  </div>
                )}
                <Input
                  id="favicon"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconChange}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Recommended size: 32x32px. Max file size: 100KB.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Optimize your store for search engines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta-title">Meta Title</Label>
            <Input id="meta-title" {...register('general.seo.metaTitle')} />
            {errors.general?.seo?.metaTitle && (
              <p className="text-sm text-red-500">
                {errors.general.seo.metaTitle.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-description">Meta Description</Label>
            <Textarea
              id="meta-description"
              rows={3}
              {...register('general.seo.metaDescription')}
            />
            {errors.general?.seo?.metaDescription && (
              <p className="text-sm text-red-500">
                {errors.general.seo.metaDescription.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-keywords">Meta Keywords</Label>
            <Input
              id="meta-keywords"
              {...register('general.seo.metaKeywords')}
            />
            {errors.general?.seo?.metaKeywords && (
              <p className="text-sm text-red-500">
                {errors.general.seo.metaKeywords.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Connect your store to social media platforms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                {...register('general.socialMedia.facebook')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                {...register('general.socialMedia.instagram')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                {...register('general.socialMedia.twitter')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                {...register('general.socialMedia.youtube')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
