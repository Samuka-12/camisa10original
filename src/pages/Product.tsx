import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Check, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductById } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { trackViewContent, trackAddToCart, getFbc, getFbp } from "@/lib/metaPixel";
import { useStoreConfig } from "@/contexts/StoreConfigContext";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StickyPurchaseBar } from "@/components/StickyPurchaseBar";
import { supabase } from "@/lib/supabase";

type JerseyType = 'Torcedor' | 'Jogador' | 'Personalizada';

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { config, getAdjustedPrice } = useStoreConfig();

  const [dbProduct, setDbProduct] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  const [selectedType, setSelectedType] = useState<JerseyType>('Torcedor');
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPhrase, setCustomPhrase] = useState("");

  // Load product from database if not found locally
  useEffect(() => {
    const loadProduct = async () => {
      setDbLoading(true);
      const local = getProductById(id || "");
      if (local) {
        setDbProduct(local);
        setDbLoading(false);
      } else {
        try {
          const { data } = await supabase
            .from('produtos')
            .select('*')
            .eq('id', id)
            .single();
          if (data) {
            setDbProduct({
              id: data.id,
              name: data.nome,
              team: data.team || 'Time',
              price: `R$ ${data.preco.toFixed(2).replace('.', ',')}`,
              priceNum: data.preco,
              image: data.imagem_url || data.image,
              images: [data.imagem_url || data.image],
              sizes: ['P', 'M', 'G', 'GG', 'XGG'], // Default sizes
              category: [data.category || 'europeus'],
              description: data.description || 'Sem descrição cadastrada.'
            });
          }
        } catch (err) {
          console.error("Erro ao carregar produto:", err);
        } finally {
          setDbLoading(false);
        }
      }
    };
    loadProduct();
  }, [id]);

  const product = dbProduct;

  // Scroll to top and tracking
  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (!product?.id) return;
    
    const timer = setTimeout(() => {
      trackViewContent({
        productId: product.id,
        productName: product.name,
        price: product.priceNum,
        userData: { fbc: getFbc(), fbp: getFbp() },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [product?.id]);

  const adjustedPrice = useMemo(() => {
    if (!product) return 0;
    let base = getAdjustedPrice(product.priceNum, product.category);
    if (selectedType === 'Personalizada') {
      base += 15;
    }
    return base;
  }, [product, selectedType, getAdjustedPrice]);

  const displayPrice = useMemo(() => {
    return `R$ ${adjustedPrice.toFixed(2).replace('.', ',')}`;
  }, [adjustedPrice]);

  const handleAdd = () => {
    if (!selectedSize || !product) return;
    addItem(product, selectedSize, {
      type: selectedType,
      customName: selectedType === 'Personalizada' ? customName : undefined,
      customNumber: selectedType === 'Personalizada' ? customNumber : undefined,
      customPhrase: selectedType === 'Personalizada' ? customPhrase : undefined
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
    const finalPhone = waConfig.numero || '5547983174463';
    
    let template = waConfig.mensagensPersonalizadas?.[product.id] || 
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

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      
      {/* Countdown Timer at the Top */}
      <CountdownTimer productId={product.id} positionFilter="topo" />

      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border group cursor-zoom-in">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "/placeholder.svg") {
                    target.src = "/placeholder.svg";
                  }
                }}
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImage ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img 
                      src={img || "/placeholder.svg"} 
                      alt="" 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== "/placeholder.svg") {
                          target.src = "/placeholder.svg";
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
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

            {/* Type selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Versão da Camisa</p>
              <div className="flex gap-2 flex-wrap">
                {(['Torcedor', 'Jogador', 'Personalizada'] as JerseyType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex flex-col items-start ${
                      selectedType === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                    }`}
                  >
                    <span>{type}</span>
                    {type === 'Personalizada' && <span className="text-xs opacity-80">+ R$ 15,00</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Customization Inputs */}
            {selectedType === 'Personalizada' && (
              <div className="space-y-3 bg-secondary/50 p-4 rounded-xl border border-border">
                <p className="text-sm font-semibold text-foreground">Detalhes da Personalização</p>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    {config.personalizacaoCamiseta?.labelNome || 'Nome nas costas'}
                  </label>
                  <input
                    type="text"
                    placeholder={config.personalizacaoCamiseta?.placeholderNome || 'Ex: NEYMAR JR'}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    {config.personalizacaoCamiseta?.labelNumero || 'Número (Ex: 10)'}
                  </label>
                  <input
                    type="text"
                    placeholder={config.personalizacaoCamiseta?.placeholderNumero || '10'}
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    {config.personalizacaoCamiseta?.labelFrase || 'Frase personalizada (opcional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={config.personalizacaoCamiseta?.placeholderFrase || 'Ex: O melhor de todos'}
                    value={customPhrase}
                    onChange={(e) => setCustomPhrase(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Size selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes?.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-xs text-muted-foreground mt-2">Selecione um tamanho</p>
              )}
            </div>

            {/* Countdown timer above buy button */}
            <CountdownTimer productId={product.id} positionFilter="acima_botao" />

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              disabled={!selectedSize}
              style={pulse?.ativo && !added ? {
                '--pulse-color': pulseColor,
                '--pulse-speed': pulseSpeed,
                '--pulse-scale': pulseScale
              } as React.CSSProperties : {}}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                added
                  ? "bg-green-600 text-primary-foreground"
                  : `bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed ${pulseClass}`
              }`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Adicionado!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
                </>
              )}
            </button>

            {/* WhatsApp direct purchase button */}
            {config.whatsapp?.ativo && (
              <button
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
              <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {["Frete grátis acima de R$300", "Troca em até 30 dias", "Material premium", "Envio em 24h"].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-accent flex-shrink-0" />
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
        selectedType={selectedType}
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
