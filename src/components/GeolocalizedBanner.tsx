import React, { useState, useEffect } from 'react';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { MapPin, X } from 'lucide-react';

export const GeolocalizedBanner: React.FC = () => {
  const { config } = useStoreConfig();
  const [location, setLocation] = useState<{ cidade: string; estado: string } | null>(null);
  const [closed, setClosed] = useState(false);

  const banner = config.bannerGeolocalizado;

  useEffect(() => {
    if (!banner?.ativo) return;

    const fetchLocation = async () => {
      try {
        const cached = sessionStorage.getItem('user_geo_location');
        if (cached) {
          setLocation(JSON.parse(cached));
          return;
        }

        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city && data.region_code) {
          const loc = { cidade: data.city, estado: data.region_code };
          setLocation(loc);
          sessionStorage.setItem('user_geo_location', JSON.stringify(loc));
        }
      } catch (err) {
        console.warn("Falha ao obter geolocalização do IP, usando fallback.");
      }
    };

    fetchLocation();
  }, [banner?.ativo]);

  if (!banner?.ativo || closed) return null;

  // Compile the text template
  const getBannerText = () => {
    const template = banner.textoTemplate || "Frete grátis para {cidade} - {estado}!";
    if (location) {
      return template
        .replace(/{cidade}/g, location.cidade)
        .replace(/{estado}/g, location.estado);
    }
    // Fallback if location not loaded yet or failed
    return template
      .replace(/para\s+{cidade}\s*-\s*{estado}/g, 'para sua região')
      .replace(/{cidade}/g, 'Sua Cidade')
      .replace(/{estado}/g, 'Seu Estado');
  };

  const textStyle: React.CSSProperties = {
    color: banner.corTexto || '#ffffff',
    fontSize: banner.tamanhoFonte || '14px',
    fontWeight: 'bold',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    flex: 1,
    padding: '0 20px'
  };

  const containerStyle: React.CSSProperties = {
    background: banner.corFundo || '#7c3aed',
    backgroundImage: banner.imagem ? `url(${banner.imagem})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 0',
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  };

  return (
    <div style={containerStyle} className="animate-slide-down">
      <div style={textStyle}>
        <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
        <span>{getBannerText()}</span>
      </div>
      <button 
        onClick={() => setClosed(true)} 
        style={{
          position: 'absolute',
          right: '12px',
          background: 'none',
          border: 'none',
          color: banner.corTexto || '#fff',
          opacity: 0.6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
        className="hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
