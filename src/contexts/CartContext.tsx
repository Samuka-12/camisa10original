import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { applyTripleCrownDiscount, type TripleCrownResult } from "@/lib/tripleCrown";
import {
  computePromotions,
  computeCashback,
  readStoreConfigCache,
  type PromotionsResult,
  type CashbackResult,
} from "@/lib/promotions";

export interface CartItem {
  id: string;
  product: Product;
  size: string;
  quantity: number;
  type?: 'Torcedor' | 'Jogador' | 'Personalizada';
  isCustomized?: boolean;
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
  clearCart: () => void;
  discount: number;
  tripleCrown: TripleCrownResult;
  promotions: PromotionsResult;
  cashback: CashbackResult;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

// Internal applyCoupon resolver — reads cupons from StoreConfig stored in localStorage
function resolveCouponDiscount(code: string): number {
  try {
    const raw = localStorage.getItem('store_config_cache');
    if (!raw) return 0;
    const cfg = JSON.parse(raw);
    const cupons: any[] = cfg?.precoGestao?.cupons || [];
    const now = new Date();
    const found = cupons.find((c: any) => {
      if (!c.ativo) return false;
      if ((c.codigo || '').toUpperCase().trim() !== code.toUpperCase().trim()) return false;
      if (c.dataValidade && new Date(c.dataValidade) < now) return false;
      return true;
    });
    if (found) return (parseFloat(found.desconto) || 0) / 100;
    return 0;
  } catch (_) {
    return 0;
  }
}

function getCouponName(code: string): string {
  try {
    const raw = localStorage.getItem('store_config_cache');
    if (!raw) return '';
    const cfg = JSON.parse(raw);
    const cupons: any[] = cfg?.precoGestao?.cupons || [];
    const found = cupons.find((c: any) =>
      c.ativo && (c.codigo || '').toUpperCase().trim() === code.toUpperCase().trim()
    );
    return found ? (found.nome || found.codigo) : '';
  } catch (_) {
    return '';
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("camisa10_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Config da loja (promoções progressivas + cashback), mantida em sincronia
  // com o painel administrativo via evento 'storeConfigUpdated'.
  const [storeCfg, setStoreCfg] = useState<any>(() => readStoreConfigCache());

  useEffect(() => {
    const sync = (e: any) => setStoreCfg(e?.detail || readStoreConfigCache());
    window.addEventListener('storeConfigUpdated', sync as EventListener);
    return () => window.removeEventListener('storeConfigUpdated', sync as EventListener);
  }, []);

  const [coupon, setCoupon] = useState(() => {
    return localStorage.getItem("camisa10_coupon") || "";
  });
  const [discount, setDiscount] = useState(() => {
    return Number(localStorage.getItem("camisa10_discount")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("camisa10_cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("camisa10_coupon", coupon);
    localStorage.setItem("camisa10_discount", discount.toString());
  }, [coupon, discount]);

  // Re-validate coupon when StoreConfig updates (e.g., coupon deactivated)
  useEffect(() => {
    const handleConfigUpdate = () => {
      if (coupon && discount > 0) {
        const newDiscount = resolveCouponDiscount(coupon);
        if (newDiscount === 0) {
          setDiscount(0);
        }
      }
    };
    window.addEventListener('storeConfigUpdated', handleConfigUpdate);
    return () => window.removeEventListener('storeConfigUpdated', handleConfigUpdate);
  }, [coupon, discount]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((product: Product, size: string, options?: Omit<CartItem, 'id' | 'product' | 'size' | 'quantity' | 'itemPrice'>) => {
    setItems((prev) => {
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

      const getPrice = (p: any) => {
        if (typeof p.priceNum === 'number') return p.priceNum;
        if (typeof p.preco === 'number') return p.preco;
        const rawPrice = p.preco || p.price || '0';
        return parseFloat(String(rawPrice).replace(/[^\d,.]/g, '').replace(',', '.')) || 109.93;
      };

      const basePrice = getPrice(product) || 109.93;
      let addon = 0;
      if (options?.type === 'Jogador') addon += 20;
      if (options?.isCustomized || options?.type === 'Personalizada') addon += 20;

      const itemPrice = (options as any)?.itemPrice ?? (basePrice + addon);

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
    const cleanCoupon = coupon.trim().toUpperCase();
    if (!cleanCoupon) {
      setDiscount(0);
      return;
    }

    // Read discount from StoreConfig (real coupons from admin)
    const discountValue = resolveCouponDiscount(cleanCoupon);
    if (discountValue > 0) {
      setDiscount(discountValue);
      const name = getCouponName(cleanCoupon);
      toast.success(`Cupom "${name || cleanCoupon}" aplicado! ${Math.round(discountValue * 100)}% de desconto.`);
    } else {
      setDiscount(0);
      toast.error("Cupom inválido, expirado ou não ativo.");
    }
  }, [coupon]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem("camisa10_cart");
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.itemPrice || 0) * i.quantity, 0);
  const tripleCrown = applyTripleCrownDiscount(items);

  // Promoções progressivas: aplicadas após a Tríplice Coroa e antes do cupom.
  const afterTripleCrown = Math.max(0, subtotal - tripleCrown.totalDiscount);
  const promotions = computePromotions(
    items,
    storeCfg?.precoGestao?.promocoes,
    afterTripleCrown
  );
  const afterPromotions = Math.max(0, afterTripleCrown - promotions.totalDiscount);

  const totalPrice = Number(afterPromotions * (1 - discount)) || 0;

  const cashback = computeCashback(
    storeCfg?.precoGestao?.cashback,
    totalPrice,
    totalItems
  );

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
        clearCart,
        discount,
        tripleCrown,
        promotions,
        cashback,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
