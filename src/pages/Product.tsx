import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductById } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || "");
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

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

  const handleAdd = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
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
                {product.images.map((img, i) => (
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
              <h1 className="text-3xl font-bold text-foreground mt-1">{product.name}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              {product.oldPrice && (
                <span className="text-lg text-muted-foreground line-through">{product.oldPrice}</span>
              )}
              <span className="text-3xl font-bold text-primary">{product.price}</span>
            </div>

            {/* Size selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Tamanho</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
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

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              disabled={!selectedSize}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                added
                  ? "bg-green-600 text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Description */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
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
      <Footer />
    </div>
  );
};

export default Product;
