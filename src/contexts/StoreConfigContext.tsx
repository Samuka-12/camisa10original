import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
  desconto: number; // percentage
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
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  footerBg: string;
  footerTextColor: string;
  footerCopyright: string;
  fontFamily: string;
}

export interface StoreConfig {
  whatsapp: {
    ativo: boolean;
    numero: string;
    textoBotao: string;
    statusLoja: string;
    mensagensPersonalizadas: Record<string, string>;
  };
  bannerGeolocalizado: {
    ativo: boolean;
    corFundo: string;
    corTexto: string;
    imagem: string;
    tamanhoFonte: string;
    textoTemplate: string;
    posicao: string;
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
  };
  frontend: FrontendConfig;
}

const DEFAULT_CONFIG: StoreConfig = {
  whatsapp: {
    ativo: true,
    numero: '5547983174463',
    textoBotao: 'Comprar pelo WhatsApp',
    statusLoja: 'Online',
    mensagensPersonalizadas: {}
  },
  bannerGeolocalizado: {
    ativo: true,
    corFundo: '#7c3aed',
    corTexto: '#ffffff',
    imagem: '',
    tamanhoFonte: '14px',
    textoTemplate: '⚡ Frete Grátis para {cidade} - {estado} em compras acima de R$ 300! ⚡',
    posicao: 'topo_vitrine',
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
    ativo: true
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
    cupons: []
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
    vendas: 0
  },
  frontend: {
    headerBg: '#0a0a0a',
    headerTextColor: '#ffffff',
    heroTitle: 'MANTO SAGRADO',
    heroSubtitle: 'Camisetas Oficiais dos Maiores Times do Mundo',
    heroCta: 'Ver Camisetas',
    heroBg: '#0a0a0a',
    primaryColor: '#dc2626',
    secondaryColor: '#0a0a0a',
    accentColor: '#fbbf24',
    footerBg: '#0a0a0a',
    footerTextColor: '#ffffff',
    footerCopyright: '© 2025 Camisa 10. Todos os direitos reservados.',
    fontFamily: 'sans-serif'
  }
};

interface StoreConfigContextType {
  config: StoreConfig;
  loading: boolean;
  saveConfig: (newConfig: StoreConfig) => Promise<boolean>;
  getAdjustedPrice: (productPrice: number, productCategory: string | string[], productId?: string) => number;
  getActiveCoupon: (code: string, productId?: string, category?: string) => Coupon | null;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export function StoreConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();

    // Supabase Realtime Subscription for store_config changes (syncs mobile & desktop instantly)
    const channel = supabase
      .channel('realtime_store_config')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos',
          filter: 'id=eq.store_config'
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
              console.error('Realtime config parse error:', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const cached = localStorage.getItem('store_config_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setConfig(prev => mergeDeep(DEFAULT_CONFIG, parsed));
      }
      const { data } = await supabase
        .from('produtos')
        .select('description')
        .eq('id', 'store_config')
        .single();

      if (data?.description) {
        const parsed = JSON.parse(data.description);
        const merged = mergeDeep(DEFAULT_CONFIG, parsed);
        setConfig(merged);
        localStorage.setItem('store_config_cache', JSON.stringify(merged));
      }
    } catch (e) {
      const cached = localStorage.getItem('store_config_cache');
      if (cached) {
        try { setConfig(prev => mergeDeep(DEFAULT_CONFIG, JSON.parse(cached))); } catch (_) {}
      }
    } finally {
      setLoading(false);
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

  const saveConfig = async (newConfig: StoreConfig): Promise<boolean> => {
    try {
      setConfig(newConfig);
      localStorage.setItem('store_config_cache', JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent('storeConfigUpdated', { detail: newConfig }));

      const { error } = await supabase
        .from('produtos')
        .upsert([
          {
            id: 'store_config',
            nome: 'store_config',
            preco: 0,
            description: JSON.stringify(newConfig)
          }
        ], { onConflict: 'id' });

      if (error) {
        console.error('Supabase saveConfig error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('saveConfig exception:', e);
      return false;
    }
  };

  const getAdjustedPrice = (productPrice: number, productCategory: string | string[], productId?: string): number => {
    let finalPrice = productPrice;
    const rules = config.precoGestao?.regras || [];
    const cats = Array.isArray(productCategory) ? productCategory : [productCategory];

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
