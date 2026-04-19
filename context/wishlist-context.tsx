'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode
} from 'react';
import { toast } from '@/components/ui/use-toast';

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      try {
        setItems(JSON.parse(storedWishlist));
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Add item to wishlist
  const addItem = (newItem: WishlistItem) => {
    if (items.some((item) => item.id === newItem.id)) {
      toast({
        title: 'Already in wishlist',
        description: `${newItem.name} is already in your wishlist.`
      });
      return;
    }

    setItems((prev) => [...prev, newItem]);
    toast({
      title: 'Added to wishlist',
      description: `${newItem.name} has been added to your wishlist.`
    });
  };

  // Remove item from wishlist
  const removeItem = (id: string) => {
    const item = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (item) {
      toast({
        title: 'Removed from wishlist',
        description: `${item.name} has been removed from your wishlist.`
      });
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (id: string) => {
    return items.some((item) => item.id === id);
  };

  // Clear wishlist
  const clearWishlist = () => {
    setItems([]);
    toast({
      title: 'Wishlist cleared',
      description: 'All items have been removed from your wishlist.'
    });
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInWishlist,
        clearWishlist,
        itemCount: items.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
