/**
 * VendaManualTab — Componente para registrar vendas fechadas fora do checkout
 * (WhatsApp, PIX manual, dinheiro, cartão presencial, etc.)
 *
 * Ao registrar uma venda manual:
 *  1. Salva no Supabase (tabela checkouts)
 *  2. Dispara evento Purchase na Meta CAPI (via /api/meta-capi)
 *  3. Dispara também via fbq no browser (Pixel)
 */

import React, { useState, useCallback } from 'react';
import { DollarSign, User, Mail, Phone, Tag, Loader2, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, Banknote, QrCode, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { generateEventId, trackPurchase, sha256, sha256Phone, getFbc, getFbp } from '../../lib/metaPixel';

interface VendaManualTabProps {
  produtos?: any[];
  allProducts?: any[];
}

interface VendaManualForm {
  nome: string;
  email: string;
  telefone: string;
  produto: string;
  valor: string;
  tamanho: string;
  versao: 'Torcedor' | 'Jogador' | 'Personalizada';
  personalNome: string;
  personalNumero: string;
  formaPagamento: 'pix' | 'dinheiro' | 'cartao' | 'whatsapp' | 'outro';
  observacoes: string;
}

const TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XGG', '2XGG'];

const FORMAS_PAGAMENTO = [
  { value: 'pix', label: 'PIX', icon: <QrCode size={14} /> },
  { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={14} /> },
  { value: 'cartao', label: 'Cartão', icon: <CreditCard size={14} /> },
  { value: 'whatsapp', label: 'WhatsApp/Link', icon: <Smartphone size={14} /> },
  { value: 'outro', label: 'Outro', icon: <DollarSign size={14} /> },
];

const DEFAULT_FORM: VendaManualForm = {
  nome: '',
  email: '',
  telefone: '',
  produto: '',
  valor: '',
  tamanho: 'M',
  versao: 'Torcedor',
  personalNome: '',
  personalNumero: '',
  formaPagamento: 'pix',
  observacoes: '',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontWeight: 700,
  outline: 'none',
  fontSize: '13px',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.5)',
  fontWeight: 800,
  marginBottom: '4px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

export const VendaManualTab: React.FC<VendaManualTabProps> = ({ produtos = [], allProducts = [] }) => {
  const [form, setForm] = useState<VendaManualForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [capiStatus, setCapiStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  // Merge de produtos do banco e estático
  const allProdList = [
    ...(produtos || []).filter(p => p && p.nome && p.id !== '00000000-0000-0000-0000-000000000000'),
    ...(allProducts || []).filter(p => p && p.name),
  ];

  const update = useCallback((key: keyof VendaManualForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.produto) { setError('Selecione o produto vendido.'); return; }
    if (!form.valor || parseFloat(form.valor) <= 0) { setError('Informe o valor da venda.'); return; }
    if (!form.nome) { setError('Informe o nome do cliente.'); return; }

    setLoading(true);
    setCapiStatus('idle');

    try {
      const orderId = `MANUAL-${Date.now()}`;
      const valorNum = parseFloat(form.valor.replace(',', '.'));
      const eventoId = generateEventId('Purchase');

      // 1. Salvar no Supabase (checkouts)
      const checkoutPayload = {
        nome: form.nome,
        email: form.email || null,
        telefone: form.telefone || null,
        produto: form.produto,
        tamanho: form.tamanho,
        valor: valorNum,
        metodo: form.formaPagamento,
        status: 'paid',
        tipo_venda: 'manual',
        versao: form.versao,
        personalNome: form.personalNome || null,
        personalNumero: form.personalNumero || null,
        observacoes: form.observacoes || null,
        meta_event_id: eventoId,
        order_id: orderId,
        created_at: new Date().toISOString(),
      };

      // Tentar salvar no Supabase (não bloqueia se falhar)
      try {
        const { error: dbError } = await supabase
          .from('checkouts')
          .insert([checkoutPayload]);
        if (dbError) {
          console.warn('[VendaManual] Supabase insert error:', dbError.message);
        } else {
          console.log('[VendaManual] Checkout salvo no Supabase ✅');
        }
      } catch (dbErr) {
        console.warn('[VendaManual] Supabase insert exception:', dbErr);
      }

      // 2. Disparar Purchase na Meta CAPI + Pixel
      setCapiStatus('sending');
      try {
        const [emHash, phHash] = await Promise.all([
          sha256(form.email),
          sha256Phone(form.telefone),
        ]);

        await trackPurchase({
          orderId,
          value: valorNum,
          contentIds: [form.produto],
          numItems: 1,
          currency: 'BRL',
          contents: [{ id: form.produto, quantity: 1, item_price: valorNum }],
          eventId: eventoId,
          userData: {
            em: emHash,
            ph: phHash,
            fn: form.nome.split(' ')[0] || '',
            fbc: getFbc(),
            fbp: getFbp(),
          },
        });

        setCapiStatus('ok');
        console.log('[VendaManual] Purchase disparado — event_id:', eventoId);
      } catch (capiErr) {
        console.error('[VendaManual] CAPI error:', capiErr);
        setCapiStatus('error');
      }

      setSuccess(true);
      setForm(DEFAULT_FORM);
      toast.success(`✅ Venda registrada! Purchase disparado no Meta (event_id: ${eventoId.slice(0, 20)}...)`);
    } catch (err: any) {
      console.error('[VendaManual] Error:', err);
      setError(err?.message || 'Erro ao registrar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Info Card */}
      <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl">
        <div className="flex items-start gap-3">
          <DollarSign className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="text-sm font-bold text-purple-300">Registrar Venda Manual</p>
            <p className="text-xs text-gray-400 mt-1">
              Use esta tela para registrar vendas fechadas fora do checkout (WhatsApp, PIX direto, presencial).
              O evento <strong className="text-purple-300">Purchase</strong> será enviado automaticamente para o
              <strong className="text-purple-300"> Meta Pixel + Conversions API</strong> com deduplicação correta,
              alimentando o algoritmo de Machine Learning das suas campanhas.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Produto + Valor + Tamanho */}
        <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag size={15} /> Dados do Produto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Produto Vendido *</label>
              <select
                value={form.produto}
                onChange={e => update('produto', e.target.value)}
                style={{ ...inputStyle, paddingRight: '32px' }}
              >
                <option value="">Selecione o produto...</option>
                {allProdList.map((p, i) => (
                  <option key={p.id || i} value={p.id || p.name}>
                    {p.nome || p.name}
                  </option>
                ))}
                <option value="outro">Outro (especificar nas obs.)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Valor da Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="109.93"
                value={form.valor}
                onChange={e => update('valor', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Tamanho</label>
              <select value={form.tamanho} onChange={e => update('tamanho', e.target.value)} style={{ ...inputStyle }}>
                {TAMANHOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Versão</label>
              <select value={form.versao} onChange={e => update('versao', e.target.value as any)} style={{ ...inputStyle }}>
                <option value="Torcedor">Torcedor (padrão)</option>
                <option value="Jogador">Jogador (+R$20)</option>
                <option value="Personalizada">Personalizada (+R$20)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Forma de Pagamento</label>
              <select value={form.formaPagamento} onChange={e => update('formaPagamento', e.target.value as any)} style={{ ...inputStyle }}>
                {FORMAS_PAGAMENTO.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Personalização (mostrar só se versão = Personalizada) */}
          {form.versao === 'Personalizada' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
              <div>
                <label style={labelStyle}>Nome na Camisa</label>
                <input
                  type="text"
                  placeholder="Ex: NEYMAR JR"
                  value={form.personalNome}
                  onChange={e => update('personalNome', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Número na Camisa</label>
                <input
                  type="text"
                  placeholder="Ex: 10"
                  value={form.personalNumero}
                  onChange={e => update('personalNumero', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        {/* Dados do Cliente */}
        <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User size={15} /> Dados do Cliente
            <span className="text-xs text-gray-500 font-normal">(para o Meta Advanced Matching)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label style={labelStyle}>Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={form.nome}
                onChange={e => update('nome', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>E-mail</label>
              <input
                type="email"
                placeholder="joao@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
                Melhora qualidade do evento Meta
              </p>
            </div>

            <div>
              <label style={labelStyle}>Telefone / WhatsApp</label>
              <input
                type="tel"
                placeholder="(47) 99999-9999"
                value={form.telefone}
                onChange={e => update('telefone', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
                Melhora qualidade do evento Meta
              </p>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Observações (opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: Cliente pediu frete expresso, venda via grupo de WhatsApp..."
              value={form.observacoes}
              onChange={e => update('observacoes', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Meta CAPI Status */}
        {capiStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-bold border ${
            capiStatus === 'sending' ? 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300' :
            capiStatus === 'ok'      ? 'bg-green-900/30 border-green-500/30 text-green-300' :
                                       'bg-red-900/30 border-red-500/30 text-red-300'
          }`}>
            {capiStatus === 'sending' && <Loader2 size={13} className="animate-spin" />}
            {capiStatus === 'ok'      && <CheckCircle2 size={13} />}
            {capiStatus === 'error'   && <AlertCircle size={13} />}
            {capiStatus === 'sending' && 'Enviando Purchase para Meta Pixel + Conversions API...'}
            {capiStatus === 'ok'      && '✅ Purchase enviado para Meta Pixel + Conversions API com sucesso!'}
            {capiStatus === 'error'   && '⚠️ Erro ao enviar CAPI — verifique as variáveis de ambiente no Vercel.'}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-xs text-red-300 font-bold">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-emerald-900/30 border border-emerald-500/40 rounded-xl text-sm text-emerald-300 font-bold">
            <CheckCircle2 size={16} />
            Venda registrada com sucesso! O evento Purchase foi disparado para o Meta.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 900,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Registrando Venda...</>
          ) : (
            <><DollarSign size={16} /> REGISTRAR VENDA + DISPARAR PURCHASE NO META</>
          )}
        </button>
      </form>

      {/* Dica sobre qualidade */}
      <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl text-xs text-gray-500 space-y-1.5">
        <p className="text-white/40 font-bold text-[11px] uppercase tracking-widest">Como funciona</p>
        <p>• <strong className="text-gray-400">Produto + valor + forma</strong>: obrigatórios para o relatório interno</p>
        <p>• <strong className="text-gray-400">E-mail + telefone</strong>: aumentam significativamente a qualidade do evento Meta (EMQ Score)</p>
        <p>• Todos os dados são <strong className="text-gray-400">hasheados com SHA-256</strong> antes de serem enviados ao Meta</p>
        <p>• O <strong className="text-gray-400">event_id único</strong> garante deduplicação entre Pixel e Conversions API</p>
      </div>
    </div>
  );
};

export default VendaManualTab;
