import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PriceRule {
  id: string;
  nome: string;
  escopo: 'tudo' | 'categoria';
  categoria?: string;
  operacao: 'aumentar' | 'diminuir';
  percentual: number;
  ativa: boolean;
}

export interface FloatingStory {
  id: string;
  nome: string;
  videoUrl: string;
  tipoViculo: 'produto' | 'texto';
  produtoId?: string;
  textoPromo?: string;
  visibilidade: 'global' | 'produto';
  produtoPaginaId?: string; // Se visibilidade for 'produto', em qual produto aparece
}

export interface CatalogImage {
  id: string;
  album: string;
  url: string;
  nome: string;
  tamanho: string;
  created_at: string;
}

export interface StoreConfig {
  whatsapp: {
    ativo: boolean;
    numero: string;
    textoBotao: string;
    statusLoja: string;
    mensagensPersonalizadas: Record<string, string>; // Record<productId, customMessage>
  };
  bannerGeolocalizado: {
    ativo: boolean;
    corFundo: string;
    corTexto: string;
    imagem: string;
    tamanhoFonte: string;
    textoTemplate: string;
  };
  bannerTopo: {
    ativo: boolean;
    corFundo: string;
    corTexto: string;
    imagem: string;
    velocidade: number; // velocidade em pixels por segundo
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
    formato: string; // 'rounded-lg' | 'rounded-full' | 'rounded-none'
    posicao: 'top' | 'bottom';
    arredondamento: string;
    rolagem: 'subir' | 'descer' | 'ambos';
  };
  countdownTimer: {
    ativo: boolean;
    produtosIds: string[];
    tempoDuracao: string; // em horas
    dataHoraLimite: string; // formato ISO ou YYYY-MM-DD HH:MM
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
    tamanho: string; // ex '1.05', '1.1'
    formato: string; // 'rounded-lg', etc.
  };
  precoGestao: {
    regras: PriceRule[];
  };
  stories: {
    lista: FloatingStory[];
  };
  imagensBanco: {
    lista: CatalogImage[];
  };
  calculadoraAds: {
    gastos: number;
    vendas: number;
  };
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
    textoTemplate: '⚡ Frete Grátis para {cidade} - {estado} em compras acima de R$ 300! ⚡'
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
    regras: []
  },
  stories: {
    lista: []
  },
  imagensBanco: {
    lista: []
  },
  calculadoraAds: {
    gastos: 0,
    vendas: 0
  }
};

interface StoreConfigContextType {
  config: StoreConfig;
  loading: boolean;
  saveConfig: (newConfig: StoreConfig) => Promise<boolean>;
  getAdjustedPrice: (productPrice: number, productCategory: string | string[]) => number;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('description')
        .eq('id', 'store_config')
        .maybeSingle();

      if (data && data.description) {
        try {
          const parsed = JSON.parse(data.description);
          // Merge with DEFAULT_CONFIG to handle new keys gracefully
          const merged = {
            ...DEFAULT_CONFIG,
            ...parsed,
            whatsapp: { ...DEFAULT_CONFIG.whatsapp, ...parsed.whatsapp },
            bannerGeolocalizado: { ...DEFAULT_CONFIG.bannerGeolocalizado, ...parsed.bannerGeolocalizado },
            bannerTopo: { ...DEFAULT_CONFIG.bannerTopo, ...parsed.bannerTopo },
            verificadoLoja: { ...DEFAULT_CONFIG.verificadoLoja, ...parsed.verificadoLoja },
            personalizacaoCamiseta: { ...DEFAULT_CONFIG.personalizacaoCamiseta, ...parsed.personalizacaoCamiseta },
            barraCompraFixa: { ...DEFAULT_CONFIG.barraCompraFixa, ...parsed.barraCompraFixa },
            countdownTimer: { ...DEFAULT_CONFIG.countdownTimer, ...parsed.countdownTimer },
            pulseComprar: { ...DEFAULT_CONFIG.pulseComprar, ...parsed.pulseComprar },
            precoGestao: { ...DEFAULT_CONFIG.precoGestao, ...parsed.precoGestao },
            stories: { ...DEFAULT_CONFIG.stories, ...parsed.stories },
            imagensBanco: { ...DEFAULT_CONFIG.imagensBanco, ...parsed.imagensBanco },
            calculadoraAds: { ...DEFAULT_CONFIG.calculadoraAds, ...parsed.calculadoraAds || {} }
          };
          setConfig(merged);
          localStorage.setItem('store_config', JSON.stringify(merged));
        } catch (e) {
          console.error("Erro parsing store_config", e);
        }
      } else {
        // Fallback to localstorage
        const local = localStorage.getItem('store_config');
        if (local) {
          try {
            setConfig(JSON.parse(local));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Erro fetching config from Supabase", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveConfig = async (newConfig: StoreConfig): Promise<boolean> => {
    try {
      setConfig(newConfig);
      localStorage.setItem('store_config', JSON.stringify(newConfig));

      // Attempt to save to Supabase
      const { error } = await supabase
        .from('produtos')
        .upsert({
          id: 'store_config',
          nome: 'Configurações da Loja',
          preco: 0,
          imagem_url: '',
          image: '',
          category: 'config',
          team: 'Config',
          description: JSON.stringify(newConfig)
        });

      if (error) {
        console.error("Erro saving to Supabase, but saved locally:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Erro in saveConfig:", err);
      return false;
    }
  };

  // Helper to adjust prices on the fly based on rules
  const getAdjustedPrice = (productPrice: number, productCategory: string | string[]): number => {
    let finalPrice = productPrice;
    const rules = config.precoGestao?.regras || [];
    
    // Convert category array or string to lower case array
    const cats = Array.isArray(productCategory) 
      ? productCategory.map(c => c.toLowerCase())
      : [productCategory.toLowerCase()];

    // Apply active rules
    rules.forEach(rule => {
      if (!rule.ativa) return;

      let apply = false;
      if (rule.escopo === 'tudo') {
        apply = true;
      } else if (rule.escopo === 'categoria' && rule.categoria) {
        apply = cats.includes(rule.categoria.toLowerCase());
      }

      if (apply) {
        const factor = rule.percentual / 100;
        if (rule.operacao === 'aumentar') {
          finalPrice = finalPrice * (1 + factor);
        } else if (rule.operacao === 'diminuir') {
          finalPrice = finalPrice * (1 - factor);
        }
      }
    });

    return parseFloat(finalPrice.toFixed(2));
  };

  return (
    <StoreConfigContext.Provider value={{ config, loading, saveConfig, getAdjustedPrice }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => {
  const context = useContext(StoreConfigContext);
  if (context === undefined) {
    throw new Error('useStoreConfig must be used within a StoreConfigProvider');
  }
  return context;
};
