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
            {/* Gatuno ao fundo em extasia (4 segundos) - Alta nitidez */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.3, // Mais visível e nítido
                }}
            >
                <img 
                    src="/gatuno.jpg" 
                    alt="Gatuno"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain", // Preserva proporções e mantém o texto
                        animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                        transformOrigin: "center bottom",
                    }}
                />
            </div>

            {/* Chuva de Dinheiro */}
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

            {/* Grid sutil por cima */}
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

            {/* Keyframes - Sem filtros de desfoque/sombra para manter 100% nítido */}
            <style>{`
                @keyframes gatunoExtasia {
                    0%, 100% {
                        transform: scale(1) translateY(0px) rotate(0deg);
                    }
                    25% {
                        transform: scale(1.05) translateY(-10px) rotate(-1deg);
                    }
                    50% {
                        transform: scale(1.1) translateY(-20px) rotate(1.5deg);
                    }
                    75% {
                        transform: scale(1.05) translateY(-10px) rotate(-1deg);
                    }
                }

                @keyframes moneyRain {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(120vh) rotate(360deg) scale(1.2);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

export default function Admin() {
    const [authorized, setAuthorized] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [aba, setAba] = useState<'pedidos' | 'catalogo' | 'novo'>('pedidos');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [imgProd, setImgProd] = useState('');

    // Mapeamento: username -> email cadastrado no Supabase Auth
    const USER_EMAIL_MAP: Record<string, string> = {
        'gatuno171': 'gatuno171@camisa10admin.com',
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setAuthorized(true);
            setAuthLoading(false);
        });
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const email = USER_EMAIL_MAP[username.trim().toLowerCase()];
        if (!email) {
            setLoginError('Usuário não encontrado.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            setLoginError('Usuário ou senha incorretos!');
        } else {
            setAuthorized(true);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setAuthorized(false);
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
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('created_at', { ascending: false });
        console.log('produtos:', data);
        console.log('erro:', error);
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

    if (authLoading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative' }}>
                <AnimatedBackground />
                <span style={{ zIndex: 10, color: '#fff', fontSize: '18px', fontWeight: 900 }}>Verificando acesso...</span>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatedBackground />
                <form onSubmit={handleLogin} style={{
                    background: 'rgba(10,14,30,0.75)', 
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    padding: '40px', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    width: '380px',
                    boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', 
                            color: '#fff', 
                            padding: '12px', 
                            borderRadius: '12px', 
                            width: 'fit-content', 
                            margin: '0 auto 15px',
                            boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
                            fontSize: '28px',
                            lineHeight: 1
                        }}>
                            🐱
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: 0 }}>Gatuno 171 Admin</h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '5px' }}>Acesso restrito à diretoria 💸</p>
                    </div>

                    {loginError && (
                        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fc8181', fontSize: '13px', fontWeight: 700 }}>
                            {loginError}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="gatuno171" 
                            style={{
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.06)', 
                                color: '#fff', 
                                fontWeight: 'bold', 
                                outline: 'none',
                                boxSizing: 'border-box'
                            }} 
                            required 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••••••" 
                            style={{
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.06)', 
                                color: '#fff', 
                                fontWeight: 'bold', 
                                outline: 'none',
                                boxSizing: 'border-box'
                            }} 
                            required 
                        />
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%',
                        padding: '14px',
                        background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 900,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                        transition: 'all 0.2s',
                        fontSize: '15px'
                    }}>
                        {loading ? 'Entrando...' : 'Entrar no Painel 🐱'}
                    </button>
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
                <div style={{ fontWeight: 900, fontSize: '18px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '8px', borderRadius: '8px' }}>🐱</div>
                    Gatuno 171 Admin
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

                <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 900, display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer' }}>
                    <LogOut size={20} /> Sair
                </button>
            </aside>

            <main style={{ flex: 1, padding: '40px', zIndex: 10 }}>
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
                                            <div style={{ width: '60px', height: '60px', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                <img
                                                    src={prod.imagem_url}
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    alt="camisa"
                                                />
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <strong>{prod.nome}</strong><br />
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px', alignItems: 'center' }}>
                                                <a href={`/checkout?id=${prod.id}`} target="_blank" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: 900 }}>
                                                    🔗 Ver Checkout
                                                </a>
                                                <button
                                                    onClick={() => gerarLinkCheckout(prod)}
                                                    style={{ background: '#f0fdf4', border: '1px solid #1da154', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#1da154', fontWeight: 900, cursor: 'pointer' }}
                                                >
                                                    ⚡ GERAR LINK DINÂMICO
                                                </button>
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
                        {produtos.length === 0 && <div style={{ padding: '100px', textAlign: 'center', fontWeight: 900 }}>Nenhum produto cadastrado.</div>}
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