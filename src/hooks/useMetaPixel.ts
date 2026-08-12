/**
 * useMetaPixel — rastreamento de PageView em rotas internas.
 *
 * O primeiro PageView já é enviado pelo snippet padrão no <head>. Em uma SPA,
 * apenas as navegações posteriores precisam disparar outro PageView no browser.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { fbqTrack } from '@/lib/metaPixel';

export function useMetaPixelPageView(): void {
  const location = useLocation();
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    fbqTrack('PageView');
  }, [location.pathname, location.search]);
}
