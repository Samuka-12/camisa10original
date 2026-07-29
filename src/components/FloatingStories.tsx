import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStoreConfig, FloatingStory } from '../contexts/StoreConfigContext';
import { getProductById, allProducts } from '../data/products';
import { supabase } from '../lib/supabase';
import { X, Play, ShoppingCart } from 'lucide-react';

// Helper: returns CSS animation duration string based on velocity
function getPulseDuration(vel?: string) {
  if (vel === 'lento') return '2.4s';
  if (vel === 'rapido') return '0.8s';
  return '1.4s'; // normal
}

export const FloatingStories: React.FC = () => {
  const { config } = useStoreConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStory, setActiveStory] = useState<FloatingStory | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  // Dragging state
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const dragInfo = useRef<{ id: string; startX: number; startY: number; posX: number; posY: number; hasMoved: boolean } | null>(null);

  const stories = config.stories?.lista || [];

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const { data } = await supabase.from('produtos').select('*');
        if (data) setDbProducts(data);
      } catch (err) {}
    };
    fetchDbProducts();
  }, [activeStory]);

  const pathParts = location.pathname.split('/');
  const isProductPage = pathParts[1] === 'produto';
  const currentProductId = isProductPage ? pathParts[2] : null;

  const visibleStories = stories.filter(story => {
    if (story.visibilidade === 'global') return true;
    if (story.visibilidade === 'inicial' && (location.pathname === '/' || location.pathname === '')) return true;
    if (story.visibilidade === 'categoria' && story.categoriaVisib) {
      const slug = story.categoriaVisib.toLowerCase();
      return location.pathname.toLowerCase().includes(slug);
    }
    if (story.visibilidade === 'produto' && story.produtoPaginaId) {
      return currentProductId === story.produtoPaginaId;
    }
    return false;
  });

  if (visibleStories.length === 0) return null;

  const getLinkedProduct = (productId: string) => {
    const local = getProductById(productId);
    if (local) return { ...local, priceNum: local.priceNum };
    const dbProd = dbProducts.find(p => p.id === productId);
    if (dbProd) {
      return {
        id: dbProd.id,
        name: dbProd.nome,
        price: `R$ ${dbProd.preco.toFixed(2).replace('.', ',')}`,
        priceNum: dbProd.preco,
        image: dbProd.imagem_url || dbProd.image,
        team: dbProd.team || 'Time'
      };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const currentPos = positions[id] || { x: window.innerWidth - 90, y: 150 + visibleStories.indexOf(visibleStories.find(s => s.id === id)!) * 90 };
    dragInfo.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      posX: currentPos.x,
      posY: currentPos.y,
      hasMoved: false
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragInfo.current) return;
    const { id, startX, startY, posX, posY } = dragInfo.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      dragInfo.current.hasMoved = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 85, posX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 85, posY + deltaY));

    setPositions(prev => ({
      ...prev,
      [id]: { x: newX, y: newY }
    }));
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    const touch = e.touches[0];
    const currentPos = positions[id] || { x: window.innerWidth - 90, y: 150 + visibleStories.indexOf(visibleStories.find(s => s.id === id)!) * 90 };
    dragInfo.current = {
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      posX: currentPos.x,
      posY: currentPos.y,
      hasMoved: false
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragInfo.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const { id, startX, startY, posX, posY } = dragInfo.current;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      dragInfo.current.hasMoved = true;
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 85, posX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 85, posY + deltaY));

    setPositions(prev => ({
      ...prev,
      [id]: { x: newX, y: newY }
    }));
  };

  const handleTouchEnd = () => {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const handleStoryClick = (story: FloatingStory) => {
    if (dragInfo.current?.hasMoved) return;
    setActiveStory(story);
  };

  return (
    <>
      {/* Pulse animation style block */}
      <style>{`
        @keyframes storyPulseAnim {
          0%, 100% { box-shadow: 0 0 0 0 var(--story-pulse-color, rgba(124,58,237,0.6)); transform: scale(1); }
          50% { box-shadow: 0 0 0 calc(var(--story-pulse-size, 8) * 1px) transparent; transform: scale(var(--story-pulse-scale, 1.06)); }
        }
      `}</style>

      {/* Floating story bubbles */}
      {visibleStories.map((story, index) => {
        const defaultX = window.innerWidth - 90;
        const defaultY = 150 + index * 95;
        const pos = positions[story.id] || { x: defaultX, y: defaultY };

        // Story-specific colors (fallback to defaults)
        const ringColor = story.corFundo || 'linear-gradient(to top right, #7c3aed, #ec4899, #eab308)';
        const btnColor = story.corBotao || '#7c3aed';
        const pulseActive = story.pulseAtivo !== false; // default true
        const pulseDuration = getPulseDuration(story.pulseVelocidade);
        const pulseSize = story.pulseTamanho || '8';

        return (
          <div
            key={story.id}
            onMouseDown={(e) => handleMouseDown(e, story.id)}
            onTouchStart={(e) => handleTouchStart(e, story.id)}
            onClick={() => handleStoryClick(story)}
            style={{
              position: 'fixed',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              zIndex: 9990,
              width: '74px',
              height: '74px',
              cursor: 'grab',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              touchAction: 'none',
              transition: dragInfo.current?.id === story.id ? 'none' : 'transform 0.15s ease-out'
            }}
            className="group hover:scale-105 active:cursor-grabbing"
          >
            {/* Story Ring with custom or default gradient */}
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                padding: '3px',
                background: ringColor.startsWith('linear') ? ringColor : `linear-gradient(135deg, ${ringColor}, ${btnColor})`,
                boxShadow: pulseActive ? `0 0 0 0 ${btnColor}55` : '0 4px 20px rgba(0,0,0,0.3)',
                animation: pulseActive ? `storyPulseAnim ${pulseDuration} ease-in-out infinite` : 'none',
                ['--story-pulse-color' as any]: `${btnColor}66`,
                ['--story-pulse-size' as any]: pulseSize,
                ['--story-pulse-scale' as any]: '1.06',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '2px solid black',
                  backgroundColor: story.corFundo || '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Play
                  style={{
                    width: '24px',
                    height: '24px',
                    color: story.corFonte || '#ffffff',
                    fill: story.corFonte || '#ffffff',
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
                    zIndex: 10
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', transition: 'background 0.2s' }} />
              </div>
            </div>
            {/* Label */}
            <span
              style={{
                fontSize: '10px',
                background: story.corFundo ? `${story.corFundo}dd` : 'rgba(0,0,0,0.8)',
                color: story.corFonte || '#ffffff',
                padding: '2px 8px',
                borderRadius: '20px',
                marginTop: '4px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {story.nome || "Story"}
            </span>
          </div>
        );
      })}

      {/* Story Video Modal Overlay */}
      {activeStory && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveStory(null)}
        >
          <button
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition shadow-lg z-50"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full max-w-[450px] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            <div className="relative w-full aspect-[9/16] bg-black flex-1 flex items-center justify-center overflow-hidden">
              <video
                src={activeStory.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                playsInline
                loop
              />
            </div>

            <div className="w-full bg-neutral-900/95 border-t border-white/10 p-4">
              {activeStory.tipoViculo === 'produto' && activeStory.produtoId ? (() => {
                const prod = getLinkedProduct(activeStory.produtoId);
                if (!prod) return <p className="text-sm text-gray-400 text-center">Produto vinculado indisponível</p>;

                return (
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <img
                      src={prod.image || "/placeholder.svg"}
                      alt={prod.name}
                      className="w-14 h-14 object-contain bg-white/10 rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide">{prod.team}</p>
                      <h4 className="text-sm font-bold text-white truncate">{prod.name}</h4>
                      <p className="text-sm text-green-400 font-extrabold">{prod.price}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveStory(null);
                        navigate(`/produto/${prod.id}`);
                      }}
                      style={{ backgroundColor: activeStory.corBotao || '#7c3aed' }}
                      className="hover:opacity-80 text-white p-3 rounded-xl transition shadow flex items-center justify-center"
                      title="Ver Produto / Comprar"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                );
              })() : (
                <div
                  style={{
                    background: activeStory.corFundo
                      ? `linear-gradient(135deg, ${activeStory.corFundo}88, ${activeStory.corBotao || '#7c3aed'}88)`
                      : 'linear-gradient(135deg, rgba(88,28,135,0.5), rgba(157,23,77,0.5))',
                    borderRadius: '16px',
                    padding: '14px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <p
                    style={{
                      color: activeStory.corFonte || '#ffffff',
                      fontSize: '14px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {activeStory.textoPromo || "Confira nossas ofertas exclusivas!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
