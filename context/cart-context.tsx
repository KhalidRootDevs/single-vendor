'use client';

import { CartItem } from '@/types';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  // Calculate cart totals
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + shipping + tax;

  // Add item to cart
  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variant === newItem.variant
      );

      if (existingItemIndex >= 0) {
        const existing = prevItems[existingItemIndex];
        const newQty = existing.quantity + newItem.quantity;
        const maxQty = newItem.maxStock ?? existing.maxStock ?? Infinity;
        const clampedQty = Math.min(newQty, maxQty);
        return prevItems.map((item, idx) =>
          idx === existingItemIndex ? { ...item, quantity: clampedQty } : item
        );
      }

      return [...prevItems, { ...newItem, id: Date.now() }];
    });
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        const maxQty = item.maxStock ?? Infinity;
        return { ...item, quantity: Math.min(quantity, maxQty) };
      })
    );
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        shipping,
        tax,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Modify the useCart function to handle the case when the context is not available
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
