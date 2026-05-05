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
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

// Mock banner data
const bannersData = {
  '1': {
    id: 1,
    title: 'Summer Collection',
    description: 'Discover our new summer collection with up to 50% off',
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?category=summer',
    buttonText: 'Shop Now',
    active: true,
    order: 1,
    startDate: '2023-06-01',
    endDate: '2023-08-31'
  },
  '2': {
    id: 2,
    title: 'New Arrivals',
    description: 'Check out our latest products just for you',
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?tag=new',
    buttonText: 'Explore',
    active: true,
    order: 2,
    startDate: '2023-05-15',
    endDate: '2023-12-31'
  },
  '3': {
    id: 3,
    title: 'Limited Offers',
    description: 'Special deals for a limited time only',
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?tag=limited',
    buttonText: 'View Offers',
    active: false,
    order: 3,
    startDate: '2023-07-01',
    endDate: '2023-07-15'
  }
};

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const bannerId = params.id as string;
  const banner = bannersData[bannerId as keyof typeof bannersData];

  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      link: '',
      buttonText: '',
      startDate: '',
      endDate: '',
      active: true
    }
  });

  useEffect(() => {
    if (banner) {
      reset({
        title: banner.title,
        description: banner.description,
        link: banner.link,
        buttonText: banner.buttonText,
        startDate: banner.startDate,
        endDate: banner.endDate,
        active: banner.active
      });
      setImage(banner.image);
    }
  }, [banner, reset]);

  if (!banner) {
    return (
      <Container>
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin/banners">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Banner Not Found
            </h2>
            <p className="text-muted-foreground">
              The requested banner does not exist.
            </p>
          </div>
        </div>
      </Container>
    );
  }

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
      title: 'Banner updated',
      description: 'Your banner has been updated successfully.'
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
            <h2 className="text-2xl font-bold tracking-tight">Edit Banner</h2>
            <p className="text-muted-foreground">
              Update your promotional banner.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Banner Content</CardTitle>
                <CardDescription>
                  Edit the content for your promotional banner.
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
                  Update the image for your banner.
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
                  <Label htmlFor="image">Update Image</Label>
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
                                {banner.title}
                              </h3>
                              <p className="mb-4 text-sm text-white/90">
                                {banner.description}
                              </p>
                              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                                {banner.buttonText}
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
                  Updating...
                </>
              ) : (
                'Update Banner'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
