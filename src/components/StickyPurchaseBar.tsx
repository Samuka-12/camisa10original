import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { ShoppingCart } from 'lucide-react';

interface StickyPurchaseBarProps {
  product: any;
  selectedType: string;
  customName?: string;
  customNumber?: string;
  customPhrase?: string;
}

export const StickyPurchaseBar: React.FC<StickyPurchaseBarProps> = ({
  product,
  selectedType,
  customName,
  customNumber,
  customPhrase
}) => {
  const { config, getAdjustedPrice } = useStoreConfig();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollY = useRef(0);

  const barConfig = config.barraCompraFixa;

  useEffect(() => {
    if (!barConfig?.ativo) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isPastThreshold = currentScrollY > 500;
      
      let directionMatch = true;
      if (barConfig.rolagem === 'subir') {
        directionMatch = currentScrollY < lastScrollY.current;
      } else if (barConfig.rolagem === 'descer') {
        directionMatch = currentScrollY > lastScrollY.current;
      }

      setIsVisible(isPastThreshold && directionMatch);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [barConfig]);

  if (!barConfig?.ativo || !isVisible) return null;

  const adjustedPriceNum = getAdjustedPrice(product.priceNum, product.category, product.id);
  const displayPrice = `R$ ${adjustedPriceNum.toFixed(2).replace('.', ',')}`;

  const handleBuy = () => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho na barra de compra!");
      return;
    }
    addItem(product, selectedSize, {
      type: selectedType as any,
      customName,
      customNumber,
      customPhrase
    });
  };

  // Pulse effect class mappings
  const pulse = config.pulseComprar;
  const pulseClass = pulse?.ativo ? 'animate-sticky-pulse' : '';

  const positionStyle: React.CSSProperties = barConfig.posicao === 'top' 
    ? { top: '0', borderBottom: '1px solid rgba(255,255,255,0.08)' } 
    : { bottom: '0', borderTop: '1px solid rgba(255,255,255,0.08)' };

  const barStyle: React.CSSProperties = {
    ...positionStyle,
    position: 'fixed',
    left: 0,
    width: '100%',
    zIndex: 40,
    background: `rgba(15, 23, 42, ${barConfig.transparenciaFundo || '0.9'})`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '12px 20px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.3s ease-in-out'
  };

  // Button format & style
  const btnShape = barConfig.formato || 'rounded-xl';
  const btnStyle: React.CSSProperties = {
    background: barConfig.corBotao || '#dc2626',
    borderRadius: barConfig.arredondamento || '12px',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '14px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s'
  };

  return (
    <div style={barStyle} className="animate-slide-up">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-6xl">
        
        {/* Product preview */}
        <div className="flex items-center gap-3">
          <img 
            src={product.image || "/placeholder.svg"} 
            alt={product.name} 
            className="w-12 h-12 object-contain bg-white/10 rounded-lg"
          />
          <div className="hidden md:block">
            <h4 className="text-sm font-bold text-white max-w-[200px] truncate">{product.name}</h4>
            <p className="text-xs text-muted-foreground">{product.team}</p>
          </div>
          <span className="text-base font-extrabold text-white ml-2">{displayPrice}</span>
        </div>

        {/* Sizes & Buy Action */}
        <div className="flex items-center gap-3">
          {/* Size dropdown or selector */}
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="">Tamanho</option>
            {product.sizes?.map((size: string) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          {/* Action button */}
          <button
            onClick={handleBuy}
            style={btnStyle}
            className={`${btnShape} ${pulseClass} hover:opacity-90 active:scale-95`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>

      </div>

      <style>{`
        @keyframes stickyPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 ${barConfig.corBotao || '#dc2626'}80; }
          70% { transform: scale(${pulse?.tamanho || '1.05'}); box-shadow: 0 0 0 10px ${barConfig.corBotao || '#dc2626'}00; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 ${barConfig.corBotao || '#dc2626'}00; }
        }
        .animate-sticky-pulse {
          animation: stickyPulse ${pulse?.velocidade === 'lento' ? '2.5s' : pulse?.velocidade === 'rapido' ? '1.2s' : '1.8s'} infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
