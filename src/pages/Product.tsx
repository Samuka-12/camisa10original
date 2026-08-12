import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductById } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { trackViewContent, trackAddToCart, getFbc, getFbp } from "@/lib/metaPixel";
import { useStoreConfig } from "@/contexts/StoreConfigContext";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StickyPurchaseBar } from "@/components/StickyPurchaseBar";
import { supabase } from "@/lib/supabase";
import { normalizeDbProduct } from "@/lib/productImages";
import ProductImage from "@/components/ProductImage";
import SizeChartModal from "@/components/SizeChartModal";

export type VersionType = 'Torcedor' | 'Jogador';

const getSizeChartTab = (name: string = ""): number => {
  const lower = name.toLowerCase();
  if (lower.includes("infantil") || lower.includes("juvenil") || lower.includes("kids") || lower.includes("criança")) return 1;
  if (lower.includes("feminina") || lower.includes("feminino") || lower.includes("women") || lower.includes("woman") || lower.includes("mulher")) return 2;
  return 3; // Masculina (padrão para camisas de time adulto)
};

const sizeChartTabName = (tab: number): string => {
  if (tab === 1) return "Infantil";
  if (tab === 2) return "Feminina";
  return "Masculina";
};

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { config, getAdjustedPrice } = useStoreConfig();

  const [dbProduct, setDbProduct] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  const [selectedVersion, setSelectedVersion] = useState<VersionType>('Torcedor');
  const [isCustomized, setIsCustomized] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPhrase, setCustomPhrase] = useState("");

  // Load product: o BANCO é sempre a fonte de verdade (mesma fonte da vitrine).
  // O catálogo estático é apenas fallback quando não existe registro no banco.
  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setDbLoading(true);
      const local = getProductById(id || "");

      try {
        const { data } = await supabase
          .from("produtos")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (cancelled) return;

        if (data) {
          const normalized = normalizeDbProduct(data);
          // Merge não destrutivo: mantém dados do catálogo estático que o banco não possui
          setDbProduct({
            ...(local || {}),
            ...normalized,
            images: normalized.images.length > 0 ? normalized.images : (local?.images ?? []),
            image: normalized.image || (local as any)?.image || "",
          });
        } else if (local) {
          setDbProduct(local);
        } else {
          setDbProduct(null);
        }
      } catch (err) {
        console.error("Erro ao carregar produto:", err);
        if (!cancelled && local) setDbProduct(local);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const product = dbProduct;

  // Scroll to top and pixel tracking
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!product?.id) return;
    
    const timer = setTimeout(() => {
      trackViewContent({
        productId: product.id,
        productName: product.name,
        category: Array.isArray(product.category) ? product.category[0] : product.category,
        price: product.priceNum,
        userData: { fbc: getFbc(), fbp: getFbp() },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [product?.id]);

  // Gallery media list (Images + Videos combined)
  const mediaList = useMemo(() => {
    if (!product) return [];
    const list: Array<{ type: 'image' | 'video'; url: string }> = [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img: string) => { if (img) list.push({ type: 'image', url: img }); });
    } else if (product.image) {
      list.push({ type: 'image', url: product.image });
    }
    if (product.videos && Array.isArray(product.videos)) {
      product.videos.forEach((vid: string) => { if (vid) list.push({ type: 'video', url: vid }); });
    }
    return list;
  }, [product]);

  // Price calculations:
  // Base = 109,93 (or custom base) + 20 for Jogador + 20 for Personalizada
  const adjustedPrice = useMemo(() => {
    if (!product) return 0;
    const rawBasePrice = product.priceNum || 109.93;
    let base = getAdjustedPrice(rawBasePrice, product.category, product.id);
    if (selectedVersion === 'Jogador') {
      base += 20;
    }
    if (isCustomized) {
      base += 20;
    }
    return base;
  }, [product, selectedVersion, isCustomized, getAdjustedPrice]);

  const displayPrice = useMemo(() => {
    return `R$ ${adjustedPrice.toFixed(2).replace('.', ',')}`;
  }, [adjustedPrice]);

  const handleAdd = () => {
    if (!selectedSize || !product) return;
    addItem(product, selectedSize, {
      type: selectedVersion,
      isCustomized,
      customName: isCustomized ? customName : undefined,
      customNumber: isCustomized ? customNumber : undefined,
      customPhrase: isCustomized ? customPhrase : undefined,
      itemPrice: adjustedPrice
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    trackAddToCart({
      productId: product.id,
      productName: product.name,
      price: adjustedPrice,
      quantity: 1,
      userData: { fbc: getFbc(), fbp: getFbp() },
    });
  };

  const handleWhatsAppBuy = () => {
    if (!product) return;
    const waConfig = config.whatsapp;
    const finalPhone = waConfig?.numero || '5547983174463';
    
    let template = waConfig?.mensagensPersonalizadas?.[product.id] || 
      'Olá! Gostaria de comprar a camisa: *{nome_produto}*. Link: {link_produto}';

    const pageUrl = window.location.href;
    const msg = template
      .replace(/{nome_produto}/g, product.name)
      .replace(/{link_produto}/g, pageUrl);

    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">Carregando detalhes do produto...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">Produto não encontrado</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar para Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const pulse = config.pulseComprar;
  const pulseClass = pulse?.ativo ? 'animate-btn-pulse' : '';
  const pulseColor = pulse?.cor || '#2563eb';
  const pulseSpeed = pulse?.velocidade === 'lento' ? '2.5s' : pulse?.velocidade === 'rapido' ? '1.2s' : '1.8s';
  const pulseScale = pulse?.tamanho || '1.05';

  const currentMedia = mediaList[selectedImage] || mediaList[0];

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      
      {/* Countdown Timer at Top */}
      <CountdownTimer productId={product.id} positionFilter="topo" />

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery with Photo & Video Support */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border group relative">
              {currentMedia?.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <ProductImage
                  src={currentMedia?.url}
                  alt={product.name}
                  priority
                  width={900}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Navigation arrows for carousel if mediaList > 1 */}
              {mediaList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-xl flex items-center justify-center backdrop-blur-sm transition-all shadow-lg hover:scale-110 z-10"
                    title="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-xl flex items-center justify-center backdrop-blur-sm transition-all shadow-lg hover:scale-110 z-10"
                    title="Próxima"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Media Thumbnails (Images & Videos) */}
            {mediaList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {mediaList.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      i === selectedImage ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white">
                        <Play className="w-5 h-5 fill-white text-white" />
                        <span className="text-[8px] font-bold mt-0.5">VÍDEO</span>
                      </div>
                    ) : (
                      <ProductImage
                        src={media.url}
                        alt="" 
                        width={128}
                        height={128}
                        sizes="64px"
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.team}</p>
              <h1 className="text-3xl font-bold text-foreground mt-1 flex items-center gap-2">
                {product.name}
                {config.verificadoLoja?.ativo && (config.verificadoLoja?.posicao === 'produtos' || config.verificadoLoja?.posicao === 'todos') && (
                  <ShieldCheck className="w-6 h-6 text-green-500 fill-green-500/20 animate-pulse" title="Loja Verificada e Segura" />
                )}
              </h1>
            </div>

            <div className="flex items-baseline gap-3">
              {product.oldPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.oldPrice}</span>
              )}
              <span className="text-3xl font-bold text-primary">{displayPrice}</span>
            </div>

            {/* Version Selector (Torcedor / Jogador) */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">1. Escolha a Versão da Camisa</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedVersion('Torcedor')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedVersion === 'Torcedor'
                      ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  <div className="font-bold text-sm text-foreground">Versão Torcedor</div>
                  <div className="text-xs text-green-400 font-medium mt-0.5">Sem custo adicional</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Corte tradicional e confortável</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVersion('Jogador')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedVersion === 'Jogador'
                      ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  <div className="font-bold text-sm text-foreground flex items-center justify-between">
                    <span>Versão Jogador</span>
                    <span className="text-xs bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded font-mono">+ R$ 20,00</span>
                  </div>
                  <div className="text-xs text-purple-400 font-medium mt-0.5">+ R$ 20,00 no valor final</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Ajuste slim e tecido oficial de jogo</div>
                </button>
              </div>
            </div>

            {/* Customization Toggle & Details */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">2. Personalização com Nome & Número</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomized(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isCustomized
                      ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  <div className="font-bold text-xs text-foreground">Sem Personalização</div>
                  <div className="text-[10px] text-green-400 mt-0.5">R$ 0,00</div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomized(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isCustomized
                      ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/50 bg-secondary/30"
                  }`}
                >
                  <div className="font-bold text-xs text-foreground flex items-center justify-between">
                    <span>Com Nome/Número</span>
                    <span className="text-[10px] bg-purple-950 text-purple-300 px-1 py-0.5 rounded font-mono">+ R$ 20,00</span>
                  </div>
                  <div className="text-[10px] text-purple-400 mt-0.5">+ R$ 20,00 no valor final</div>
                </button>
              </div>

              {isCustomized && (
                <div className="space-y-3 bg-secondary/60 p-4 rounded-xl border border-border mt-3 animate-fade-in">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">Preencha seus dados de personalização</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Nome nas costas</label>
                    <input
                      type="text"
                      placeholder="Ex: NEYMAR JR"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Número (Ex: 10)</label>
                    <input
                      type="text"
                      placeholder="10"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-medium">Frase personalizada (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: O melhor de todos"
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Size Selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">3. Selecione o Tamanho *</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes?.map((size: string) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground font-bold shadow"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Por favor, selecione um tamanho para continuar</p>
              )}
            </div>

            {/* Size Chart */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
              <div className="text-xs text-muted-foreground">
                Tabela de medidas: <span className="font-medium text-foreground">{sizeChartTabName(getSizeChartTab(product.name))}</span>
              </div>
              <SizeChartModal defaultTab={getSizeChartTab(product.name)} />
            </div>

            {/* Countdown timer above buy button */}
            <CountdownTimer productId={product.id} positionFilter="acima_botao" />

            {/* Add to cart button */}
            <button
              onClick={handleAdd}
              disabled={!selectedSize}
              style={pulse?.ativo && !added ? {
                '--pulse-color': pulseColor,
                '--pulse-speed': pulseSpeed,
                '--pulse-scale': pulseScale
              } as React.CSSProperties : {}}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                added
                  ? "bg-green-600 text-primary-foreground"
                  : `bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed ${pulseClass}`
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Adicionado ao Carrinho!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho • {displayPrice}
                </>
              )}
            </button>

            {/* WhatsApp direct purchase button */}
            {config.whatsapp?.ativo && (
              <button
                type="button"
                onClick={handleWhatsAppBuy}
                className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white transition-all shadow-md"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.33 4.982L2 22l5.233-1.371a9.936 9.936 0 004.779 1.218h.004c5.502 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.065C17.162 2.91 14.67 2.002 12.012 2zm5.72 13.918c-.292.825-1.433 1.516-1.983 1.613-.5.09-1.15.16-3.33-.74-2.79-1.15-4.57-4-4.71-4.19-.14-.19-1.13-1.51-1.13-2.87 0-1.36.71-2.03.96-2.31.25-.28.54-.35.71-.35.18 0 .36 0 .52.01.17.01.4.01.62.53.22.52.77 1.88.84 2.02.07.14.12.31.02.5-.09.19-.19.31-.38.52-.18.21-.38.46-.54.62-.17.18-.36.37-.16.71.2.33.88 1.45 1.88 2.34 1.29 1.15 2.38 1.5 2.72 1.67.33.17.53.13.73-.09.2-.23.86-1 .99-1.34.13-.34.27-.29.46-.22.2.07 1.24.59 1.46.7.22.1.37.16.42.25.06.09.06.52-.16 1.34z"/>
                </svg>
                {config.whatsapp.textoBotao || 'Comprar pelo WhatsApp'}
              </button>
            )}

            {/* Countdown timer below buy button */}
            <CountdownTimer productId={product.id} positionFilter="abaixo_botao" />

            {/* Description */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Descrição Completa</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {["Frete grátis acima de R$300", "Troca em até 30 dias", "Material premium AeroReady", "Envio rápido e seguro"].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Countdown Timer at bottom */}
      <CountdownTimer productId={product.id} positionFilter="rodape" />
      
      {/* Sticky purchase bar */}
      <StickyPurchaseBar 
        product={product} 
        selectedVersion={selectedVersion}
        isCustomized={isCustomized}
        customName={customName}
        customNumber={customNumber}
        customPhrase={customPhrase}
      />

      <Footer />

      <style>{`
        @keyframes btnPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 var(--pulse-color, #2563eb)80; }
          70% { transform: scale(var(--pulse-scale, 1.05)); box-shadow: 0 0 0 10px var(--pulse-color, #2563eb)00; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 var(--pulse-color, #2563eb)00; }
        }
        .animate-btn-pulse {
          animation: btnPulse var(--pulse-speed, 1.8s) infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Product;
