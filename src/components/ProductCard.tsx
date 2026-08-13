import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useStoreConfig } from "@/contexts/StoreConfigContext";
import { useCart } from "@/contexts/CartContext";
import { getProductPromotions, promotionLabel } from "@/lib/promotions";
import ProductImage from "./ProductImage";
import { resolveTeamName } from "@/lib/teamName";
import { trackAddToCart, getFbc, getFbp } from "@/lib/metaPixel";

interface ProductCardProps {
  id?: string;
  image: string;
  name: string;
  team: string;
  price: string;
  priceNum?: number;
  category?: string | string[];
  oldPrice?: string;
  externalCheckoutUrl?: string;
  priority?: boolean;
}

const ProductCard = ({ id, image, name, team, price, priceNum, category, oldPrice, priority = false }: ProductCardProps) => {
  const { config } = useStoreConfig();
  const { addItem } = useCart();

  const finalPriceNum = priceNum !== undefined && category ? (config.frontend?.priceRules ? (() => {
    // Price adjustment via store config (regras de preço)
    const rules = config.precoGestao?.regras || config.frontend?.priceRules || [];
    let adjusted = priceNum;
    rules.forEach((rule: any) => {
      if (rule.ativo === false) return;
      const catArr = Array.isArray(category) ? category.map((c: string) => c.toLowerCase()) : [String(category).toLowerCase()];
      const matches = rule.escopo === 'tudo' || (rule.escopo === 'categoria' && rule.categoria && catArr.includes(String(rule.categoria).toLowerCase())) || (rule.escopo === 'produto' && rule.produtoId === id);
      if (matches && rule.percentual) {
        adjusted = rule.op === 'aumentar' ? adjusted * (1 + rule.percentual / 100) : adjusted * (1 - rule.percentual / 100);
      }
    });
    return adjusted;
  })() : priceNum) : null;
  const displayPrice = finalPriceNum !== null ? `R$ ${finalPriceNum.toFixed(2).replace('.', ',')}` : price;

  // Promoções progressivas ativas para este produto (configuradas no painel)
  const activePromos = getProductPromotions(config.precoGestao?.promocoes, { id, category });
  const cashbackCfg = config.precoGestao?.cashback;
  const cashbackBadge =
    cashbackCfg?.ativo && cashbackCfg.tipo === 'percentual' && cashbackCfg.percentual > 0
      ? `${cashbackCfg.percentual}% de cashback`
      : cashbackCfg?.ativo && cashbackCfg.tipo === 'fixo' && cashbackCfg.valorFixo > 0
        ? `R$ ${cashbackCfg.valorFixo.toFixed(2).replace('.', ',')} de cashback`
        : null;

  // ── Personalização diretamente no card ──────────────────────────────────────
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;

    const product = {
      id,
      image,
      name,
      team,
      price,
      priceNum: priceNum ?? (finalPriceNum || 109.93),
      category,
      sizes: ['P', 'M', 'G', 'GG', 'XGG'],
    };

    const isCustomized = showCustom && (customName.trim() || customNumber.trim());
    const basePrice = priceNum ?? 109.93;
    const customAddon = isCustomized ? 20 : 0;
    const itemPrice = (finalPriceNum ?? basePrice) + customAddon;

    addItem(product, 'M', {
      type: 'Torcedor',
      isCustomized,
      customName: isCustomized ? customName.trim() : undefined,
      customNumber: isCustomized ? customNumber.trim() : undefined,
      itemPrice,
    });

    // Track AddToCart
    trackAddToCart({
      productId: id,
      productName: name,
      price: itemPrice,
      quantity: 1,
      userData: { fbc: getFbc(), fbp: getFbp() },
    }).catch(() => {});

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  }, [id, image, name, team, price, priceNum, category, finalPriceNum, showCustom, customName, customNumber, addItem]);

  const pulse = config.pulseComprar;
  const pulseClass = pulse?.ativo ? 'animate-btn-pulse' : '';
  const pulseColor = pulse?.cor || '#2563eb';
  const pulseSpeed = pulse?.velocidade === 'lento' ? '2.5s' : pulse?.velocidade === 'rapido' ? '1.2s' : '1.8s';
  const pulseScale = pulse?.tamanho || '1.05';

  return (
    <Link to={id ? `/produto/${id}` : "#"} className="block">
      <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-secondary flex items-center justify-center p-2">
          <ProductImage
            src={image}
            alt={name}
            width={512}
            height={512}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="max-w-[92%] max-h-[92%] object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{resolveTeamName(team, name)}</p>
          <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2">{name}</h3>
          <div className="mt-2 flex items-center gap-2">
            {oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{oldPrice}</span>
            )}
            <span className="text-base font-bold text-primary">{displayPrice}</span>
          </div>

          {(activePromos.length > 0 || cashbackBadge) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {activePromos.map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] font-bold px-2 py-1 rounded-md"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}
                >
                  🎁 {promotionLabel(p)}
                </span>
              ))}
              {cashbackBadge && (
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-md"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}
                >
                  💸 {cashbackBadge}
                </span>
              )}
            </div>
          )}

          {/* ── Personalização rápida no card ── */}
          <div className="mt-3 space-y-2">
            {/* Botão Personalizar */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCustom(!showCustom); }}
              className="w-full py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-accent hover:text-accent transition-colors bg-transparent"
            >
              {showCustom ? '✕ Ocultar personalização' : '🏷️ Adicionar Nome/Número (+ R$ 20)'}
            </button>

            {/* Campos de personalização */}
            {showCustom && (
              <div className="space-y-2 bg-secondary/50 p-3 rounded-lg border border-border/50 animate-fade-in">
                <input
                  type="text"
                  placeholder="Nome nas costas (ex: NEYMAR JR)"
                  value={customName}
                  onChange={(e) => { e.stopPropagation(); setCustomName(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                  maxLength={20}
                />
                <input
                  type="text"
                  placeholder="Número (ex: 10)"
                  value={customNumber}
                  onChange={(e) => { e.stopPropagation(); setCustomNumber(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
                  maxLength={3}
                />
                <p className="text-[10px] text-muted-foreground">+ R$ 20,00 no valor final. Tamanho M.</p>
              </div>
            )}
          </div>

          {/* ── Botão Adicionar ao Carrinho ── */}
          <div
            onClick={handleQuickAdd}
            style={pulse?.ativo ? {
              '--pulse-color': pulseColor,
              '--pulse-speed': pulseSpeed,
              '--pulse-scale': pulseScale
            } as React.CSSProperties : {}}
            className={`mt-3 w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold text-center hover:bg-accent/90 transition-colors cursor-pointer ${pulseClass} ${addedFeedback ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-card' : ''}`}
          >
            {addedFeedback ? '✓ Adicionado!' : 'Comprar'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes btnPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 var(--pulse-color, #2563eb)80; }
          70% { transform: scale(var(--pulse-scale, 1.05)); box-shadow: 0 0 0 8px var(--pulse-color, #2563eb)00; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 var(--pulse-color, #2563eb)00; }
        }
        .animate-btn-pulse {
          animation: btnPulse var(--pulse-speed, 1.8s) infinite ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </Link>
  );
};

export default ProductCard;
