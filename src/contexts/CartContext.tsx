import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, size: string) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  totalItems: number;
  totalPrice: number;
  coupon: string;
  setCoupon: (c: string) => void;
  applyCoupon: () => void;
  discount: number;
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

  const addItem = useCallback((product: Product, size: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (Number(i.product.priceNum) || 0) * i.quantity, 0);
  const totalPrice = Number(subtotal * (1 - discount)) || 0;

  const applyCoupon = useCallback(() => {
    if (coupon.toUpperCase() === "CAMISA10") {
      setDiscount(0.1);
    } else {
      setDiscount(0);
    }
  }, [coupon]);

  return (
    <CartContext.Provider
      value={{ items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, totalItems, totalPrice, coupon, setCoupon, applyCoupon, discount }}
    >
      {children}
    </CartContext.Provider>
  );
};
