'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

// Mock data for banners
const banners = [
  {
    id: 1,
    title: 'Summer Collection',
    subtitle: '2025 Edition',
    description:
      'Discover our new summer collection with up to 50% off on selected items',
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?category=summer',
    buttonText: 'Shop Now',
    color: 'from-blue-500/40 to-purple-500/40'
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Just Landed',
    description:
      'Check out our latest products just for you. Fresh styles every week.',
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?tag=new',
    buttonText: 'Explore',
    color: 'from-amber-500/40 to-red-500/40'
  },
  {
    id: 3,
    title: 'Limited Offers',
    subtitle: 'Act Fast',
    description:
      "Special deals for a limited time only. Don't miss out on these exclusive offers.",
    image: '/placeholder.svg?height=600&width=1200',
    link: '/products?tag=limited',
    buttonText: 'View Offers',
    color: 'from-emerald-500/40 to-cyan-500/40'
  }
];

export function BannerSlider() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const nextBanner = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    setProgress(0);

    setTimeout(() => {
      setIsAnimating(false);
    }, 700); // Match this with the CSS transition duration
  }, [isAnimating]);

  const prevBanner = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    setProgress(0);

    setTimeout(() => {
      setIsAnimating(false);
    }, 700); // Match this with the CSS transition duration
  }, [isAnimating]);

  const goToBanner = (index: number) => {
    if (isAnimating || index === currentBanner) return;

    setIsAnimating(true);
    setCurrentBanner(index);
    setProgress(0);

    setTimeout(() => {
      setIsAnimating(false);
    }, 700);
  };

  // Handle autoplay
  useEffect(() => {
    if (isPaused) {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      return;
    }

    // Reset progress
    setProgress(0);

    // Clear any existing intervals
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }

    // Set up progress bar
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 0.5; // Increment by 0.5% every 50ms
      });
    }, 50);

    // Set up autoplay
    autoplayRef.current = setInterval(() => {
      nextBanner();
    }, 10000); // 10 seconds per slide

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentBanner, isPaused, nextBanner]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevBanner();
      } else if (e.key === 'ArrowRight') {
        nextBanner();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextBanner, prevBanner]);

  // Handle touch events for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextBanner();
    } else if (isRightSwipe) {
      prevBanner();
    }
  };

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[400px] w-full md:h-[500px] lg:h-[600px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              index === currentBanner ? 'z-10 opacity-100' : 'z-0 opacity-0'
            )}
          >
            {/* Background Image with Parallax Effect */}
            <div
              className="absolute inset-0 scale-[1.02] transition-transform ease-linear"
              style={{
                transitionDuration: '10000ms',
                transform:
                  index === currentBanner ? 'scale(1.08)' : 'scale(1.02)',
                transitionDelay: index === currentBanner ? '0ms' : '0ms'
              }}
            >
              <Image
                src={banner.image || '/placeholder.svg'}
                alt={banner.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Gradient Overlay */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-r opacity-80',
                banner.color
              )}
            ></div>

            {/* Content */}
            <Container className="relative z-20 h-full">
              <div className="flex h-full max-w-xl flex-col justify-center px-4 md:px-0">
                <div
                  className={cn(
                    'transition-all duration-1000 ease-out',
                    index === currentBanner
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-10 opacity-0'
                  )}
                >
                  <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm md:text-base">
                    {banner.subtitle}
                  </span>
                  <h2 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    {banner.title}
                  </h2>
                  <p className="mb-6 max-w-md text-lg text-white/90 md:text-xl">
                    {banner.description}
                  </p>
                  <div className="flex gap-4">
                    <Link href={banner.link}>
                      <Button
                        size="lg"
                        className="rounded-full px-8 font-semibold"
                      >
                        {banner.buttonText}
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full border-white/30 bg-white/10 px-8 font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                      >
                        View All
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Container>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
        onClick={prevBanner}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
        onClick={nextBanner}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Custom Indicators */}
      <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToBanner(index)}
            className="group relative h-2 w-16 overflow-hidden rounded-full bg-white/30 backdrop-blur-sm"
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentBanner && (
              <span
                className="absolute inset-0 rounded-full bg-white"
                style={{ width: `${progress}%` }}
              ></span>
            )}
            <span
              className={cn(
                'absolute inset-0 origin-left scale-x-0 bg-white/80 transition-transform duration-300 group-hover:scale-x-100',
                index === currentBanner && 'bg-white'
              )}
            ></span>
          </button>
        ))}
      </div>
    </div>
  );
}
