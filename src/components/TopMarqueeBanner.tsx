import React from 'react';
import { useStoreConfig } from '../contexts/StoreConfigContext';

export const TopMarqueeBanner: React.FC = () => {
  const { config } = useStoreConfig();
  const banner = config.bannerTopo;

  if (!banner?.ativo) return null;

  const containerStyle: React.CSSProperties = {
    background: banner.corFundo || '#0f172a',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: banner.imagem ? '0' : '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    zIndex: 99
  };

  const marqueeStyle: React.CSSProperties = {
    display: 'flex',
    whiteSpace: 'nowrap',
    animation: `marqueeScroll ${banner.velocidade || 30}s linear infinite`
  };

  const itemStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: banner.corTexto || '#ffffff',
    paddingRight: '60px',
    letterSpacing: '0.05em'
  };

  return (
    <div style={containerStyle}>
      {banner.imagem ? (
        <div style={{ width: '100%', height: 'auto', display: 'flex', overflow: 'hidden' }}>
          <img 
            src={banner.imagem} 
            alt="Anúncio Topo" 
            style={{ width: '100%', maxHeight: '128px', objectFit: 'cover' }} 
          />
        </div>
      ) : (
        <div className="w-full flex">
          <div style={marqueeStyle}>
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} style={itemStyle}>
                {banner.textoMarquee || '🔥 PROMOÇÃO DA SEMANA - FRETE GRÁTIS ACIMA DE R$ 300! 🔥'}
              </span>
            ))}
          </div>
          <div style={marqueeStyle} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} style={itemStyle}>
                {banner.textoMarquee || '🔥 PROMOÇÃO DA SEMANA - FRETE GRÁTIS ACIMA DE R$ 300! 🔥'}
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
