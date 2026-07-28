import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { StoreConfigProvider } from "@/contexts/StoreConfigContext";
import { GeolocalizedBanner } from "@/components/GeolocalizedBanner";
import { TopMarqueeBanner } from "@/components/TopMarqueeBanner";
import { FloatingStories } from "@/components/FloatingStories";
import SideCart from "@/components/SideCart";
import MetaPixelTracker from "@/components/MetaPixelTracker";
import WhatsAppButton from "@/components/WhatsAppButton";
import Index from "./pages/Index";
import Category from "./pages/Category";
import Product from "./pages/Product";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreConfigProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* Global banners */}
            <GeolocalizedBanner />
            <TopMarqueeBanner />
            
            {/* Rastreamento automático de PageView em toda troca de rota */}
            <MetaPixelTracker />
            {/* Botão flutuante WhatsApp X1 com rastreamento Meta Pixel */}
            <WhatsAppButton />
            {/* Floating stories bubble */}
            <FloatingStories />
            
            <SideCart />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categoria/:slug" element={<Category />} />
              <Route path="/produto/:id" element={<Product />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </StoreConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
