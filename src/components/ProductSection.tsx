import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id?: string;
  image: string;
  name: string;
  team: string;
  price: string;
  priceNum?: number;
  category?: string | string[];
  oldPrice?: string;
  externalCheckoutUrl?: string;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  id?: string;
  /** Quantidade máxima de produtos exibidos (usado apenas na página inicial). */
  limit?: number;
  /** Rota da página completa da categoria. Quando informada, exibe "Ver mais →". */
  viewAllHref?: string;
}

const ProductSection = ({ title, products, id, limit, viewAllHref }: ProductSectionProps) => {
  const visibleProducts = typeof limit === "number" ? products.slice(0, limit) : products;

  return (
    <section id={id} className="py-14">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-9 bg-accent rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
          </div>
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Ver mais
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-7">
          {visibleProducts.map((product, i) => (
            <ProductCard 
              key={product.id || i} 
              id={product.id}
              image={product.image}
              name={product.name}
              team={product.team}
              price={product.price}
              priceNum={product.priceNum}
              category={product.category}
              oldPrice={product.oldPrice}
              externalCheckoutUrl={product.externalCheckoutUrl}
              priority={i < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
