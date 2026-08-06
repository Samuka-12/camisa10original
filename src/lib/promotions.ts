/**
 * promotions.ts — Cashback + Promoções Progressivas
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo 100% puro (sem efeitos colaterais), usado por:
 *  • Vitrine (badge de promoção no card do produto)
 *  • CartContext / SideCart (cálculo e exibição)
 *  • Checkout (valor final do pedido + cashback gerado)
 *
 * Nada aqui altera a lógica já existente (regras de preço, cupons, Tríplice
 * Coroa). Os descontos progressivos são aplicados DEPOIS da Tríplice Coroa e
 * ANTES do cupom, e o cashback é calculado sobre o total final.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CashbackQtyRule {
  id: string;
  quantidadeMinima: number;
  tipo: 'percentual' | 'fixo';
  valor: number;
}

export interface CashbackConfig {
  ativo: boolean;
  tipo: 'percentual' | 'fixo';
  percentual: number;      // % sobre o total
  valorFixo: number;       // R$ fixo
  valorMinimo: number;     // valor mínimo do pedido para gerar cashback
  validadeDias: number;    // validade do saldo em dias
  dataValidade?: string;   // data limite da campanha (ISO)
  regrasQuantidade: CashbackQtyRule[];
  texto?: string;          // texto exibido ao cliente
}

export type PromoTipo =
  | 'preco_fechado'   // Compre N por R$ X
  | 'progressivo'     // Faixas: 2 = 5%, 3 = 10%, 4 = 15%...
  | 'quantidade'      // A partir de N unidades: desconto % ou R$
  | 'percentual'      // Desconto percentual simples
  | 'fixo';           // Desconto fixo em R$

export interface PromoFaixa {
  id: string;
  quantidade: number;
  tipo: 'percentual' | 'fixo';
  valor: number;
}

export interface PromocaoProgressiva {
  id: string;
  nome: string;
  descricao?: string;
  ativa: boolean;
  tipo: PromoTipo;
  escopo: 'tudo' | 'categoria' | 'produto';
  categoria?: string;
  produtoId?: string;
  quantidade: number;    // gatilho (N)
  valorPacote: number;   // "Compre N por R$ X"
  percentual: number;    // desconto %
  valorFixo: number;     // desconto R$
  faixas: PromoFaixa[];  // usado no tipo progressivo
  dataInicio?: string;
  dataFim?: string;
  criadaEm: string;
}

export interface AppliedPromotion {
  id: string;
  nome: string;
  tipo: PromoTipo;
  descricao?: string;
  desconto: number;
}

export interface PromotionsResult {
  isActive: boolean;
  totalDiscount: number;
  applied: AppliedPromotion[];
}

export interface CashbackResult {
  ativo: boolean;
  valor: number;
  percentualAplicado: number;
  validadeDias: number;
  faltaParaMinimo: number;
  texto: string;
}

export const DEFAULT_CASHBACK: CashbackConfig = {
  ativo: false,
  tipo: 'percentual',
  percentual: 5,
  valorFixo: 0,
  valorMinimo: 0,
  validadeDias: 30,
  dataValidade: '',
  regrasQuantidade: [],
  texto: 'Você ganha {valor} de cashback nesta compra!',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/** Categorias do produto normalizadas em array de strings minúsculas. */
function productCategories(product: any): string[] {
  const raw = product?.category ?? product?.categoria ?? product?.categorias ?? [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter(Boolean).map((c: any) => String(c).toLowerCase());
}

export function isPromotionCurrentlyActive(promo: PromocaoProgressiva, now = new Date()): boolean {
  if (!promo || !promo.ativa) return false;
  if (promo.dataInicio && new Date(promo.dataInicio) > now) return false;
  if (promo.dataFim && new Date(promo.dataFim) < now) return false;
  return true;
}

/** A promoção se aplica a este produto? */
export function promotionMatchesProduct(promo: PromocaoProgressiva, product: any): boolean {
  if (!promo) return false;
  if (promo.escopo === 'tudo') return true;
  if (promo.escopo === 'produto') return !!promo.produtoId && String(promo.produtoId) === String(product?.id);
  if (promo.escopo === 'categoria') {
    if (!promo.categoria) return false;
    return productCategories(product).includes(String(promo.categoria).toLowerCase());
  }
  return false;
}

/** Texto curto da promoção — usado como selo na vitrine e na página do produto. */
export function promotionLabel(promo: PromocaoProgressiva): string {
  const brl = (v: number) => `R$ ${round2(v).toFixed(2).replace('.', ',')}`;
  switch (promo.tipo) {
    case 'preco_fechado':
      return `Leve ${promo.quantidade} por ${brl(promo.valorPacote)}`;
    case 'progressivo': {
      const faixas = [...(promo.faixas || [])].sort((a, b) => a.quantidade - b.quantidade);
      if (!faixas.length) return promo.nome;
      const f = faixas[0];
      return `A partir de ${f.quantidade} un: ${f.tipo === 'percentual' ? `${f.valor}% OFF` : `${brl(f.valor)} OFF`} (desconto progressivo)`;
    }
    case 'quantidade':
      return `Compre ${promo.quantidade}+ e ganhe ${promo.percentual > 0 ? `${promo.percentual}% OFF` : `${brl(promo.valorFixo)} OFF`}`;
    case 'percentual':
      return `${promo.percentual}% OFF`;
    case 'fixo':
      return `${brl(promo.valorFixo)} OFF`;
    default:
      return promo.nome;
  }
}

/** Promoções ativas que valem para um produto — para exibição na vitrine. */
export function getProductPromotions(
  promocoes: PromocaoProgressiva[] | undefined,
  product: any,
  now = new Date()
): PromocaoProgressiva[] {
  return (promocoes || []).filter(p => isPromotionCurrentlyActive(p, now) && promotionMatchesProduct(p, product));
}

// ─── Cálculo das promoções no carrinho ────────────────────────────────────────

interface Unit {
  price: number;
  product: any;
}

function expandUnits(items: any[]): Unit[] {
  const units: Unit[] = [];
  (items || []).forEach(item => {
    const qty = Math.max(0, Math.floor(toNumber(item?.quantity, 1)));
    const price = toNumber(item?.itemPrice, 0);
    for (let i = 0; i < qty; i++) units.push({ price, product: item?.product || item });
  });
  return units;
}

function discountForPromo(promo: PromocaoProgressiva, units: Unit[]): number {
  if (!units.length) return 0;
  const sorted = [...units].sort((a, b) => b.price - a.price);
  const eligibleSubtotal = sorted.reduce((s, u) => s + u.price, 0);
  const qty = sorted.length;
  let discount = 0;

  switch (promo.tipo) {
    case 'preco_fechado': {
      const n = Math.max(1, Math.floor(toNumber(promo.quantidade, 0)));
      const pacote = toNumber(promo.valorPacote, 0);
      if (!n || pacote <= 0) return 0;
      const packs = Math.floor(qty / n);
      for (let p = 0; p < packs; p++) {
        const group = sorted.slice(p * n, p * n + n);
        const groupTotal = group.reduce((s, u) => s + u.price, 0);
        if (groupTotal > pacote) discount += groupTotal - pacote;
      }
      break;
    }
    case 'progressivo': {
      const faixas = [...(promo.faixas || [])]
        .map(f => ({ ...f, quantidade: toNumber(f.quantidade, 0), valor: toNumber(f.valor, 0) }))
        .filter(f => f.quantidade > 0)
        .sort((a, b) => a.quantidade - b.quantidade);
      const faixa = faixas.filter(f => qty >= f.quantidade).pop();
      if (!faixa) return 0;
      discount = faixa.tipo === 'fixo' ? faixa.valor : eligibleSubtotal * (faixa.valor / 100);
      break;
    }
    case 'quantidade': {
      const n = Math.max(1, Math.floor(toNumber(promo.quantidade, 0)));
      if (qty < n) return 0;
      const perc = toNumber(promo.percentual, 0);
      discount = perc > 0 ? eligibleSubtotal * (perc / 100) : toNumber(promo.valorFixo, 0);
      break;
    }
    case 'percentual': {
      const perc = toNumber(promo.percentual, 0);
      if (perc <= 0) return 0;
      discount = eligibleSubtotal * (perc / 100);
      break;
    }
    case 'fixo': {
      discount = toNumber(promo.valorFixo, 0);
      break;
    }
    default:
      return 0;
  }

  return round2(Math.max(0, Math.min(discount, eligibleSubtotal)));
}

/**
 * Calcula o desconto total das promoções progressivas sobre os itens do carrinho.
 * `baseTotal` (opcional) limita o desconto ao valor ainda disponível no pedido.
 */
export function computePromotions(
  items: any[],
  promocoes: PromocaoProgressiva[] | undefined,
  baseTotal?: number,
  now = new Date()
): PromotionsResult {
  const units = expandUnits(items);
  const active = (promocoes || []).filter(p => isPromotionCurrentlyActive(p, now));
  const applied: AppliedPromotion[] = [];
  let totalDiscount = 0;

  active.forEach(promo => {
    const eligible = units.filter(u => promotionMatchesProduct(promo, u.product));
    const desconto = discountForPromo(promo, eligible);
    if (desconto > 0) {
      applied.push({ id: promo.id, nome: promo.nome, tipo: promo.tipo, descricao: promo.descricao, desconto });
      totalDiscount += desconto;
    }
  });

  const cap = typeof baseTotal === 'number' ? Math.max(0, baseTotal) : Infinity;
  if (totalDiscount > cap) totalDiscount = cap;

  return { isActive: applied.length > 0, totalDiscount: round2(totalDiscount), applied };
}

// ─── Cashback ─────────────────────────────────────────────────────────────────

export function computeCashback(
  cashback: CashbackConfig | undefined,
  orderTotal: number,
  totalUnits: number,
  now = new Date()
): CashbackResult {
  const empty: CashbackResult = {
    ativo: false,
    valor: 0,
    percentualAplicado: 0,
    validadeDias: 0,
    faltaParaMinimo: 0,
    texto: '',
  };

  const cfg = cashback;
  if (!cfg || !cfg.ativo) return empty;
  if (cfg.dataValidade && new Date(cfg.dataValidade) < now) return empty;

  const total = Math.max(0, toNumber(orderTotal, 0));
  const minimo = Math.max(0, toNumber(cfg.valorMinimo, 0));
  if (total <= 0) return empty;
  if (total < minimo) {
    return { ...empty, ativo: true, faltaParaMinimo: round2(minimo - total), validadeDias: toNumber(cfg.validadeDias, 0) };
  }

  // Regra por quantidade tem prioridade (a de maior quantidade mínima atendida)
  const regra = [...(cfg.regrasQuantidade || [])]
    .map(r => ({ ...r, quantidadeMinima: toNumber(r.quantidadeMinima, 0), valor: toNumber(r.valor, 0) }))
    .filter(r => r.quantidadeMinima > 0 && totalUnits >= r.quantidadeMinima)
    .sort((a, b) => a.quantidadeMinima - b.quantidadeMinima)
    .pop();

  let valor = 0;
  let percentualAplicado = 0;

  if (regra) {
    if (regra.tipo === 'percentual') {
      percentualAplicado = regra.valor;
      valor = total * (regra.valor / 100);
    } else {
      valor = regra.valor;
    }
  } else if (cfg.tipo === 'percentual') {
    percentualAplicado = toNumber(cfg.percentual, 0);
    valor = total * (percentualAplicado / 100);
  } else {
    valor = toNumber(cfg.valorFixo, 0);
  }

  valor = round2(Math.max(0, Math.min(valor, total)));
  if (valor <= 0) return { ...empty, ativo: true, validadeDias: toNumber(cfg.validadeDias, 0) };

  const valorTexto = `R$ ${valor.toFixed(2).replace('.', ',')}`;
  const texto = (cfg.texto || DEFAULT_CASHBACK.texto || '')
    .replace('{valor}', valorTexto)
    .replace('{percentual}', String(percentualAplicado))
    .replace('{dias}', String(toNumber(cfg.validadeDias, 0)));

  return {
    ativo: true,
    valor,
    percentualAplicado,
    validadeDias: toNumber(cfg.validadeDias, 0),
    faltaParaMinimo: 0,
    texto,
  };
}

/** Lê a config da loja do cache local (mesma fonte usada pelo resolver de cupons). */
export function readStoreConfigCache(): any {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('store_config_cache') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
