const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xnadtzeyynoblrbncltt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

async function seedAuth() {
  // Sign in as admin user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gatuno171@camisa10admin.com',
    password: 'password' // let's check or test
  });

  console.log("AUTH ERROR:", authError);

  const defaultConfig = {
    whatsapp: {
      ativo: true,
      numero: '5547983174463',
      textoBotao: 'Comprar pelo WhatsApp',
      statusLoja: 'Online',
      mensagensPersonalizadas: { padrao: 'Olá! Vim pelo site Manto Sagrado...' },
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
    verificadoLoja: { ativo: true },
    personalizacaoCamiseta: {
      labelNome: 'Nome nas costas', placeholderNome: 'Ex: NEYMAR JR',
      labelNumero: 'Número (Ex: 10)', placeholderNumero: '10',
      labelFrase: 'Frase personalizada (opcional)', placeholderFrase: 'Ex: O melhor de todos'
    },
    barraCompraFixa: { ativo: true, corBotao: '#dc2626', transparenciaFundo: '0.9', formato: 'rounded-xl', posicao: 'bottom', arredondamento: '12px', rolagem: 'ambos' },
    countdownTimer: { ativo: false, produtosIds: [], tempoDuracao: '24', dataHoraLimite: '', titulo: 'OFERTA POR TEMPO LIMITADO', texto: 'Adicione ao carrinho antes que o tempo acabe!', posicao: 'abaixo_botao', corFundo: '#991b1b', corTexto: '#ffffff', tamanho: 'text-sm', formato: 'rounded-lg' },
    pulseComprar: { ativo: true, cor: '#2563eb', velocidade: 'normal', tamanho: '1.05', formato: 'rounded-lg' },
    precoGestao: { regras: [], cupons: [], descontosEspecificos: [] },
    stories: { lista: [] },
    imagensBanco: { lista: [], albuns: ['Geral', 'Brasileirão', 'Europeus', 'Seleções', 'Retrô'] },
    calculadoraAds: { gastos: 0, vendas: 0, vendasPlanilha: [], gastosDetalhados: [], estrategiasEscala: [] },
    frontend: {
      headerBg: '#0a0a0a', headerTextColor: '#ffffff', heroTitle: 'MANTO SAGRADO', heroSubtitle: 'Camisetas Oficiais dos Maiores Times do Mundo', heroCta: 'Ver Camisetas', heroBg: '#0a0a0a', heroImage: '', primaryColor: '#dc2626', secondaryColor: '#0a0a0a', accentColor: '#fbbf24', buttonBorderRadius: '12px', footerBg: '#0a0a0a', footerTextColor: '#ffffff', footerCopyright: '© 2025 Camisa 10. Todos os direitos reservados.', fontFamily: 'sans-serif'
    }
  };

  const { data, error } = await supabase
    .from('produtos')
    .upsert([
      {
        id: CONFIG_UUID,
        nome: 'store_config',
        preco: 0,
        description: JSON.stringify(defaultConfig)
      }
    ], { onConflict: 'id' })
    .select();

  console.log("UPSERT DATA:", data);
  console.log("UPSERT ERROR:", error);
}

seedAuth();
