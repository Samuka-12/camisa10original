import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import ProductSection from "@/components/ProductSection";
import Footer from "@/components/Footer";
import { selecoes, retro, europeus, brasileirao, getProductsByCategory } from "@/data/products";
import heroBannerAsset from "@/assets/hero-banner.jpg";
import { supabase } from "@/lib/supabase";
import { isVitrineRow, normalizeDbProduct, mergePreferDb } from "@/lib/productImages";
import { useStoreConfig } from "@/contexts/StoreConfigContext";

const STORE_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

// Static slug -> data mapping
const STATIC_DATA: Record<string, any[]> = {
  'seleções': selecoes,
  'brasileirão': brasileirao,
  'retrô': retro,
  'europeus': europeus,
};

// URL slug -> data slug mapping
const URL_TO_DATA_SLUG: Record<string, string> = {
  selecoes: 'seleções',
  brasileirao: 'brasileirão',
  retro: 'retrô',
  europeus: 'europeus',
};

function toUrlSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

const Index = () => {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const { config } = useStoreConfig();
  const fe = config.frontend;

  useEffect(() => {
    const fetchDbProducts = async () => {
      try {
        const { data } = await supabase.from('produtos').select('*');
        if (data) {
          // Apenas produtos de vitrine (exclui config da loja e links dinâmicos).
          // Obs: o preço NÃO é mais usado como filtro — produtos com preço
          // diferente do padrão também precisam aparecer na vitrine.
          const realVitrineProducts = data.filter(isVitrineRow);
          setDbProducts(realVitrineProducts);
        }
      } catch (err) {
        console.error("Erro ao carregar produtos do banco:", err);
      }
    };
    fetchDbProducts();
  }, []);

  const produtosOcultos = config.produtosOcultos || [];

  // Get db products for a specific category (supports both static and dynamic slugs)
  const getDbProductsForCategory = (categorySlug: string) => {
    return dbProducts
      .filter(p => {
        if (produtosOcultos.includes(p.id)) return false;
        const cat = p.category;
        const matchCat = (c: string) => {
          // Match by exact slug or by normalized slug
          if (c.toLowerCase() === categorySlug.toLowerCase()) return true;
          const norm = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
          const normSlug = toUrlSlug(categorySlug);
          return norm === normSlug;
        };
        if (Array.isArray(cat)) return cat.some(matchCat);
        return typeof cat === 'string' && matchCat(cat);
      })
      .map(p => normalizeDbProduct(p, categorySlug));
  };

  // Get static products for a category
  const getStaticProductsForCategory = (dataSlug: string) => {
    const staticList = STATIC_DATA[dataSlug] || getProductsByCategory(dataSlug);
    return staticList
      .filter((p: any) => !produtosOcultos.includes(p.id))
      .map((p: any) => ({
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
  };

  // Build sections from dynamic categories (or fallback)
  const dynamicCats = config.categorias;
  const sections = (dynamicCats && dynamicCats.length > 0)
    ? dynamicCats
        .slice()
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .map(cat => {
          const urlSlug = toUrlSlug(cat.slug || cat.label);
          const dataSlug = URL_TO_DATA_SLUG[urlSlug] || cat.slug || cat.label.toLowerCase();
          const dbProds = getDbProductsForCategory(cat.slug || cat.label);
          const staticProds = getStaticProductsForCategory(dataSlug);
          const merged = mergePreferDb(dbProds, staticProds);
          return { id: urlSlug, label: cat.label, products: merged };
        })
        .filter(s => s.products.length > 0)
    : [
        {
          id: 'seleções',
          label: 'Seleções',
          products: mergePreferDb(getDbProductsForCategory('seleções'), getStaticProductsForCategory('seleções'))
        },
        {
          id: 'brasileirão',
          label: 'Brasileirão',
          products: mergePreferDb(getDbProductsForCategory('brasileirão'), getStaticProductsForCategory('brasileirão'))
        },
        {
          id: 'retrô',
          label: 'Históricas, edição: Série A Italiana',
          products: mergePreferDb(getDbProductsForCategory('retrô'), getStaticProductsForCategory('retrô'))
        },
        {
          id: 'europeus',
          label: 'Europeus',
          products: mergePreferDb(getDbProductsForCategory('europeus'), getStaticProductsForCategory('europeus'))
        },
      ].filter(s => s.products.length > 0);

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

      {sections.map((section, idx) => (
        <div key={section.id}>
          {idx > 0 && <div className="border-t border-border" />}
          <ProductSection
            title={section.label}
            products={section.products}
            id={section.id}
          />
        </div>
      ))}

      <Footer />
    </div>
  );
};

export default Index;
