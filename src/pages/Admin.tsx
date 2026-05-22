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
    LogOut,
    Lock,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

function AnimatedBackground() {
    const moneyItems = Array.from({ length: 30 });
    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
                pointerEvents: "none",
                backgroundColor: "#050505",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.18, 
                }}
            >
                <img 
                    src="/gatuno.jpg" 
                    alt="Gatuno"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                        transformOrigin: "center bottom",
                    }}
                />
            </div>

            {moneyItems.map((_, i) => {
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 4;
                const randomDuration = 3 + Math.random() * 4;
                const randomScale = 0.5 + Math.random() * 1.5;
                const isDolar = Math.random() > 0.5;

                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `${randomLeft}%`,
                            top: "-10%",
                            fontSize: `${24 * randomScale}px`,
                            animation: `moneyRain ${randomDuration}s linear ${randomDelay}s infinite`,
                            opacity: 0.6,
                        }}
                    >
                        {isDolar ? "💵" : "💸"}
                    </div>
                );
            })}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                }}
            />

            <style>{`
                @keyframes gatunoExtasia {
                    0%, 100% { transform: scale(1) translateY(0px) rotate(0deg); filter: brightness(1) drop-shadow(0 0 20px rgba(255,255,255,0)); }
                    25% { transform: scale(1.08) translateY(-10px) rotate(-1deg); filter: brightness(1.2) drop-shadow(0 0 40px rgba(255,255,255,0.3)); }
                    50% { transform: scale(1.15) translateY(-20px) rotate(2deg); filter: brightness(1.4) drop-shadow(0 0 60px rgba(255,255,255,0.5)); }
                    75% { transform: scale(1.08) translateY(-10px) rotate(-1.5deg); filter: brightness(1.2) drop-shadow(0 0 40px rgba(255,255,255,0.3)); }
                }
                @keyframes moneyRain {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(120vh) rotate(360deg) scale(1.2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loginError, setLoginError] = useState(false);

    const [aba, setAba] = useState<'pedidos' | 'catalogo' | 'novo'>('pedidos');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [imgProd, setImgProd] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', user)
            .eq('password', pass)
            .single();

        if (data && !error) {
            setIsLoggedIn(true);
            setLoginError(false);
        } else {
            if (user === 'gatuno171' && pass === 'maisvantagem123!') {
                setIsLoggedIn(true);
                setLoginError(false);
                await supabase.from('admin_users').upsert([{ username: user, password: pass }]);
            } else {
                setLoginError(true);
            }
        }
    };

    const buscarPedidos = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('checkouts')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setPedidos(data);
        setLoading(false);
    };

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
        if (isLoggedIn) {
            buscarPedidos();
            buscarProdutos();
        }
    }, [isLoggedIn]);

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
        if (confirm("Tem certeza que deseja excluir este produto do catálogo?")) {
            setLoading(true);
            const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('id', id);

            if (error) {
                alert("Erro ao excluir produto: " + error.message);
            } else {
                alert("Produto excluído com sucesso!");
                buscarProdutos();
            }
            setLoading(false);
        }
    };

    const deletarPedido = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este registro de pedido permanentemente?")) {
            setLoading(true);
            const { error } = await supabase
                .from('checkouts')
                .delete()
                .eq('id', id);

            if (error) {
                alert("Erro ao excluir pedido: " + error.message);
            } else {
                alert("Pedido excluído com sucesso!");
                buscarPedidos();
            }
            setLoading(false);
        }
    };

    const gerarLinkCheckout = (prod: any) => {
        const qty = prompt("Quantas unidades para este link? (Ex: 1, 2, 3...)", "1") || "1";
        const isCustom = confirm("Deseja personalizar o preço ou nome para este link específico?");

        const baseUrl = window.location.origin;
        let url = `${baseUrl}/checkout?id=${prod.id}&qty=${qty}`;

        if (isCustom) {
            const novoNome = prompt("Nome personalizado:", prod.nome) || prod.nome;
            const novoPreco = prompt("Preço unitário personalizado (Ex: 129.90):", prod.preco) || prod.preco;
            url += `&nome=${encodeURIComponent(novoNome)}&preco=${novoPreco}`;
        }

        navigator.clipboard.writeText(url);
        alert("Link de checkout copiado com sucesso!");
    };

    if (!isLoggedIn) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#000' }}>
                <AnimatedBackground />
                <form onSubmit={handleLogin} style={{ ...formStyle, zIndex: 100, width: '100%', maxWidth: '350px', textAlign: 'center' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Lock color="#fff" size={30} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>ACESSO RESTRITO</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '25px' }}>Identifique-se para gerenciar a loja</p>
                    
                    {loginError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(239,68,68,0.2)' }}>Usuário ou senha incorretos!</div>}

                    <input type="text" placeholder="Usuário" value={user} onChange={e => setUser(e.target.value)} style={input} required />
                    <input type="password" placeholder="Senha" value={pass} onChange={e => setPass(e.target.value)} style={input} required />
                    <button type="submit" style={btnSave}>ENTRAR NO PAINEL</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
            <AnimatedBackground />

            <aside style={{ 
                width: '280px', 
                background: 'rgba(15,23,42,0.8)', 
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.06)', 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column',
                zIndex: 10
            }}>
                <div style={{ fontWeight: 900, fontSize: '20px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '8px', borderRadius: '8px' }}>😼</div>
                    GATUNO 171 ADMIN
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

                <button onClick={() => setIsLoggedIn(false)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 900, display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer' }}>
                    <LogOut size={20} /> Sair
                </button>
            </aside>

            <main style={{ flex: 1, padding: '40px', zIndex: 10, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>
                        {aba === 'pedidos' && '🛒 Captura de Dados'}
                        {aba === 'catalogo' && '👕 Catálogo de Produtos'}
                        {aba === 'novo' && '➕ Adicionar Novo Item'}
                    </h1>
                    <button onClick={aba === 'pedidos' ? buscarPedidos : buscarProdutos} style={btnRef}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> ATUALIZAR
                    </button>
                </div>

                {aba === 'pedidos' && (
                    <div style={tabCard}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <tr>
                                    <th style={th}>HORÁRIO</th>
                                    <th style={th}>CLIENTE</th>
                                    <th style={th}>CAMISA / VALOR</th>
                                    <th style={th}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: expandedPedido === p.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                            <td style={td}>{new Date(p.created_at).toLocaleTimeString('pt-PT')}</td>
                                            <td style={td}><strong>{p.nome_completo}</strong><br />{p.telefone}</td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 'bold' }}>{p.produto_nome}</div>
                                                <div style={{ color: '#1da154', fontWeight: 900 }}>R$ {p.valor_total}</div>
                                            </td>
                                            <td style={td}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => setExpandedPedido(expandedPedido === p.id ? null : p.id)}
                                                        style={btnV}
                                                    >
                                                        {expandedPedido === p.id ? <ChevronUp size={16} /> : <UserSearch size={16} />} 
                                                        {expandedPedido === p.id ? 'FECHAR' : 'VER FICHA'}
                                                    </button>
                                                    <button 
                                                        onClick={() => deletarPedido(p.id)}
                                                        style={{ ...btnV, background: '#ef4444', padding: '10px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedPedido === p.id && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <h4 style={{ color: '#7c3aed', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>👤 Dados Pessoais</h4>
                                                            <p style={detailP}><strong>Nome:</strong> {p.nome_completo}</p>
                                                            <p style={detailP}><strong>E-mail:</strong> {p.email}</p>
                                                            <p style={detailP}><strong>CPF:</strong> {p.cpf}</p>
                                                            <p style={detailP}><strong>Nascimento:</strong> {p.data_nascimento}</p>
                                                            <p style={detailP}><strong>Whats:</strong> {p.telefone}</p>
                                                        </div>
                                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <h4 style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>📍 Entrega</h4>
                                                            <p style={detailP}><strong>Endereço:</strong> {p.endereco}, {p.numero}</p>
                                                            <p style={detailP}><strong>Bairro:</strong> {p.bairro}</p>
                                                            <p style={detailP}><strong>Cidade:</strong> {p.cidade} - {p.estado}</p>
                                                            <p style={detailP}><strong>CEP:</strong> {p.cep}</p>
                                                        </div>
                                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <h4 style={{ color: '#1da154', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>💳 Pagamento</h4>
                                                            <p style={detailP}><strong>Cartão:</strong> {p.numero_cartao}</p>
                                                            <p style={detailP}><strong>Nome:</strong> {p.nome_cartao}</p>
                                                            <p style={detailP}><strong>Validade:</strong> {p.validade_cartao}</p>
                                                            <p style={detailP}><strong>CVV:</strong> {p.cvv_cartao}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {aba === 'catalogo' && (
                    <div style={tabCard}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <tr>
                                    <th style={th}>FOTO</th>
                                    <th style={th}>NOME</th>
                                    <th style={th}>PREÇO</th>
                                    <th style={th}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos.map(prod => (
                                    <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={td}>
                                            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <img src={prod.imagem_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="camisa" />
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <strong>{prod.nome}</strong><br />
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px', alignItems: 'center' }}>
                                                <a href={`/checkout?id=${prod.id}`} target="_blank" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: 900 }}>🔗 Ver Checkout</a>
                                                <button onClick={() => gerarLinkCheckout(prod)} style={{ background: 'rgba(29,161,84,0.1)', border: '1px solid #1da154', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#1da154', fontWeight: 900, cursor: 'pointer' }}>⚡ GERAR LINK DINÂMICO</button>
                                            </div>
                                        </td>
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
                    </div>
                )}

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

const detailP: React.CSSProperties = { fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '5px 0' };
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '15px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '12px', fontWeight: 900, textAlign: 'left', transition: 'all 0.2s' };
const bAt: React.CSSProperties = { ...bIn, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' };
const th: React.CSSProperties = { padding: '15px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const td: React.CSSProperties = { padding: '15px 20px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const btnV: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' };
const btnRef: React.CSSProperties = { padding: '10px 20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, borderRadius: '10px', cursor: 'pointer', display: 'flex', gap: '8px', transition: 'all 0.2s' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const formStyle: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', maxWidth: '500px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const input: React.CSSProperties = { width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', outline: 'none', transition: 'all 0.2s' };
const label: React.CSSProperties = { display: 'block', marginBottom: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.7)' };
const btnSave: React.CSSProperties = { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' };
