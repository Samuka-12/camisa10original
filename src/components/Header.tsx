import SearchBar from "@/components/SearchBar";
import RegisterModal from "@/components/RegisterModal";

import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const Header = () => {
  const { openCart, totalItems } = useCart();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">
            CAMISA<span className="text-accent">10</span>
          </h1>
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
