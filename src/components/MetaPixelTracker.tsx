/**
 * MetaPixelTracker
 *
 * Componente "invisível" que ativa o rastreamento automático de PageView
 * em toda mudança de rota. Deve ser colocado dentro do <BrowserRouter>.
 */

import { useMetaPixelPageView } from '@/hooks/useMetaPixel';

const MetaPixelTracker = () => {
  useMetaPixelPageView();
  return null;
};

export default MetaPixelTracker;
