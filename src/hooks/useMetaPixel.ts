/**
 * PageView para aplicação SPA.
 *
 * O snippet no <head> registra o primeiro PageView no browser antes do React.
 * Este hook envia a CAPI com o mesmo event_id nessa primeira visita e, em cada
 * mudança posterior de rota, envia Pixel + CAPI com um novo event_id.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getFbc, getFbp, trackPageView } from '@/lib/metaPixel';

declare global {
  interface Window {
    __c10_meta_initial_pageview_id?: string;
  }
}

export function useMetaPixelPageView(): void {
  const location = useLocation();
  const initialRender = useRef(true);

  useEffect(() => {
    const userData = { fbc: getFbc(), fbp: getFbp() };

    if (initialRender.current) {
      initialRender.current = false;
      const initialEventId = window.__c10_meta_initial_pageview_id;

      // O browser já enviou o PageView no snippet; reenviamos somente pela CAPI
      // utilizando exatamente o mesmo event_id para deduplicação.
      if (initialEventId) {
        void fetch('/api/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: 'PageView',
            event_id: initialEventId,
            user_data: userData,
            event_source_url: window.location.href,
            action_source: 'website',
          }),
        }).catch((error) => console.warn('[MetaPixel] CAPI PageView inicial falhou:', error));
      }
      return;
    }

    void trackPageView(userData);
  }, [location.pathname, location.search]);
}
