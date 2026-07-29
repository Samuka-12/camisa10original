import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { ShoppingCart } from 'lucide-react';

interface StickyPurchaseBarProps {
  product: any;
  selectedVersion?: 'Torcedor' | 'Jogador';
  isCustomized?: boolean;
  customName?: string;
  customNumber?: string;
  customPhrase?: string;
}

export const StickyPurchaseBar: React.FC<StickyPurchaseBarProps> = ({
  product,
  selectedVersion = 'Torcedor',
  isCustomized = false,
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

  const rawBasePrice = product.priceNum || 109.93;
  let basePriceNum = getAdjustedPrice(rawBasePrice, product.category, product.id);
  if (selectedVersion === 'Jogador') basePriceNum += 20;
  if (isCustomized) basePriceNum += 20;

  const displayPrice = `R$ ${basePriceNum.toFixed(2).replace('.', ',')}`;

  const handleBuy = () => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho na barra de compra!");
      return;
    }
    addItem(product, selectedSize, {
      type: selectedVersion,
      isCustomized,
      customName,
      customNumber,
      customPhrase,
      itemPrice: basePriceNum
    });
  };

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

  const btnShape = barConfig.formato || 'rounded-xl';
  const btnStyle: React.CSSProperties = {
    background: barConfig.corBotao || '#dc2626',
    color: barConfig.corTexto || '#ffffff',
    border: 'none',
    padding: '10px 24px',
    fontWeight: 900,
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={barStyle} className="animate-fade-in">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-5xl">
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <img 
            src={product.image || product.imagem_url || "/placeholder.svg"} 
            alt={product.name}
            className="w-10 h-10 object-contain bg-white/5 rounded-lg border border-white/10"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{product.name}</h4>
            <p className="text-xs text-green-400 font-extrabold">{displayPrice}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-white/10 p-1 rounded-xl">
            <span className="text-[10px] text-gray-400 font-bold px-2 hidden xs:inline">Tam:</span>
            {(product.sizes || ['P', 'M', 'G', 'GG']).map((size: string) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedSize === size
                    ? "bg-purple-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleBuy}
            style={btnStyle}
            className={`${btnShape} ${pulseClass} hover:opacity-90 active:scale-95`}
          >
            <ShoppingCart size={16} />
            <span>COMPRAR • {displayPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
