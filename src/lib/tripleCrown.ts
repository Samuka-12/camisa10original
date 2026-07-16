/**
 * tripleCrown.ts — Promoção "Tríplice Coroa"
 * ──────────────────────────────────────────────────────────────────────────────
 * Módulo 100% puro (sem efeitos colaterais) com toda a lógica da promoção.
 *
 * Mecânica:
 *  • A cada 3 camisetas no carrinho, a de MENOR VALOR sai de graça (100% off).
 *  • Com 3 ou mais itens, o frete é automaticamente zerado.
 *  • Para grupos com valores iguais, a terceira unidade adicionada é a gratuita.
 *
 * Algoritmo:
 *  1. Expande todos os CartItems em unidades individuais (respeitando quantity).
 *  2. Ordena as unidades por preço DECRESCENTE (mais caro → mais barato).
 *  3. Em cada bloco de 3, a posição [2] (a mais barata do grupo) é gratuita.
 *  4. Consolida unidades gratuitas agrupadas por (productId + size) para o UI.
 *
 * Integração com o checkout:
 *  • `totalDiscount` representa o valor bruto a subtrair do subtotal.
 *  • O gateway Sigilo Pay recebe `totalPrice` já com o desconto aplicado.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { CartItem } from "@/contexts/CartContext";

// ─── Tipos Internos ────────────────────────────────────────────────────────────

/** Representa uma unidade individual, expandida a partir de um CartItem. */
interface ExpandedUnit {
  productId: string;
  size: string;
  priceNum: number;
  name: string;
}

// ─── Tipos Públicos ────────────────────────────────────────────────────────────

/**
 * Detalhes de um produto (ou variante produto+size) que receberá desconto 100%.
 * Exposto para o componente SideCart renderizar o feedback visual.
 */
export interface FreeItemEntry {
  /** ID do produto no catálogo. */
  productId: string;
  /** Tamanho selecionado. */
  size: string;
  /** Nome do produto para exibição. */
  name: string;
  /** Preço unitário original (para exibir o valor riscado). */
  priceNum: number;
  /** Quantas unidades deste produto+size são gratuitas nesta rodada. */
  freeQuantity: number;
  /** Valor total gratuito = priceNum × freeQuantity. */
  freeValue: number;
}

/**
 * Resultado completo retornado por `applyTripleCrownDiscount`.
 * Alimenta tanto o CartContext (cálculo financeiro) quanto o SideCart (UI).
 */
export interface TripleCrownResult {
  /** True quando há 3 ou mais unidades no carrinho e a promoção está ativa. */
  isActive: boolean;
  /** True quando o frete deve ser zerado (condição: 3+ unidades). */
  freeShipping: boolean;
  /** Lista de entradas de itens gratuitos, consolidada por produto+size. */
  freeItems: FreeItemEntry[];
  /** Soma total dos descontos em R$ a subtrair do subtotal. */
  totalDiscount: number;
  /** Total de unidades no carrinho (soma de todas as quantities). */
  totalUnits: number;
  /** Quantas unidades individuais saem de graça nesta promoção. */
  freeUnitsCount: number;
}

// ─── Helpers Privados ──────────────────────────────────────────────────────────

/**
 * Expande um array de CartItems em unidades individuais,
 * duplicando cada item de acordo com sua `quantity`.
 */
function expandItems(cartItems: CartItem[]): ExpandedUnit[] {
  const units: ExpandedUnit[] = [];
  for (const item of cartItems) {
    const price = Number(item.itemPrice) || 0;
    for (let q = 0; q < item.quantity; q++) {
      units.push({
        productId: item.product.id,
        size: item.size,
        priceNum: price,
        name: item.product.name,
      });
    }
  }
  return units;
}

// ─── Função Principal ──────────────────────────────────────────────────────────

/**
 * Calcula e retorna o resultado da Promoção Tríplice Coroa para o carrinho atual.
 *
 * @param cartItems - Estado atual dos itens no carrinho (CartContext.items).
 * @returns TripleCrownResult - Resultado imutável com desconto e itens gratuitos.
 *
 * @example
 * const promo = applyTripleCrownDiscount(items);
 * if (promo.isActive) {
 *   const finalPrice = subtotal - promo.totalDiscount;
 * }
 */
export function applyTripleCrownDiscount(cartItems: CartItem[]): TripleCrownResult {
  const totalUnits = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // A promoção exige no mínimo 3 unidades no carrinho.
  if (totalUnits < 3) {
    return {
      isActive: false,
      freeShipping: false,
      freeItems: [],
      totalDiscount: 0,
      totalUnits,
      freeUnitsCount: 0,
    };
  }

  // Ordena decrescente: mais caro primeiro → o item mais barato do grupo (pos [2]) é grátis.
  const units = expandItems(cartItems).sort((a, b) => b.priceNum - a.priceNum);

  // Mapa de acumulação: chave "productId::size" → dados agregados das unidades gratuitas.
  const freeUnitsMap = new Map<
    string,
    { priceNum: number; quantity: number; name: string }
  >();

  const totalGroups = Math.floor(totalUnits / 3);

  for (let g = 0; g < totalGroups; g++) {
    // Em um grupo de 3 (índices g*3, g*3+1, g*3+2), o mais barato está em g*3+2.
    const freeIndex = g * 3 + 2;
    const freeUnit = units[freeIndex];
    const key = `${freeUnit.productId}::${freeUnit.size}`;

    const existing = freeUnitsMap.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      freeUnitsMap.set(key, {
        priceNum: freeUnit.priceNum,
        quantity: 1,
        name: freeUnit.name,
      });
    }
  }

  // Constrói o array final de FreeItemEntry e acumula o desconto total.
  const freeItems: FreeItemEntry[] = [];
  let totalDiscount = 0;

  for (const [key, data] of freeUnitsMap.entries()) {
    const [productId, size] = key.split("::");
    const freeValue = data.priceNum * data.quantity;
    totalDiscount += freeValue;
    freeItems.push({
      productId,
      size,
      priceNum: data.priceNum,
      freeQuantity: data.quantity,
      freeValue,
      name: data.name,
    });
  }

  const freeUnitsCount = freeItems.reduce((acc, fi) => acc + fi.freeQuantity, 0);

  return {
    isActive: true,
    freeShipping: true,
    freeItems,
    totalDiscount,
    totalUnits,
    freeUnitsCount,
  };
}
