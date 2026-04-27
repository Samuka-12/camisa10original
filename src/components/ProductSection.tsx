import ProductCard from "./ProductCard";

interface Product {
  id?: string;
  image: string;
  name: string;
  team: string;
  price: string;
  oldPrice?: string;
  externalCheckoutUrl?: string;
}

interface ProductSectionProps {
  title: string;
  products: Product[];
  id?: string;
}

const ProductSection = ({ title, products, id }: ProductSectionProps) => {
  return (
    <section id={id} className="py-14">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-1.5 h-9 bg-accent rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
          {products.map((product, i) => (
            <ProductCard key={product.id || i} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
