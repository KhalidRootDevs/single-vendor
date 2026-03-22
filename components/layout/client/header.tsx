'use client';

import type React from 'react';

import { CartButton } from '@/components/cart-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { useOnClickOutside } from '@/hooks/use-click-outside';
import { allProducts } from '@/lib/product-data';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
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
  LogIn,
  Menu,
  Search,
  ShirtIcon,
  ShoppingBag,
  Sparkles,
  User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

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

interface HeaderProps {
  categoryTree: Category[];
}

// Unified Profile Menu Component that works for both mobile and desktop
function ProfileMenu({
  variant = 'desktop'
}: {
  variant?: 'mobile' | 'desktop';
}) {
  const { user, logout, isLoading } = useAuth();
  const { openLoginModal } = useModal();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const handleLogin = () => {
    openLoginModal();
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size={variant === 'mobile' ? 'icon' : 'sm'}
        disabled
      >
        <Loader2
          className={cn(
            'animate-spin',
            variant === 'mobile' ? 'h-5 w-5' : 'mr-2 h-4 w-4'
          )}
        />
        {variant === 'desktop' && 'Loading...'}
      </Button>
    );
  }

  if (!user) {
    // Not logged in
    if (variant === 'mobile') {
      return (
        <Button variant="ghost" size="icon" onClick={handleLogin}>
          <LogIn className="h-5 w-5" />
          <span className="sr-only">Sign in</span>
        </Button>
      );
    }

    return (
      <Button variant="ghost" size="sm" onClick={handleLogin}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  }

  // Logged in
  if (variant === 'mobile') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarFallback className="bg-primary/10 text-xs text-primary sm:text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Profile menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/account')}>
            <User className="mr-2 h-4 w-4" />
            <span>My Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/orders')}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>My Orders</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/wishlist')}>
            <Heart className="mr-2 h-4 w-4" />
            <span>Wishlist</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogIn className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.name || 'Account'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/account')}>
          <User className="mr-2 h-4 w-4" />
          <span>My Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/orders')}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>My Orders</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/wishlist')}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Wishlist</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogIn className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ categoryTree }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof allProducts>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setShowResults(false);
  }, [pathname]);

  // Close search results when clicking outside
  useOnClickOutside(searchRef, () => setShowResults(false));

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter products based on search query
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        const filtered = allProducts.filter((product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 5));
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
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-300',
        isScrolled
          ? 'bg-background/95 shadow-lg backdrop-blur-md'
          : 'bg-background'
      )}
    >
      <Container>
        <div className="relative flex min-h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo section - always visible */}
          <div className="z-20 flex flex-shrink-0 items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
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

                  {/* Categories in mobile menu */}
                  <div className="py-2">
                    <p className="mb-2 text-lg font-medium">Categories</p>
                    <div className="grid grid-cols-1 gap-2 pl-2">
                      {categoryTree.slice(0, 8).map((category: any) => (
                        <Link
                          key={category.id}
                          href={`/products?categories=${category.slug}`}
                          className="flex items-center gap-2 py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {categoryIcons[category.name] || (
                            <ShirtIcon className="h-4 w-4" />
                          )}
                          <span className="truncate">{category.name}</span>
                        </Link>
                      ))}
                      {categoryTree.length > 8 && (
                        <Link
                          href="/categories"
                          className="mt-2 text-sm font-medium text-primary hover:underline"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          View all categories
                        </Link>
                      )}
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="ml-2 flex items-center lg:ml-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="ml-2 text-lg font-bold sm:text-xl">
                OneVendor
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center">
            <NavigationMenu>
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
                    <div className="w-screen max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-5xl">
                      <div className="grid max-h-[70vh] auto-rows-max grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2 sm:gap-3 sm:p-6 lg:grid-cols-4 xl:grid-cols-5">
                        {categoryTree.map((category: any) => {
                          const categoryIcon = categoryIcons[category.name];
                          return (
                            <div key={category.id} className="col-span-1">
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
                                <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                                  {category.name}
                                </h3>
                              </div>
                              <div className="space-y-0.5 sm:space-y-1">
                                {category.subCategories?.length > 0 ? (
                                  category.subCategories.map(
                                    (subCategory: any) => (
                                      <Link
                                        key={subCategory.id}
                                        href={`/products?categories=${subCategory.slug}`}
                                        className="block rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-all duration-200 hover:translate-x-1 hover:bg-muted hover:text-primary sm:px-3 sm:py-2 sm:text-sm"
                                      >
                                        <span className="block truncate">
                                          {subCategory.name}
                                        </span>
                                      </Link>
                                    )
                                  )
                                ) : (
                                  <p className="px-2 py-1.5 text-xs text-muted-foreground/50 sm:px-3 sm:py-2">
                                    No subcategories
                                  </p>
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
                    <div className="w-64 p-4">
                      <div className="grid gap-2">
                        <Link
                          href="/products?discount=true"
                          className="flex items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted"
                        >
                          <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Sale Items</div>
                            <div className="text-xs text-muted-foreground">
                              Special discounts
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
                          <div>
                            <div className="font-medium">Best Sellers</div>
                            <div className="text-xs text-muted-foreground">
                              Most popular
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
                          <div>
                            <div className="font-medium">Clearance</div>
                            <div className="text-xs text-muted-foreground">
                              Last chance
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Search Bar - Mobile/Desktop */}
          <div
            className={cn(
              'absolute left-0 right-0 top-full z-30 bg-background px-4 pb-4 transition-all duration-200 lg:relative lg:top-auto lg:block lg:max-w-md lg:flex-1 lg:px-0 lg:pb-0',
              isSearchOpen ? 'block' : 'hidden lg:block'
            )}
          >
            <div ref={searchRef} className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  type="search"
                  name="search"
                  placeholder="Search products..."
                  className="h-10 w-full pr-10 lg:h-9"
                  autoFocus={isSearchOpen}
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
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              {/* Search Results Dropdown */}
              {showResults && (searchResults.length > 0 || isSearching) && (
                <Card className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-auto p-2 shadow-lg">
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
                          className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
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
                          <div className="whitespace-nowrap text-sm font-medium">
                            $
                            {(product.discount
                              ? product.price * (1 - product.discount / 100)
                              : product.price
                            ).toFixed(2)}
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
                          View all results ({searchResults.length})
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="z-20 flex flex-shrink-0 items-center gap-1 sm:gap-2">
            {/* Search toggle button - only on mobile/tablet */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <WishlistDrawer />
            <CartButton />

            {/* Unified Profile Menu - Shows different variants based on screen size */}
            <div className="lg:hidden">
              <ProfileMenu variant="mobile" />
            </div>
            <div className="hidden lg:block">
              <ProfileMenu variant="desktop" />
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
