'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api-fetch';
import { Banner } from '@/types';

export default function BannerPreviewPage() {
  const params = useParams();
  const bannerId = params.id as string;
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/admin/banners/${bannerId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Banner not found');
        return res.json();
      })
      .then((data) => setBanner(data.banner))
      .catch(() =>
        toast({
          title: 'Error',
          description: 'Failed to load banner.',
          variant: 'destructive'
        })
      )
      .finally(() => setIsLoading(false));
  }, [bannerId]);

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

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

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/banners">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Banner Preview
              </h2>
              <p className="text-muted-foreground">
                Preview how your banner will appear on the site.
              </p>
            </div>
          </div>
          <Link href={`/admin/banners/${banner._id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Banner
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium">Desktop View</h3>
            <div className="relative h-[400px] overflow-hidden rounded-lg">
              <Image
                src={banner.imageUrl || '/placeholder.svg'}
                alt={banner.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center bg-black/40">
                <div className="container">
                  <div className="ml-12 max-w-md">
                    <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                      {banner.title}
                    </h2>
                    <p className="mb-6 text-lg text-white/90">
                      {banner.description}
                    </p>
                    <button className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground">
                      {banner.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium">Mobile View</h3>
            <div className="relative mx-auto h-[500px] max-w-[375px] overflow-hidden rounded-lg">
              <Image
                src={banner.imageUrl || '/placeholder.svg'}
                alt={banner.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center bg-black/40">
                <div className="container px-4">
                  <div className="text-center">
                    <h2 className="mb-3 text-2xl font-bold text-white">
                      {banner.title}
                    </h2>
                    <p className="mb-4 text-sm text-white/90">
                      {banner.description}
                    </p>
                    <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                      {banner.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium">Banner Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Status</p>
                <Badge
                  className={banner.active ? 'bg-green-500' : 'bg-yellow-500'}
                >
                  {banner.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Display Order</p>
                <p>{banner.order}</p>
              </div>
              <div>
                <p className="font-medium">Start Date</p>
                <p>
                  {banner.startDate
                    ? new Date(banner.startDate).toLocaleDateString()
                    : 'No start date'}
                </p>
              </div>
              <div>
                <p className="font-medium">End Date</p>
                <p>
                  {banner.endDate
                    ? new Date(banner.endDate).toLocaleDateString()
                    : 'No end date'}
                </p>
              </div>
              <div>
                <p className="font-medium">Link URL</p>
                <p className="truncate">{banner.link}</p>
              </div>
              <div>
                <p className="font-medium">Button Text</p>
                <p>{banner.buttonText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
