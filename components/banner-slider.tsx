'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';
import { Banner } from '@/types';

const GRADIENT_COLORS = [
  'from-blue-500/40 to-purple-500/40',
  'from-amber-500/40 to-red-500/40',
  'from-emerald-500/40 to-cyan-500/40',
  'from-rose-500/40 to-pink-500/40',
  'from-violet-500/40 to-indigo-500/40'
];

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  const minSwipeDistance = 50;

  useEffect(() => {
    fetch('/api/banners')
      .then((res) => res.json())
      .then((data) => {
        if (data.banners?.length) {
          setBanners(data.banners);
        }
      })
      .catch((err) => console.error('Failed to load banners:', err));
  }, []);

  const nextBanner = useCallback(() => {
    if (isAnimating || banners.length === 0) return;
    setIsAnimating(true);
    setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    setProgress(0);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating, banners.length]);

  const prevBanner = useCallback(() => {
    if (isAnimating || banners.length === 0) return;
    setIsAnimating(true);
    setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    setProgress(0);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating, banners.length]);

  const goToBanner = (index: number) => {
    if (isAnimating || index === currentBanner) return;
    setIsAnimating(true);
    setCurrentBanner(index);
    setProgress(0);
    setTimeout(() => setIsAnimating(false), 700);
  };

  useEffect(() => {
    if (banners.length === 0) return;

    if (isPaused) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    setProgress(0);
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    progressRef.current = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 50);

    autoplayRef.current = setInterval(() => {
      nextBanner();
    }, 10000);

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentBanner, isPaused, nextBanner, banners.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevBanner();
      else if (e.key === 'ArrowRight') nextBanner();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextBanner, prevBanner]);

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
    if (distance > minSwipeDistance) nextBanner();
    else if (distance < -minSwipeDistance) prevBanner();
  };

  if (banners.length === 0) {
    return (
      <div className="relative h-[400px] w-full animate-pulse bg-muted md:h-[500px] lg:h-[600px]" />
    );
  }

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
            key={banner._id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700 ease-in-out',
              index === currentBanner ? 'z-10 opacity-100' : 'z-0 opacity-0'
            )}
          >
            <div
              className="absolute inset-0 scale-[1.02] transition-transform ease-linear"
              style={{
                transitionDuration: '10000ms',
                transform:
                  index === currentBanner ? 'scale(1.08)' : 'scale(1.02)'
              }}
            >
              <Image
                src={banner.imageUrl || '/placeholder.svg'}
                alt={banner.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>

            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-r opacity-80',
                GRADIENT_COLORS[index % GRADIENT_COLORS.length]
              )}
            />

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
              />
            )}
            <span
              className={cn(
                'absolute inset-0 origin-left scale-x-0 bg-white/80 transition-transform duration-300 group-hover:scale-x-100',
                index === currentBanner && 'bg-white'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
