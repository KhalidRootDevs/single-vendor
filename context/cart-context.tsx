'use client';

import { CartItem } from '@/types';
import type React from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

// ── State context (items + derived totals) ───────────────────────────────────
interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

// ── Actions context (stable function references) ─────────────────────────────
interface CartActions {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}

const CartStateContext = createContext<CartState | undefined>(undefined);
const CartActionsContext = createContext<CartActions | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage then merge with server cart if authenticated
  useEffect(() => {
    const localRaw = localStorage.getItem('cart');
    let localItems: CartItem[] = [];
    if (localRaw) {
      try {
        localItems = JSON.parse(localRaw);
      } catch {
        /* ignore */
      }
    }

    fetch('/api/user/cart', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) return null;
        setIsAuthenticated(true);
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setItems(localItems);
          return;
        }
        // Merge server items into local items (server wins on conflicts)
        const serverItems: CartItem[] = (data.items ?? []).map(
          (si: Omit<CartItem, 'id'> & { id?: number }, idx: number) => ({
            ...si,
            id: si.id ?? idx + 1
          })
        );
        const merged = [...localItems];
        for (const si of serverItems) {
          const found = merged.findIndex(
            (li) =>
              li.productId === String(si.productId) && li.variant === si.variant
          );
          if (found >= 0) {
            merged[found] = { ...merged[found], quantity: si.quantity };
          } else {
            merged.push(si);
          }
        }
        setItems(merged);
      })
      .catch(() => setItems(localItems))
      .finally(() => setIsInitialized(true));
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Debounced server sync — only for authenticated users
  const syncToServer = useCallback(
    (updatedItems: CartItem[]) => {
      if (!isAuthenticated) return;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        fetch('/api/user/cart', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updatedItems })
        }).catch(() => {});
      }, 2000);
    },
    [isAuthenticated]
  );

  // Stable action callbacks — consumers that only call actions won't re-render on items change
  const addItem = useCallback(
    (newItem: Omit<CartItem, 'id'>) => {
      setItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) =>
            item.productId === newItem.productId &&
            item.variant === newItem.variant
        );

        let next: CartItem[];
        if (existingItemIndex >= 0) {
          const existing = prevItems[existingItemIndex];
          const newQty = existing.quantity + newItem.quantity;
          const maxQty = newItem.maxStock ?? existing.maxStock ?? Infinity;
          const clampedQty = Math.min(newQty, maxQty);
          next = prevItems.map((item, idx) =>
            idx === existingItemIndex ? { ...item, quantity: clampedQty } : item
          );
        } else {
          next = [...prevItems, { ...newItem, id: Date.now() }];
        }

        syncToServer(next);
        return next;
      });
    },
    [syncToServer]
  );

  const updateQuantity = useCallback(
    (id: number, quantity: number) => {
      if (quantity < 1) return;
      setItems((prevItems) => {
        const next = prevItems.map((item) => {
          if (item.id !== id) return item;
          const maxQty = item.maxStock ?? Infinity;
          return { ...item, quantity: Math.min(quantity, maxQty) };
        });
        syncToServer(next);
        return next;
      });
    },
    [syncToServer]
  );

  const removeItem = useCallback(
    (id: number) => {
      setItems((prevItems) => {
        const next = prevItems.filter((item) => item.id !== id);
        syncToServer(next);
        return next;
      });
    },
    [syncToServer]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (isAuthenticated) {
      fetch('/api/user/cart', {
        method: 'DELETE',
        credentials: 'include'
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const actions: CartActions = useMemo(
    () => ({ addItem, updateQuantity, removeItem, clearCart }),
    [addItem, updateQuantity, removeItem, clearCart]
  );

  const state: CartState = useMemo(() => {
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;
    return { items, itemCount, subtotal, shipping, tax, total };
  }, [items]);

  return (
    <CartStateContext.Provider value={state}>
      <CartActionsContext.Provider value={actions}>
        {children}
      </CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState(): CartState {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState must be used within a CartProvider');
  }
  return context;
}

export function useCartActions(): CartActions {
  const context = useContext(CartActionsContext);
  if (context === undefined) {
    throw new Error('useCartActions must be used within a CartProvider');
  }
  return context;
}

// Backward-compatible hook — returns combined state + actions for existing consumers
export function useCart() {
  return { ...useCartState(), ...useCartActions() };
}
