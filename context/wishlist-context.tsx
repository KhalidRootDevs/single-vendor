'use client';

import {
  createContext,
  useCallback,
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

async function isLoggedIn(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  // Load wishlist: from server if logged in, otherwise from localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const loggedIn = await isLoggedIn();
      if (cancelled) return;
      setAuthenticated(loggedIn);

      if (loggedIn) {
        try {
          const res = await fetch('/api/user/wishlist', {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            // Server returns product IDs only — merge with localStorage items that have full data
            const localRaw = localStorage.getItem('wishlist');
            const localItems: WishlistItem[] = localRaw
              ? JSON.parse(localRaw)
              : [];
            const serverIds: string[] = data.wishlist.map(String);
            // Keep local items that are on the server list, plus any not yet synced
            const merged = localItems.filter((i) => serverIds.includes(i.id));
            // Sync local items not yet on server
            const localOnlyIds = localItems
              .filter((i) => !serverIds.includes(i.id))
              .map((i) => i.id);
            for (const pid of localOnlyIds) {
              fetch('/api/user/wishlist', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: pid })
              }).catch(() => {});
            }
            if (!cancelled) setItems(merged);
          }
        } catch {
          const stored = localStorage.getItem('wishlist');
          if (stored && !cancelled) setItems(JSON.parse(stored));
        }
      } else {
        const stored = localStorage.getItem('wishlist');
        if (stored && !cancelled) {
          try {
            setItems(JSON.parse(stored));
          } catch {
            // ignore
          }
        }
      }

      if (!cancelled) setIsInitialized(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback(
    (newItem: WishlistItem) => {
      if (items.some((item) => item.id === newItem.id)) {
        toast({
          title: 'Already in wishlist',
          description: `${newItem.name} is already in your wishlist.`
        });
        return;
      }

      setItems((prev) => [...prev, newItem]);

      if (authenticated) {
        fetch('/api/user/wishlist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: newItem.id })
        }).catch(() => {});
      }

      toast({
        title: 'Added to wishlist',
        description: `${newItem.name} has been added to your wishlist.`
      });
    },
    [items, authenticated]
  );

  const removeItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (authenticated) {
        fetch('/api/user/wishlist', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id })
        }).catch(() => {});
      }

      if (item) {
        toast({
          title: 'Removed from wishlist',
          description: `${item.name} has been removed from your wishlist.`
        });
      }
    },
    [items, authenticated]
  );

  const isInWishlist = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
    toast({
      title: 'Wishlist cleared',
      description: 'All items have been removed from your wishlist.'
    });
  }, []);

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
