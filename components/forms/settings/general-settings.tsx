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
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { SettingsFormData } from '@/lib/validations';
import { useFormContext } from 'react-hook-form';

export default function General({
  logo,
  handleLogoChange,
  favicon,
  handleFaviconChange
}: {
  logo: File | string | null;
  favicon: File | string | null;
  handleLogoChange: (file: File | null) => void;
  handleFaviconChange: (file: File | null) => void;
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
            <div className="space-y-2">
              <Label>Store Logo</Label>
              <ImageDropzone
                value={logo}
                onChange={handleLogoChange}
                objectFit="contain"
                maxSize={1024 * 1024}
                hint="Recommended: 200×100px. Max 1 MB."
                className="aspect-[2/1]"
              />
            </div>
            <div className="space-y-2">
              <Label>Favicon</Label>
              <ImageDropzone
                value={favicon}
                onChange={handleFaviconChange}
                objectFit="contain"
                maxSize={100 * 1024}
                hint="Recommended: 32×32px. Max 100 KB."
                className="aspect-square"
              />
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
