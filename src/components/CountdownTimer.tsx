import React, { useState, useEffect } from 'react';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  productId: string;
  positionFilter?: 'acima_botao' | 'abaixo_botao' | 'rodape' | 'topo' | 'canto';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ productId, positionFilter }) => {
  const { config } = useStoreConfig();
  const timer = config.countdownTimer;

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; days: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!timer?.ativo) return;

    // Check if this product is selected for promotion
    const isTargetProduct = timer.produtosIds && timer.produtosIds.includes(productId);
    if (!isTargetProduct) return;

    const interval = setInterval(() => {
      let targetDate = new Date();
      if (timer.dataHoraLimite) {
        targetDate = new Date(timer.dataHoraLimite);
      } else {
        // Fallback: End of the current day (midnight)
        targetDate.setHours(23, 59, 59, 999);
      }

      const diff = targetDate.getTime() - new Date().getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, productId]);

  if (!timer?.ativo) return null;

  const isTargetProduct = timer.produtosIds && timer.produtosIds.includes(productId);
  if (!isTargetProduct) return null;

  // Filter by position if requested
  if (positionFilter && timer.posicao !== positionFilter) return null;

  const padZero = (n: number) => String(n).padStart(2, '0');

  const containerStyle: React.CSSProperties = {
    background: timer.corFundo || '#991b1b',
    color: timer.corTexto || '#ffffff',
    padding: '12px 16px',
    borderRadius: timer.formato === 'rounded-lg' ? '12px' : timer.formato === 'compact' ? '6px' : '0px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(255,255,255,0.1)'
  };

  const isFixed = timer.posicao === 'topo' || timer.posicao === 'rodape' || timer.posicao === 'canto';
  const fixedStyles: React.CSSProperties = isFixed ? {
    position: 'fixed',
    left: 0,
    width: '100%',
    zIndex: 49,
    ...(timer.posicao === 'topo' ? { top: '56px' } : {}),
    ...(timer.posicao === 'rodape' ? { bottom: 0 } : {}),
    ...(timer.posicao === 'canto' ? { 
      position: 'fixed', 
      bottom: '100px', 
      right: '24px', 
      left: 'auto', 
      width: '280px',
      zIndex: 999 
    } : {})
  } : {};

  return (
    <div style={{ ...containerStyle, ...fixedStyles }} className="animate-fade-in font-sans">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/90">
        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>{timer.titulo || 'OFERTA EXPIRA EM:'}</span>
      </div>
      
      {timer.texto && (
        <p className="text-[11px] text-white/80 text-center mb-1 leading-tight">
          {timer.texto}
        </p>
      )}

      {/* Timer Digits */}
      <div className="flex gap-2 items-center mt-1">
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <span className="bg-black/40 text-white font-extrabold text-lg px-2.5 py-1 rounded border border-white/5 min-w-[34px] text-center">
                {padZero(timeLeft.days)}
              </span>
              <span className="text-[9px] uppercase font-bold text-white/60 mt-0.5">Dias</span>
            </div>
            <span className="font-bold text-white mb-4">:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className="bg-black/40 text-white font-extrabold text-lg px-2.5 py-1 rounded border border-white/5 min-w-[34px] text-center">
            {padZero(timeLeft.hours)}
          </span>
          <span className="text-[9px] uppercase font-bold text-white/60 mt-0.5">Horas</span>
        </div>
        <span className="font-bold text-white mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-black/40 text-white font-extrabold text-lg px-2.5 py-1 rounded border border-white/5 min-w-[34px] text-center">
            {padZero(timeLeft.minutes)}
          </span>
          <span className="text-[9px] uppercase font-bold text-white/60 mt-0.5">Min</span>
        </div>
        <span className="font-bold text-white mb-4">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-black/40 text-rose-400 font-extrabold text-lg px-2.5 py-1 rounded border border-white/5 min-w-[34px] text-center animate-pulse">
            {padZero(timeLeft.seconds)}
          </span>
          <span className="text-[9px] uppercase font-bold text-rose-300 mt-0.5">Seg</span>
        </div>
      </div>
    </div>
  );
};
