'use client';

import type React from 'react';

import { LoginButton } from '@/components/auth/login-button';
import { CartButton } from '@/components/cart-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { WishlistDrawer } from '@/components/wishlist-drawer';
import { useOnClickOutside } from '@/hooks/use-click-outside';
import { allProducts } from '@/lib/product-data';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Briefcase,
  Car,
  Dog,
  Dumbbell,
  FileText,
  Footprints,
  Gamepad2,
  Gem,
  Heart,
  Home,
  Laptop,
  Loader2,
  Menu,
  Search,
  ShirtIcon,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Category } from '@/types';

// Debounce function to limit how often a function can be called
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  Electronics: <Laptop className="h-4 w-4" />,
  Clothing: <ShirtIcon className="h-4 w-4" />,
  'Home & Kitchen': <Home className="h-4 w-4" />,
  'Beauty & Personal Care': <Sparkles className="h-4 w-4" />,
  'Sports & Outdoors': <Dumbbell className="h-4 w-4" />,
  Books: <BookOpen className="h-4 w-4" />,
  'Toys & Games': <Gamepad2 className="h-4 w-4" />,
  'Health & Wellness': <Heart className="h-4 w-4" />,
  Automotive: <Car className="h-4 w-4" />,
  'Pet Supplies': <Dog className="h-4 w-4" />,
  Jewelry: <Gem className="h-4 w-4" />,
  'Office Supplies': <FileText className="h-4 w-4" />,
  Accessories: <Briefcase className="h-4 w-4" />,
  Footwear: <Footprints className="h-4 w-4" />
};

// Mock category data for the mega menu
const categoryGroups = [
  {
    title: 'Shop by Category',
    items: [
      { name: 'Electronics', href: '/products?category=Electronics' },
      { name: 'Clothing', href: '/products?category=Clothing' },
      { name: 'Home & Kitchen', href: '/products?category=Home & Kitchen' },
      {
        name: 'Beauty & Personal Care',
        href: '/products?category=Beauty & Personal Care'
      },
      {
        name: 'Sports & Outdoors',
        href: '/products?category=Sports & Outdoors'
      },
      { name: 'Books', href: '/products?category=Books' }
    ]
  },
  {
    title: 'More Categories',
    items: [
      { name: 'Toys & Games', href: '/products?category=Toys & Games' },
      {
        name: 'Health & Wellness',
        href: '/products?category=Health & Wellness'
      },
      { name: 'Automotive', href: '/products?category=Automotive' },
      { name: 'Pet Supplies', href: '/products?category=Pet Supplies' },
      { name: 'Jewelry', href: '/products?category=Jewelry' },
      { name: 'Office Supplies', href: '/products?category=Office Supplies' }
    ]
  },
  {
    title: 'Featured Collections',
    items: [
      { name: 'New Arrivals', href: '/products?sort=newest' },
      { name: 'Best Sellers', href: '/products?sort=best-selling' },
      { name: 'Top Rated', href: '/products?sort=rating' },
      { name: 'Sale Items', href: '/products?discount=true' },
      { name: 'Clearance', href: '/products?clearance=true' },
      { name: 'Gift Ideas', href: '/products?gift=true' }
    ]
  }
];

// Featured categories with images for the mega menu
const featuredCategories = [
  {
    name: 'Electronics',
    description: 'Latest gadgets and tech',
    href: '/products?category=Electronics',
    image: '/placeholder.svg?height=100&width=100'
  },
  {
    name: 'Fashion',
    description: 'Trendy styles for everyone',
    href: '/products?category=Clothing',
    image: '/placeholder.svg?height=100&width=100'
  },
  {
    name: 'Home',
    description: 'Make your space beautiful',
    href: '/products?category=Home & Kitchen',
    image: '/placeholder.svg?height=100&width=100'
  }
];

interface HeaderProps {
  categoryTree: Category[];
}

export function Header({ categoryTree }: HeaderProps) {
  // Show the categoryTree on the dropdown

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof allProducts>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useOnClickOutside(searchRef, () => setShowResults(false));

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter products based on search query
  useEffect(() => {
    if (debouncedSearchQuery) {
      setIsSearching(true);
      // Simulate API call with setTimeout
      const timeoutId = setTimeout(() => {
        const filtered = allProducts.filter((product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
        setIsSearching(false);
        setShowResults(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  const handleProductClick = (productId: number) => {
    router.push(`/products/${productId}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <Container>
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo section - always visible */}
          <div className="z-20 flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="mb-6 flex items-center">
                  <ShoppingBag className="mr-2 h-6 w-6" />
                  <span className="text-xl font-bold">OneVendor</span>
                </div>

                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-lg font-medium transition-colors hover:text-primary ${
                        isActive(item.href)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <div className="py-2">
                    <p className="mb-2 text-lg font-medium">Categories</p>
                    <div className="grid grid-cols-1 gap-2 pl-2">
                      {categoryGroups
                        .flatMap((group) => group.items)
                        .slice(0, 8)
                        .map((category) => (
                          <Link
                            key={category.name}
                            href={category.href}
                            className="flex items-center py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                          >
                            {categoryIcons[category.name] || (
                              <ShirtIcon className="mr-2 h-4 w-4" />
                            )}
                            {category.name}
                          </Link>
                        ))}
                      <Link
                        href="/categories"
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        View all categories
                      </Link>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center">
              <ShoppingBag className="mr-2 h-6 w-6" />
              <span className="hidden text-xl font-bold sm:inline-block">
                OneVendor
              </span>
            </Link>
          </div>

          {/* Navigation Menu - hidden when search is open */}
          <div
            className={cn(
              'absolute left-0 right-0 mx-auto flex justify-center transition-opacity duration-200',
              isSearchOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
            )}
          >
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isActive('/') ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      'transition-colors',
                      isActive('/categories')
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    Categories
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="overflow-hidden">
                    {/* Modern mega menu with enhanced styling */}
                    <div className="w-screen max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-5xl">
                      <div className="grid max-h-[70vh] auto-rows-max grid-cols-1 gap-2 overflow-y-auto p-4 sm:gap-3 sm:p-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {categoryTree.map((category: any) => {
                          const categoryIcon = categoryIcons[category.name];
                          return (
                            <div key={category.name} className="col-span-1">
                              <div className="mb-2 flex items-center gap-2 sm:mb-3">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-8 sm:w-8">
                                  {categoryIcon ? (
                                    <div className="h-4 w-4 text-primary">
                                      {categoryIcon}
                                    </div>
                                  ) : (
                                    <ShirtIcon className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                <h3 className="truncate font-semibold text-sm text-foreground sm:text-base">
                                  {category.name}
                                </h3>
                              </div>
                              <div className="space-y-0.5 sm:space-y-1">
                                {category.subCategories.length > 0 ? (
                                  category.subCategories.map(
                                    (subCategory: any) => (
                                      <Link
                                        key={subCategory.name}
                                        href={`/products?categories=${subCategory.slug}`}
                                        className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-primary hover:translate-x-1 sm:px-3 sm:py-2 sm:text-sm"
                                      >
                                        <span className="truncate">
                                          {subCategory.name}
                                        </span>
                                      </Link>
                                    )
                                  )
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/products" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isActive('/products')
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      Products
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={
                      isActive('/deals')
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }
                  >
                    Deals
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    {/* Responsive deals dropdown */}
                    <div className="mx-auto w-[calc(100vw-2rem)] max-w-md">
                      <div className="grid gap-3 p-6">
                        <div className="grid grid-cols-1 gap-2">
                          <Link
                            href="/products?discount=true"
                            className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Sale Items</div>
                              <div className="text-xs text-muted-foreground">
                                Products with special discounts
                              </div>
                            </div>
                          </Link>
                          <Link
                            href="/products?sort=best-selling"
                            className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Best Sellers</div>
                              <div className="text-xs text-muted-foreground">
                                Our most popular products
                              </div>
                            </div>
                          </Link>
                          <Link
                            href="/products?clearance=true"
                            className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">Clearance</div>
                              <div className="text-xs text-muted-foreground">
                                Last chance to buy
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Search bar - centered and full width when open */}
          <div
            className={cn(
              'absolute left-0 right-0 z-10 mx-auto flex justify-center transition-opacity duration-200',
              isSearchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          >
            <div
              ref={searchRef}
              className="mx-auto w-full max-w-3xl px-4"
              style={{ width: 'calc(100% - 320px)' }}
            >
              <form
                className="relative flex max-w-xl items-center"
                onSubmit={handleSearchSubmit}
              >
                <Input
                  type="search"
                  name="search"
                  placeholder="Search products..."
                  className="w-full"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setShowResults(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>

              {/* Search Results Dropdown */}
              {showResults && (searchResults.length > 0 || isSearching) && (
                <Card className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-auto p-2">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
                          onClick={() => handleProductClick(product.id)}
                        >
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            $
                            {product.discount
                              ? (
                                  product.price *
                                  (1 - product.discount / 100)
                                ).toFixed(2)
                              : product.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 border-t pt-2 text-center">
                        <Button
                          variant="link"
                          className="text-xs"
                          onClick={() => {
                            router.push(
                              `/products?q=${encodeURIComponent(
                                searchQuery.trim()
                              )}`
                            );
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            setShowResults(false);
                          }}
                        >
                          View all results
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Action buttons - always visible */}

          <div className="z-20 flex items-center gap-2">
            {isSearchOpen ? null : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                {isSearchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {isSearchOpen ? 'Close search' : 'Search'}
                </span>
              </Button>
            )}
            <WishlistDrawer />
            <CartButton />
            <LoginButton />
          </div>
        </div>
      </Container>
    </header>
  );
}
