import { Link } from "react-router-dom";
import { useStoreConfig } from "@/contexts/StoreConfigContext";
import { getProductPromotions, promotionLabel } from "@/lib/promotions";
import ProductImage from "./ProductImage";

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
  const { getAdjustedPrice, config } = useStoreConfig();

  const finalPriceNum = priceNum && category ? getAdjustedPrice(priceNum, category, id) : null;
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
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{team}</p>
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
          <div 
            style={pulse?.ativo ? { 
              '--pulse-color': pulseColor, 
              '--pulse-speed': pulseSpeed, 
              '--pulse-scale': pulseScale 
            } as React.CSSProperties : {}}
            className={`mt-3 w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold text-center hover:bg-accent/90 transition-colors ${pulseClass}`}
          >
            Comprar
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
      `}</style>
    </Link>
  );
};

export default ProductCard;
