'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function NewBannerPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      link: '',
      buttonText: 'Shop Now',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      active: true
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BannerFormValues) => {
    if (!image) {
      toast({
        title: 'Image required',
        description: 'Please upload a banner image.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'Banner created',
      description: 'Your banner has been created successfully.'
    });

    router.push('/admin/banners');
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
                    placeholder="e.g., https://yourstore.com/products?category=summer"
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
                    <Label htmlFor="startDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input id="endDate" type="date" {...register('endDate')} />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Display this banner on your store.
                    </p>
                  </div>
                  <Switch id="active" {...register('active')} />
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
                <div className="relative aspect-[2/1] overflow-hidden rounded-md border bg-muted">
                  {image ? (
                    <Image
                      src={image || '/placeholder.svg'}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                      <Upload className="mb-2 h-10 w-10" />
                      <p>No image uploaded</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">
                    Upload Image <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Recommended size: 1200x600px. Max file size: 2MB. Supported
                    formats: JPG, PNG, WebP.
                  </p>
                </div>

                <div className="pt-4">
                  <h4 className="mb-2 text-sm font-medium">Banner Preview</h4>
                  <div className="rounded-md border bg-muted/50 p-4">
                    <div className="relative h-[150px] overflow-hidden rounded-md">
                      {image ? (
                        <>
                          <Image
                            src={image || '/placeholder.svg'}
                            alt="Banner preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 flex items-center bg-black/40">
                            <div className="container px-4">
                              <h3 className="mb-2 text-xl font-bold text-white">
                                Your Banner Title
                              </h3>
                              <p className="mb-4 text-sm text-white/90">
                                Your banner description will appear here.
                              </p>
                              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                                Button Text
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          Banner preview will appear here
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
