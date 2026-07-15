/**
 * useMetaPixel — Hook React para rastreamento automático de rotas
 *
 * Dispara PageView no Meta Pixel + CAPI a cada mudança de rota.
 * Deve ser usado dentro do BrowserRouter (App.tsx).
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, getFbc, getFbp } from '@/lib/metaPixel';

export function useMetaPixelPageView(): void {
  const location = useLocation();

  useEffect(() => {
    // Pequeno delay para garantir que o fbq já foi carregado
    const timer = setTimeout(() => {
      trackPageView({
        fbc: getFbc(),
        fbp: getFbp(),
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
}
