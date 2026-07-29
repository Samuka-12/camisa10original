/**
 * Gerenciador de Descontos Únicos por Cliente (localStorage + eventos)
 * 
 * Regra: Cada desconto ou cupom aplicado é válido apenas UMA vez por cliente.
 * Após o uso (checkout/compra), o desconto é registrado como utilizado para o cliente,
 * fazendo com que a promoção expire/suma do site para ele e o produto volte ao preço normal.
 */

const USED_COUPONS_KEY = 'camisa10_used_coupons';
const USED_PRODUCT_DISCOUNTS_KEY = 'camisa10_used_discounts';

export function getUsedCoupons(): string[] {
  try {
    const raw = localStorage.getItem(USED_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isCouponUsed(code: string): boolean {
  if (!code) return false;
  const used = getUsedCoupons();
  return used.includes(code.trim().toUpperCase());
}

export function markCouponAsUsed(code: string): void {
  if (!code) return;
  const norm = code.trim().toUpperCase();
  const current = getUsedCoupons();
  if (!current.includes(norm)) {
    const updated = [...current, norm];
    localStorage.setItem(USED_COUPONS_KEY, JSON.stringify(updated));
    notifyDiscountsUpdated();
  }
}

export function getUsedProductDiscounts(): string[] {
  try {
    const raw = localStorage.getItem(USED_PRODUCT_DISCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function isProductDiscountUsed(productId: string): boolean {
  if (!productId) return false;
  const used = getUsedProductDiscounts();
  return used.includes(String(productId));
}

export function markProductDiscountAsUsed(productId: string): void {
  if (!productId) return;
  const idStr = String(productId);
  const current = getUsedProductDiscounts();
  if (!current.includes(idStr)) {
    const updated = [...current, idStr];
    localStorage.setItem(USED_PRODUCT_DISCOUNTS_KEY, JSON.stringify(updated));
    notifyDiscountsUpdated();
  }
}

export function registerUsedDiscountsFromOrder(
  items: Array<{ product?: { id?: string }; id?: string; itemPrice?: number }>,
  couponCode?: string
): void {
  if (couponCode) {
    markCouponAsUsed(couponCode);
  }

  if (Array.isArray(items)) {
    items.forEach((item) => {
      const prodId = item.product?.id || item.id;
      if (prodId) {
        markProductDiscountAsUsed(prodId);
      }
    });
  }

  notifyDiscountsUpdated();
}

function notifyDiscountsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('camisa10_discounts_updated'));
  }
}
