import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductsByCategory, type Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft } from "lucide-react";

const categoryLabels: Record<string, string> = {
  selecoes: "Seleções",
  brasileirao: "Brasileirão",
  europeus: "Europeus",
  retro: "Retrô",
};

const categoryKeys: Record<string, string> = {
  selecoes: "seleções",
  brasileirao: "brasileirão",
  europeus: "europeus",
  retro: "retrô",
};

const Category = () => {
  const { slug } = useParams<{ slug: string }>();
  const categoryKey = categoryKeys[slug || ""] || slug || "";
  const label = categoryLabels[slug || ""] || slug || "";
  const products = getProductsByCategory(categoryKey);

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
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <CategoryProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const CategoryProductCard = ({ product }: { product: Product }) => {
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
