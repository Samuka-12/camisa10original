import { Link } from "react-router-dom";

interface ProductCardProps {
  id?: string;
  image: string;
  name: string;
  team: string;
  price: string;
  oldPrice?: string;
  externalCheckoutUrl?: string;
}

const ProductCard = ({ id, image, name, team, price, oldPrice }: ProductCardProps) => {
  return (
    <Link to={id ? `/produto/${id}` : "#"} className="block">
      <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-secondary flex items-center justify-center p-2">
          <img
            src={image || "/placeholder.svg"}
            alt={name}
            loading="lazy"
            width={512}
            height={512}
            className="max-w-[92%] max-h-[92%] object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== "/placeholder.svg") {
                target.src = "/placeholder.svg";
              }
            }}
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{team}</p>
          <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-2">{name}</h3>
          <div className="mt-2 flex items-center gap-2">
            {oldPrice && (
              <span className="text-xs text-muted-foreground line-through">{oldPrice}</span>
            )}
            <span className="text-base font-bold text-primary">R$ 90,93</span>
          </div>
          <div className="mt-3 w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold text-center hover:bg-accent/90 transition-colors">
            Comprar
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
