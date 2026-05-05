'use client';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { ArrowLeft, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function BannerPreviewPage() {
  const params = useParams();
  const bannerId = params.id as string;
  const banner = bannersData[bannerId as keyof typeof bannersData];

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
          <Link href={`/admin/banners/${banner.id}`}>
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
                src={banner.image || '/placeholder.svg'}
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
                src={banner.image || '/placeholder.svg'}
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
                <p className="font-medium">Status:</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    banner.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="font-medium">Display Order:</p>
                <p>{banner.order}</p>
              </div>
              <div>
                <p className="font-medium">Start Date:</p>
                <p>{banner.startDate}</p>
              </div>
              <div>
                <p className="font-medium">End Date:</p>
                <p>{banner.endDate}</p>
              </div>
              <div>
                <p className="font-medium">Link URL:</p>
                <p className="truncate">{banner.link}</p>
              </div>
              <div>
                <p className="font-medium">Button Text:</p>
                <p>{banner.buttonText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
