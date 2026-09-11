import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import { useEffect } from "react";

const Index = lazy(() => import("./pages/Index"));
const Category = lazy(() => import("./pages/Category"));
const Product = lazy(() => import("./pages/Product"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteSkeleton() {
  return (
    <main className="min-h-[50vh] space-y-5 p-4 md:p-8" aria-busy="true" aria-label="Carregando">
      <div className="mx-auto h-8 max-w-sm animate-pulse rounded bg-muted" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="space-y-3 p-4"><div className="h-3 w-2/5 animate-pulse rounded bg-muted" /><div className="h-4 w-4/5 animate-pulse rounded bg-muted" /></div>
          </div>
        ))}
      </div>
    </main>
  );
}

function RoutePrefetcher() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const prefetch = () => {
      if (location.pathname === "/") {
        import("./pages/Category");
        import("./pages/Product");
      }
      if (location.pathname.startsWith("/categoria/")) import("./pages/Product");
    };
    const idleId = "requestIdleCallback" in window
      ? window.requestIdleCallback(prefetch, { timeout: 1500 })
      : window.setTimeout(prefetch, 700);
    return () => {
      if (typeof idleId === "number" && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId as number);
    };
  }, [location.pathname]);

  useEffect(() => {
    const onPointerOver = (event: PointerEvent) => {
      const link = (event.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
      if (!link || link.dataset.prefetched === "true") return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("/produto/")) {
        import("./pages/Product");
        link.dataset.prefetched = "true";
      } else if (href.startsWith("/categoria/")) {
        import("./pages/Category");
        link.dataset.prefetched = "true";
      }
    };
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    return () => document.removeEventListener("pointerover", onPointerOver);
  }, [navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreConfigProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RoutePrefetcher />
            <GeolocalizedBanner />
            <TopMarqueeBanner />
            <MetaPixelTracker />
            <WhatsAppButton />
            <FloatingStories />
            <SideCart />
            <Suspense fallback={<RouteSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categoria/:slug" element={<Category />} />
                <Route path="/produto/:id" element={<Product />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </StoreConfigProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
