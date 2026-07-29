import SearchBar from "@/components/SearchBar";
import RegisterModal from "@/components/RegisterModal";

import { useCart } from "@/contexts/CartContext";
import { useStoreConfig } from "@/contexts/StoreConfigContext";
import { Link } from "react-router-dom";
import { ShoppingBag, ShieldCheck } from "lucide-react";

const Header = () => {
  const { openCart, totalItems } = useCart();
  const { config } = useStoreConfig();
  const verificado = config.verificadoLoja?.ativo;
  const posicao = config.verificadoLoja?.posicao || 'todos';
  const showVerificado = verificado && (posicao === 'topo' || posicao === 'todos');

  const fe = config.frontend;

  return (
    <header
      className="border-b border-border sticky top-0 z-50 backdrop-blur-md transition-colors"
      style={{ backgroundColor: fe?.headerBg || undefined, color: fe?.headerTextColor || undefined }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            CAMISA<span className="text-accent">10</span>
          </h1>
          {showVerificado && (
            <ShieldCheck className="w-5 h-5 text-green-500 fill-green-500/20 animate-pulse" title="Loja Verificada e Segura" />
          )}
        </Link>

        {/* Search */}
        <SearchBar />

        {/* Nav links */}
        <nav className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          <RegisterModal />
          <button
            onClick={openCart}
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1.5 p-2"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden md:block">Carrinho</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
