import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { applyTripleCrownDiscount, type TripleCrownResult } from "@/lib/tripleCrown";

export interface CartItem {
  id: string; // Unique ID per cart item to distinguish custom items
  product: Product;
  size: string;
  quantity: number;
  type?: 'Torcedor' | 'Jogador' | 'Personalizada';
  customName?: string;
  customNumber?: string;
  customPhrase?: string;
  itemPrice: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string, options?: Omit<CartItem, 'id' | 'product' | 'size' | 'quantity' | 'itemPrice'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  coupon: string;
  setCoupon: (c: string) => void;
  applyCoupon: () => void;
  discount: number;
  tripleCrown: TripleCrownResult;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product, size: string, options?: Omit<CartItem, 'id' | 'product' | 'size' | 'quantity' | 'itemPrice'>) => {
    setItems((prev) => {
      // Find exact same configuration
      const existing = prev.find(
        (i) => i.product.id === product.id && 
               i.size === size && 
               i.type === options?.type &&
               i.customName === options?.customName &&
               i.customNumber === options?.customNumber &&
               i.customPhrase === options?.customPhrase
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      
      const basePrice = typeof product.priceNum === 'number' 
        ? product.priceNum 
        : parseFloat(String(product.price).replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
      
      const itemPrice = options?.type === 'Personalizada' ? basePrice + 15 : basePrice;

      return [...prev, { 
        id: Math.random().toString(36).substr(2, 9),
        product, 
        size, 
        quantity: 1, 
        itemPrice,
        ...options 
      }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity } : i
        )
      );
    },
    [removeItem]
  );

  const applyCoupon = useCallback(() => {
    if (coupon.toUpperCase() === "CAMISA10") {
      setDiscount(0.1);
    } else {
      setDiscount(0);
    }
  }, [coupon]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const subtotal = items.reduce((s, i) => s + (i.itemPrice || 0) * i.quantity, 0);

  const tripleCrown = applyTripleCrownDiscount(items);

  const totalPrice =
    Number((subtotal - tripleCrown.totalDiscount) * (1 - discount)) || 0;

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        totalItems,
        totalPrice,
        subtotal,
        coupon,
        setCoupon,
        applyCoupon,
        discount,
        tripleCrown,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
