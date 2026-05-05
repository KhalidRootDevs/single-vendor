'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react';

interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface RecentlyViewedContextType {
  items: RecentlyViewedItem[];
  addItem: (item: RecentlyViewedItem) => void;
  clearHistory: () => void;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load recently viewed from localStorage on initial render
  useEffect(() => {
    const storedItems = localStorage.getItem('recentlyViewed');
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch (error) {
        console.error(
          'Failed to parse recently viewed from localStorage:',
          error
        );
      }
    }
    setIsInitialized(true);
  }, []);

  // Save recently viewed to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('recentlyViewed', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Add item to recently viewed
  const addItem = useCallback((newItem: RecentlyViewedItem) => {
    setItems((prev) => {
      // Check if the item already exists with the same ID
      const exists = prev.some((item) => item.id === newItem.id);

      // If the item already exists, don't update state
      if (exists) return prev;

      // Remove the item if it already exists
      const filtered = prev.filter((item) => item.id !== newItem.id);

      // Add the new item to the beginning of the array
      const updated = [newItem, ...filtered];

      // Limit to 10 items
      return updated.slice(0, 10);
    });
  }, []);

  // Clear recently viewed history
  const clearHistory = () => {
    setItems([]);
  };

  return (
    <RecentlyViewedContext.Provider
      value={{
        items,
        addItem,
        clearHistory
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    return {
      items: [],
      addItem: () => {},
      clearHistory: () => {}
    };
  }
  return context;
}
