/**
 * PageView para aplicação SPA.
 *
 * O snippet no <head> registra o primeiro PageView no browser. Este hook envia
 * a CAPI com o mesmo event_id nessa primeira visita e cria novos pares
 * Pixel/CAPI em cada mudança real de rota.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getFbc, getFbp, sendCapiEvent, trackPageView } from '@/lib/metaPixel';

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

      // O browser já enviou o PageView no snippet. Aqui enviamos somente CAPI
      // com o mesmo ID, para que a Meta deduplique os dois canais.
      if (initialEventId) {
        void sendCapiEvent({
          event_name: 'PageView',
          event_id: initialEventId,
          user_data: userData,
          event_source_url: window.location.href,
          action_source: 'website',
        });
      }
      return;
    }

    void trackPageView(userData);
  }, [location.pathname, location.search]);
}
