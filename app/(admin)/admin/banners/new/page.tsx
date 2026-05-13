'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { BannerFormValues, bannerSchema } from '@/lib/validations/index';
import { apiFetch } from '@/lib/api-fetch';

export default function NewBannerPage() {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      link: '',
      buttonText: 'Shop Now',
      startDate: '',
      endDate: '',
      active: true
    }
  });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedButtonText = watch('buttonText');

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (data: BannerFormValues) => {
    if (!imageFile) {
      toast({
        title: 'Image required',
        description: 'Please upload a banner image.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('link', data.link);
      formData.append('buttonText', data.buttonText);
      formData.append('active', String(data.active));
      if (data.startDate) formData.append('startDate', data.startDate);
      if (data.endDate) formData.append('endDate', data.endDate);
      formData.append('image', imageFile);

      const res = await apiFetch('/api/admin/banners', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create banner');
      }

      toast({
        title: 'Banner created',
        description: 'Your banner has been created successfully.'
      });
      router.push('/admin/banners');
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to create banner.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/banners">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Banner</h2>
            <p className="text-muted-foreground">
              Add a new promotional banner to your store.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Banner Content</CardTitle>
                <CardDescription>
                  Enter the content for your promotional banner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Banner Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Collection"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Discover our new summer collection with up to 50% off"
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">
                    Link URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="link"
                    placeholder="e.g., /products?category=summer or https://..."
                    {...register('link')}
                  />
                  {errors.link && (
                    <p className="text-sm text-red-500">
                      {errors.link.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">
                    Button Text <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="buttonText"
                    placeholder="e.g., Shop Now"
                    {...register('buttonText')}
                  />
                  {errors.buttonText && (
                    <p className="text-sm text-red-500">
                      {errors.buttonText.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="startDate"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Start date"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="endDate"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="End date"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Display this banner on your store.
                    </p>
                  </div>
                  <Controller
                    name="active"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="active"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner Image</CardTitle>
                <CardDescription>
                  Upload an image for your banner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Upload Image <span className="text-red-500">*</span>
                  </Label>
                  <ImageDropzone
                    value={imageFile}
                    onChange={handleImageChange}
                    hint="Recommended: 1200×600px. Max 5 MB. JPG, PNG, or WebP."
                    className="aspect-[2/1]"
                  />
                </div>

                {imagePreview && (
                  <div className="pt-2">
                    <h4 className="mb-2 text-sm font-medium">Preview</h4>
                    <div className="rounded-md border bg-muted/50 p-3">
                      <div className="relative h-[130px] overflow-hidden rounded-md">
                        <Image
                          src={imagePreview}
                          alt="Banner preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center bg-black/40">
                          <div className="px-4">
                            <h3 className="mb-1 text-lg font-bold text-white">
                              {watchedTitle || 'Your Banner Title'}
                            </h3>
                            <p className="mb-3 text-sm text-white/90">
                              {watchedDescription ||
                                'Your banner description will appear here.'}
                            </p>
                            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                              {watchedButtonText || 'Button Text'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/banners">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Banner'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
