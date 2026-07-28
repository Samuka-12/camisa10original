import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStoreConfig, FloatingStory } from '../contexts/StoreConfigContext';
import { getProductById, allProducts } from '../data/products';
import { supabase } from '../lib/supabase';
import { X, Play, ShoppingCart } from 'lucide-react';

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

  // Fetch db products to check links in stories
  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const { data } = await supabase.from('produtos').select('*');
        if (data) setDbProducts(data);
      } catch (err) {}
    };
    fetchDbProducts();
  }, [activeStory]);

  // Extract product ID from URL if on product page
  const pathParts = location.pathname.split('/');
  const isProductPage = pathParts[1] === 'produto';
  const currentProductId = isProductPage ? pathParts[2] : null;

  // Filter stories based on visibility settings
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

  // Find linked product (either from allProducts or Supabase dbProducts)
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

  // Drag handlers
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
    e.preventDefault(); // Prevent scrolling while dragging
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
      {/* Floating story bubbles */}
      {visibleStories.map((story, index) => {
        const defaultX = window.innerWidth - 90;
        const defaultY = 150 + index * 95;
        const pos = positions[story.id] || { x: defaultX, y: defaultY };

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
            {/* Story Ring */}
            <div className="w-[70px] h-[70px] rounded-full p-[3px] bg-gradient-to-tr from-purple-600 via-pink-600 to-yellow-500 animate-pulse shadow-xl">
              <div className="w-full h-full rounded-full border border-black bg-slate-900 flex items-center justify-center overflow-hidden relative">
                <Play className="w-6 h-6 text-white drop-shadow-md z-10 fill-white" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              </div>
            </div>
            {/* Tiny tag */}
            <span className="text-[10px] bg-black/80 text-white px-2 py-0.5 rounded-full mt-1 font-bold whitespace-nowrap shadow border border-white/10 max-w-[80px] overflow-hidden text-ellipsis">
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
          {/* Close button */}
          <button 
            onClick={() => setActiveStory(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition shadow-lg z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Modal Container */}
          <div 
            className="relative w-full max-w-[450px] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            {/* Video Box */}
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

            {/* Bottom info section */}
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
                      className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition shadow flex items-center justify-center"
                      title="Ver Produto / Comprar"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                );
              })() : (
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/20 p-3.5 rounded-2xl text-center">
                  <p className="text-white text-sm font-extrabold tracking-wide uppercase">
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
