import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isProductDiscountUsed, isCouponUsed } from '../lib/customerDiscounts';

export const STORE_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

export interface PriceRule {
  id: string;
  nome: string;
  descricao?: string;
  escopo: 'tudo' | 'categoria' | 'produto';
  categoria?: string;
  produtoId?: string;
  operacao: 'aumentar' | 'diminuir';
  percentual: number;
  ativa: boolean;
  criadaEm: string;
}

export interface Coupon {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  desconto: number;
  escopo: 'tudo' | 'categoria' | 'produto';
  categoria?: string;
  produtoId?: string;
  ativo: boolean;
  dataValidade?: string;
  criadoEm: string;
}

export interface FloatingStory {
  id: string;
  nome: string;
  videoUrl: string;
  tipoViculo: 'produto' | 'texto';
  produtoId?: string;
  textoPromo?: string;
  visibilidade: 'global' | 'inicial' | 'categoria' | 'produto';
  categoriaVisib?: string;
  produtoPaginaId?: string;
}

export interface CatalogImage {
  id: string;
  album: string;
  url: string;
  nome: string;
  tamanho: string;
  created_at: string;
}

export interface FrontendConfig {
  headerBg: string;
  headerTextColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  heroBg: string;
  heroImage?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBorderRadius?: string;
  footerBg: string;
  footerTextColor: string;
  footerCopyright: string;
  fontFamily: string;
}

export interface VendaRealizada {
  id: string;
  cliente: string;
  produto: string;
  valor: number;
  origem: 'checkout' | 'link_externo';
  data: string;
}

export interface GastoAnuncio {
  id: string;
  campanha: string;
  conjunto: string;
  plataforma: 'meta' | 'google' | 'tiktok';
  valor: number;
  data: string;
}

export interface EstrategiaEscala {
  id: string;
  titulo: string;
  descricao: string;
  metaRoas?: string;
  criadaEm: string;
}

export interface DescontoProdutoSpec {
  produtoId: string;
  descontoPercent: number;
  tempoLimitado?: boolean;
  freteGratis?: boolean;
  estadoFreteGratis?: string;
  cidadeFreteGratis?: string;
}

export interface StoreConfig {
  dashboardResetTime?: string;
  produtosOcultos?: string[]; // IDs of permanently removed products (static ones hidden from vitrine)
  whatsapp: {
    ativo: boolean;
    numero: string;
    textoBotao: string;
    statusLoja: string;
    mensagensPersonalizadas: Record<string, string>;
    mensagensPorProduto: Record<string, string>;
  };
  bannerGeolocalizado: {
    ativo: boolean;
    corFundo: string;
    corTexto: string;
    imagem: string;
    tamanhoFonte: string;
    textoTemplate: string;
    posicao: string;
    formatoBanner: 'barra_fina' | 'banner_largo' | 'card_popup' | 'pilula_fixa' | 'full_width';
    alturaPx?: string;
    visibilidade: 'global' | 'inicial' | 'categoria' | 'produto';
    categoriaVisib?: string;
    produtoVisibId?: string;
  };
  bannerTopo: {
    ativo: boolean;
    corFundo: string;
    corTexto: string;
    imagem: string;
    velocidade: number;
    textoMarquee: string;
  };
  verificadoLoja: {
    ativo: boolean;
    posicao: 'topo' | 'rodape' | 'produtos' | 'todos';
  };
  personalizacaoCamiseta: {
    labelNome: string;
    placeholderNome: string;
    labelNumero: string;
    placeholderNumero: string;
    labelFrase: string;
    placeholderFrase: string;
  };
  barraCompraFixa: {
    ativo: boolean;
    corBotao: string;
    transparenciaFundo: string;
    formato: string;
    posicao: 'top' | 'bottom';
    arredondamento: string;
    rolagem: 'subir' | 'descer' | 'ambos';
  };
  countdownTimer: {
    ativo: boolean;
    produtosIds: string[];
    tempoDuracao: string;
    dataHoraLimite: string;
    titulo: string;
    texto: string;
    posicao: 'acima_botao' | 'abaixo_botao' | 'rodape' | 'topo' | 'canto';
    corFundo: string;
    corTexto: string;
    tamanho: string;
    formato: string;
  };
  pulseComprar: {
    ativo: boolean;
    cor: string;
    velocidade: 'lento' | 'normal' | 'rapido';
    tamanho: string;
    formato: string;
  };
  precoGestao: {
    regras: PriceRule[];
    cupons: Coupon[];
    descontosEspecificos?: DescontoProdutoSpec[];
  };
  stories: {
    lista: FloatingStory[];
  };
  imagensBanco: {
    lista: CatalogImage[];
    albuns: string[];
  };
  calculadoraAds: {
    gastos: number;
    vendas: number;
    vendasPlanilha: VendaRealizada[];
    gastosDetalhados: GastoAnuncio[];
    estrategiasEscala: EstrategiaEscala[];
  };
  frontend: FrontendConfig;
}

const DEFAULT_CONFIG: StoreConfig = {
  whatsapp: {
    ativo: true,
    numero: '5547983174463',
    textoBotao: 'Comprar pelo WhatsApp',
    statusLoja: 'Online',
    mensagensPersonalizadas: {
      padrao: 'Olá! Vim pelo site e quero saber mais sobre as camisetas de time!'
    },
    mensagensPorProduto: {}
  },
  bannerGeolocalizado: {
    ativo: true,
    corFundo: '#7c3aed',
    corTexto: '#ffffff',
    imagem: '',
    tamanhoFonte: '14px',
    textoTemplate: '⚡ Frete Grátis para {cidade} - {estado} em compras acima de R$ 300! ⚡',
    posicao: 'topo_vitrine',
    formatoBanner: 'barra_fina',
    alturaPx: '48px',
    visibilidade: 'global'
  },
  bannerTopo: {
    ativo: true,
    corFundo: '#0f172a',
    corTexto: '#ffffff',
    imagem: '',
    velocidade: 30,
    textoMarquee: '🔥 PROMOÇÃO DA SEMANA - TODAS AS CAMISETAS COM PREÇO DE ATACADO - FRETE GRÁTIS ACIMA DE R$ 300 - APROVEITE! 🔥'
  },
  verificadoLoja: {
    ativo: true,
    posicao: 'todos'
  },
  personalizacaoCamiseta: {
    labelNome: 'Nome nas costas',
    placeholderNome: 'Ex: NEYMAR JR',
    labelNumero: 'Número (Ex: 10)',
    placeholderNumero: '10',
    labelFrase: 'Frase personalizada (opcional)',
    placeholderFrase: 'Ex: O melhor de todos'
  },
  barraCompraFixa: {
    ativo: true,
    corBotao: '#dc2626',
    transparenciaFundo: '0.9',
    formato: 'rounded-xl',
    posicao: 'bottom',
    arredondamento: '12px',
    rolagem: 'ambos'
  },
  countdownTimer: {
    ativo: false,
    produtosIds: [],
    tempoDuracao: '24',
    dataHoraLimite: '',
    titulo: 'OFERTA POR TEMPO LIMITADO',
    texto: 'Adicione ao carrinho antes que o tempo acabe!',
    posicao: 'abaixo_botao',
    corFundo: '#991b1b',
    corTexto: '#ffffff',
    tamanho: 'text-sm',
    formato: 'rounded-lg'
  },
  pulseComprar: {
    ativo: true,
    cor: '#2563eb',
    velocidade: 'normal',
    tamanho: '1.05',
    formato: 'rounded-lg'
  },
  precoGestao: {
    regras: [],
    cupons: [],
    descontosEspecificos: []
  },
  stories: {
    lista: []
  },
  imagensBanco: {
    lista: [],
    albuns: ['Geral', 'Brasileirão', 'Europeus', 'Seleções', 'Retrô']
  },
  calculadoraAds: {
    gastos: 0,
    vendas: 0,
    vendasPlanilha: [],
    gastosDetalhados: [],
    estrategiasEscala: []
  },
  frontend: {
    headerBg: '#0a0a0a',
    headerTextColor: '#ffffff',
    heroTitle: 'MANTO SAGRADO',
    heroSubtitle: 'Camisetas Oficiais dos Maiores Times do Mundo',
    heroCta: 'Ver Camisetas',
    heroBg: '#0a0a0a',
    heroImage: '',
    primaryColor: '#dc2626',
    secondaryColor: '#0a0a0a',
    accentColor: '#fbbf24',
    buttonBorderRadius: '12px',
    footerBg: '#0a0a0a',
    footerTextColor: '#ffffff',
    footerCopyright: '© 2025 Camisa 10. Todos os direitos reservados.',
    fontFamily: 'sans-serif'
  }
};

function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

interface StoreConfigContextType {
  config: StoreConfig;
  loading: boolean;
  saveConfig: (newConfig: StoreConfig) => Promise<boolean>;
  getAdjustedPrice: (productPrice: number, productCategory: string | string[], productId?: string) => number;
  getActiveCoupon: (code: string, productId?: string, category?: string) => Coupon | null;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export function StoreConfigProvider({ children }: { children: React.ReactNode }) {
  // Synchronous initial load from localStorage cache to prevent any flash/old frame
  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const cached = localStorage.getItem('store_config_cache');
      if (cached) {
        return mergeDeep(DEFAULT_CONFIG, JSON.parse(cached));
      }
    } catch (_) {}
    return DEFAULT_CONFIG;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();

    const channel = supabase
      .channel('realtime_store_config_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos',
          filter: `id=eq.${STORE_CONFIG_ID}`
        },
        (payload: any) => {
          if (payload.new && payload.new.description) {
            try {
              const parsed = JSON.parse(payload.new.description);
              const merged = mergeDeep(DEFAULT_CONFIG, parsed);
              setConfig(merged);
              localStorage.setItem('store_config_cache', JSON.stringify(merged));
              window.dispatchEvent(new CustomEvent('storeConfigUpdated', { detail: merged }));
            } catch (e) {
              console.error('Realtime parse error:', e);
            }
          }
        }
      )
      .subscribe();

    const handleConfigUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('storeConfigUpdated', handleConfigUpdate as EventListener);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storeConfigUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  const loadConfig = async () => {
    try {
      // Load from API (server-side, bypasses RLS)
      try {
        const res = await fetch('/api/get-config');
        if (res.ok) {
          const { config: serverConfig } = await res.json();
          if (serverConfig) {
            const merged = mergeDeep(DEFAULT_CONFIG, serverConfig);
            setConfig(merged);
            localStorage.setItem('store_config_cache', JSON.stringify(merged));
            return;
          }
        }
      } catch (_) {}

      // Fallback: try direct Supabase
      try {
        const { data } = await supabase
          .from('produtos')
          .select('description')
          .eq('id', STORE_CONFIG_ID)
          .single();

        if (data?.description) {
          const parsed = JSON.parse(data.description);
          const merged = mergeDeep(DEFAULT_CONFIG, parsed);
          setConfig(merged);
          localStorage.setItem('store_config_cache', JSON.stringify(merged));
        }
      } catch (_) {}
    } catch (e) {
      console.error('loadConfig error:', e);
    }
  };

  const saveConfig = async (newConfig: StoreConfig): Promise<boolean> => {
    // 1. Update state and localStorage immediately (optimistic update)
    setConfig(newConfig);
    localStorage.setItem('store_config_cache', JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent('storeConfigUpdated', { detail: newConfig }));

    // 2. Try saving via API endpoint (server-side, bypasses RLS — primary method)
    try {
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });

      if (res.ok) {
        console.log('Config saved via API (service role) ✅');
        return true;
      }
    } catch (apiErr) {
      console.warn('API save-config exception:', apiErr);
    }

    // 3. Fallback: try direct Supabase
    try {
      const { error: updateErr } = await supabase
        .from('produtos')
        .update({ description: JSON.stringify(newConfig) })
        .eq('id', STORE_CONFIG_ID);

      if (!updateErr) {
        console.log('Config saved via Supabase update ✅');
        return true;
      }

      const { error: upsertErr } = await supabase
        .from('produtos')
        .upsert([
          {
            id: STORE_CONFIG_ID,
            nome: 'store_config',
            preco: 0,
            description: JSON.stringify(newConfig)
          }
        ], { onConflict: 'id' });

      if (!upsertErr) {
        console.log('Config saved via Supabase upsert ✅');
        return true;
      }
    } catch (supaErr) {
      console.warn('Supabase save exception:', supaErr);
    }

    return true;
  };

  const [discountsVersion, setDiscountsVersion] = useState(0);

  useEffect(() => {
    const handleDiscountsUpdated = () => {
      setDiscountsVersion(prev => prev + 1);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('camisa10_discounts_updated', handleDiscountsUpdated);
      return () => window.removeEventListener('camisa10_discounts_updated', handleDiscountsUpdated);
    }
  }, []);

  const getAdjustedPrice = (productPrice: number, productCategory: string | string[], productId?: string): number => {
    // Se o cliente já utilizou o desconto deste produto em uma compra anterior, retorna preço normal sem desconto
    if (productId && isProductDiscountUsed(productId)) {
      return productPrice;
    }

    let finalPrice = productPrice;
    const rules = config.precoGestao?.regras || [];
    const cats = Array.isArray(productCategory) ? productCategory : [productCategory];

    if (productId && config.precoGestao?.descontosEspecificos) {
      const spec = config.precoGestao.descontosEspecificos.find(d => d.produtoId === productId);
      if (spec && spec.descontoPercent > 0) {
        finalPrice = finalPrice * (1 - spec.descontoPercent / 100);
      }
    }

    rules.forEach(rule => {
      if (!rule.ativa) return;
      let apply = false;
      if (rule.escopo === 'tudo') apply = true;
      else if (rule.escopo === 'categoria' && rule.categoria) apply = cats.some(c => c === rule.categoria);
      else if (rule.escopo === 'produto' && rule.produtoId) apply = rule.produtoId === productId;

      if (apply) {
        const factor = rule.percentual / 100;
        finalPrice = rule.operacao === 'aumentar' ? finalPrice * (1 + factor) : finalPrice * (1 - factor);
      }
    });
    return finalPrice;
  };

  const getActiveCoupon = (code: string, productId?: string, category?: string): Coupon | null => {
    if (!code || isCouponUsed(code)) {
      return null;
    }
    const cupons = config.precoGestao?.cupons || [];
    const coupon = cupons.find(c => {
      if (!c.ativo) return false;
      if (c.codigo.toUpperCase() !== code.toUpperCase()) return false;
      if (c.dataValidade && new Date(c.dataValidade) < new Date()) return false;
      if (c.escopo === 'tudo') return true;
      if (c.escopo === 'categoria' && c.categoria && category) return c.categoria === category;
      if (c.escopo === 'produto' && c.produtoId && productId) return c.produtoId === productId;
      return false;
    });
    return coupon || null;
  };

  return (
    <StoreConfigContext.Provider value={{ config, loading, saveConfig, getAdjustedPrice, getActiveCoupon }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const ctx = useContext(StoreConfigContext);
  if (!ctx) throw new Error('useStoreConfig must be used inside StoreConfigProvider');
  return ctx;
}
