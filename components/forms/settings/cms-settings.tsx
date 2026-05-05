import { RichTextEditor } from '@/components/rich-text-editor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SettingsFormData } from '@/lib/validations';
import { useFormContext } from 'react-hook-form';

export default function CmsSettings() {
  const {
    watch,
    setValue,
    formState: { errors }
  } = useFormContext<SettingsFormData>();
  const watchedValues = watch();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Legal Pages</CardTitle>
          <CardDescription>Manage your store's legal content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="terms-conditions">Terms and Conditions</Label>
            <RichTextEditor
              value={watchedValues.cms?.termsAndConditions || ''}
              onChange={(value) => setValue('cms.termsAndConditions', value)}
            />
            {errors.cms?.termsAndConditions && (
              <p className="text-sm text-red-500">
                {errors.cms.termsAndConditions.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Manage your store's privacy policy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="privacy-policy">Privacy Policy Content</Label>
            <RichTextEditor
              value={watchedValues.cms?.privacyPolicy || ''}
              onChange={(value) => setValue('cms.privacyPolicy', value)}
            />
            {errors.cms?.privacyPolicy && (
              <p className="text-sm text-red-500">
                {errors.cms.privacyPolicy.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Return Policy</CardTitle>
          <CardDescription>Manage your store's return policy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="return-policy">Return Policy Content</Label>
            <RichTextEditor
              value={watchedValues.cms?.returnPolicy || ''}
              onChange={(value) => setValue('cms.returnPolicy', value)}
            />
            {errors.cms?.returnPolicy && (
              <p className="text-sm text-red-500">
                {errors.cms.returnPolicy.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>About Us</CardTitle>
          <CardDescription>Manage your store's about page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="about-us">About Us Content</Label>
            <RichTextEditor
              value={watchedValues.cms?.aboutUs || ''}
              onChange={(value) => setValue('cms.aboutUs', value)}
            />
            {errors.cms?.aboutUs && (
              <p className="text-sm text-red-500">
                {errors.cms.aboutUs.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>FAQ</CardTitle>
          <CardDescription>
            Manage your store's frequently asked questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="faq">FAQ Content</Label>
            <RichTextEditor
              value={watchedValues.cms?.faq || ''}
              onChange={(value) => setValue('cms.faq', value)}
            />
            {errors.cms?.faq && (
              <p className="text-sm text-red-500">{errors.cms.faq.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
