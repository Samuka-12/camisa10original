import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductsByCategory, type Product } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { isVitrineRow, normalizeDbProduct, mergePreferDb } from "@/lib/productImages";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useStoreConfig } from "@/contexts/StoreConfigContext";

const STORE_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

// Static fallback map: URL slug -> display label
const staticLabelMap: Record<string, string> = {
  selecoes: "Seleções",
  brasileirao: "Brasileirão",
  europeus: "Europeus",
  retro: "Retrô / Históricas",
};

// Static category slug -> data key mapping
const staticDataKeyMap: Record<string, string> = {
  selecoes: "seleções",
  brasileirao: "brasileirão",
  europeus: "europeus",
  retro: "retrô",
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const { config } = useStoreConfig();
  const verificado = config.verificadoLoja?.ativo;
  const posicao = config.verificadoLoja?.posicao || 'todos';
  const showVerificado = verificado && (posicao === 'produtos' || posicao === 'todos');

  // Determine label and data key from dynamic categories or static map
  const dynamicCat = (config.categorias || []).find(c => {
    const catSlug = (c.slug || c.label)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    return catSlug === slug;
  });

  const label = dynamicCat?.label || staticLabelMap[slug || ''] || slug || '';
  // For static products: use original slug with accents
  const categoryKey = staticDataKeyMap[slug || ''] || dynamicCat?.slug || slug || '';

  const staticProducts = getProductsByCategory(categoryKey);

  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        const { data } = await supabase.from('produtos').select('*');
        if (data) {
          const filtered = data.filter(p => {
            if (!isVitrineRow(p)) return false;
            // Match by original slug or URL slug
            const cat = p.category;
            const matchCat = (c: string) => {
              const norm = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
              return norm === slug || c.toLowerCase() === categoryKey.toLowerCase();
            };
            if (Array.isArray(cat)) return cat.some(matchCat);
            return typeof cat === 'string' && matchCat(cat);
          });
          setDbProducts(filtered);
        }
      } catch (err) {
        console.error("Erro ao carregar produtos da categoria:", err);
      }
    };
    fetchCategoryProducts();
  }, [slug, categoryKey]);

  // Banco é a fonte de verdade; estáticos entram apenas se o ID não existir no banco
  const allProducts = mergePreferDb(
    dbProducts.map(p => {
      const n = normalizeDbProduct(p);
      return {
        id: n.id,
        image: n.image,
        name: n.name,
        team: n.team,
        price: n.price,
        oldPrice: undefined as string | undefined,
      };
    }),
    staticProducts.map(p => ({
      id: p.id,
      image: p.image,
      name: p.name,
      team: p.team,
      price: p.price,
      oldPrice: p.oldPrice,
    })),
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar para Home
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-accent rounded-full" />
          <h1 className="text-3xl font-bold text-foreground">{label}</h1>
          {showVerificado && (
            <ShieldCheck className="w-6 h-6 text-green-500 fill-green-500/20 animate-pulse" title="Loja Verificada e Segura" />
          )}
        </div>
        {allProducts.length === 0 ? (
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {allProducts.map((p) => (
              <CategoryProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const CategoryProductCard = ({ product }: { product: any }) => {
  return (
    <Link
      to={`/produto/${product.id}`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-4">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="max-w-[78%] max-h-[78%] object-contain group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            if (t.src !== '/placeholder.svg') t.src = '/placeholder.svg';
          }}
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{product.team}</p>
        <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.oldPrice}</span>
          )}
          <span className="text-base font-bold text-primary">{product.price}</span>
        </div>
      </div>
    </Link>
  );
};

export default Category;
