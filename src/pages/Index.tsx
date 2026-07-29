import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import ProductSection from "@/components/ProductSection";
import Footer from "@/components/Footer";
import { selecoes, retro, europeus, brasileirao } from "@/data/products";
import heroBannerAsset from "@/assets/hero-banner.jpg";
import { supabase } from "@/lib/supabase";
import { useStoreConfig, STORE_CONFIG_ID } from "@/contexts/StoreConfigContext";

const Index = () => {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const { config } = useStoreConfig();
  const fe = config.frontend;

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const { data } = await supabase.from('produtos').select('*');
        if (data) {
          const realVitrineProducts = data.filter(p => {
            if (p.id === 'store_config' || p.id === STORE_CONFIG_ID) return false;
            if (p.tipo === 'dinamico' || p.is_dynamic === true) return false;
            if (p.nome && (p.nome.startsWith('Camisetas -') || p.nome.toLowerCase().includes('dinamico'))) return false;
            if (!p.imagem_url && !p.image) return false;
            return true;
          });
          setDbProducts(realVitrineProducts);
        }
      } catch (err) {
        console.error("Erro ao carregar produtos do banco:", err);
      }
    };
    fetchDbProducts();
  }, []);

  const produtosOcultos = config.produtosOcultos || [];

  const getMergedProducts = (staticList: any[], categorySlug: string) => {
    const parsedStatic = staticList
      .filter(p => !produtosOcultos.includes(p.id))
      .map(p => ({
        id: p.id,
        image: p.image,
        name: p.name,
        team: p.team,
        price: p.price,
        priceNum: p.priceNum,
        category: p.category,
        oldPrice: p.oldPrice,
        externalCheckoutUrl: p.externalCheckoutUrl
      }));

    const dynamicFiltered = dbProducts
      .filter(p => {
        if (produtosOcultos.includes(p.id)) return false;
        const cat = p.category;
        if (Array.isArray(cat)) {
          return cat.map(c => c.toLowerCase()).includes(categorySlug);
        }
        return typeof cat === 'string' && cat.toLowerCase() === categorySlug;
      })
      .map(p => ({
        id: p.id,
        image: p.imagem_url || p.image,
        name: p.nome,
        team: p.team || 'Time',
        price: `R$ ${p.preco.toFixed(2).replace('.', ',')}`,
        priceNum: p.preco,
        category: [categorySlug],
        description: p.description
      }));

    return [...dynamicFiltered, ...parsedStatic];
  };

  const mergedSelecoes = getMergedProducts(selecoes, 'seleções');
  const mergedBrasileirao = getMergedProducts(brasileirao, 'brasileirão');
  const mergedRetro = getMergedProducts(retro, 'retrô');
  const mergedEuropeus = getMergedProducts(europeus, 'europeus');

  const heroImageSrc = fe?.heroImage || heroBannerAsset;
  const heroTitleText = fe?.heroTitle || "Vista a camisa do seu time";
  const heroSubtitleText = fe?.heroSubtitle || "Coleção exclusiva de camisetas originais, retrô e lançamentos. Frete grátis acima de R$ 300.";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryBar />

      {/* Hero banner */}
      <section className="relative overflow-hidden">
        <img
          src={heroImageSrc}
          alt={heroTitleText}
          className="w-full h-[450px] md:h-[600px] object-cover object-top"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14 text-center px-4">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-white drop-shadow-lg">
            {heroTitleText}
          </h2>
          <p className="text-white/85 text-lg max-w-2xl mx-auto drop-shadow">
            {heroSubtitleText}
          </p>
        </div>
      </section>

      {mergedSelecoes.length > 0 && (
        <ProductSection
          title="Seleções"
          products={mergedSelecoes}
          id="seleções"
        />
      )}
      {mergedBrasileirao.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Brasileirão"
            products={mergedBrasileirao}
            id="brasileirão"
          />
        </>
      )}
      {mergedRetro.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Históricas, edição: Série A Italiana"
            products={mergedRetro}
            id="retrô"
          />
        </>
      )}
      {mergedEuropeus.length > 0 && (
        <>
          <div className="border-t border-border" />
          <ProductSection
            title="Europeus"
            products={mergedEuropeus}
            id="europeus"
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default Index;
