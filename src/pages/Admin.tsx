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

// Posições fixas para evitar re-render com valores aleatórios
const MONEY_ITEMS = Array.from({ length: 45 }, (_, i) => ({
    left: parseFloat(((i * 2.22 + (i % 7) * 1.47) % 100).toFixed(2)),
    delay: parseFloat(((i * 0.29) % 4).toFixed(2)),
    duration: parseFloat((2.2 + (i % 6) * 0.55).toFixed(2)),
    size: parseFloat((20 + (i % 5) * 8).toFixed(0)),
    isDolar: i % 2 === 0,
    swayAmp: 8 + (i % 4) * 5,
}));

function AnimatedBackground() {
    return (
        <div
            aria-hidden="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
                pointerEvents: "none",
                backgroundColor: "#06060a",
            }}
        >
            {/* ── Halo de brilho atrás do gato ── */}
            <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "560px",
                height: "560px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,215,0,0.22) 0%, rgba(255,255,255,0.07) 40%, transparent 68%)",
                animation: "haloGlow 4s ease-in-out infinite",
                willChange: "transform, opacity",
            }} />

            {/* ── Gatuno central ── */}
            <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
            }}>
                <img
                    src="/gatuno.jpg"
                    alt="Gatuno"
                    style={{
                        width: "min(68vh, 660px)",
                        height: "min(68vh, 660px)",
                        objectFit: "contain",
                        objectPosition: "center",
                        transformOrigin: "center 80%",
                        animation: "gatunoBody 4s cubic-bezier(0.37, 0, 0.63, 1) infinite",
                        willChange: "transform, filter",
                        imageRendering: "crisp-edges",
                        filter: "drop-shadow(0 0 32px rgba(255,220,60,0.6)) brightness(1.1) contrast(1.06) saturate(1.05)",
                    }}
                />
            </div>

            {/* ── Braço esquerdo overlay (sobe e desce) ── */}
            <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                pointerEvents: "none",
            }}>
                {/* Sombra de movimento do braço esquerdo */}
                <div style={{
                    position: "absolute",
                    width: "min(68vh, 660px)",
                    height: "min(68vh, 660px)",
                    transformOrigin: "58% 50%",
                    animation: "armLeftWave 4s cubic-bezier(0.37, 0, 0.63, 1) infinite",
                    willChange: "transform",
                }} />
            </div>

            {/* ── Chuva de dinheiro ── */}
            {MONEY_ITEMS.map((item, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: `${item.left}%`,
                        top: "-9%",
                        fontSize: `${item.size}px`,
                        lineHeight: 1,
                        animation: `moneyFall ${item.duration}s linear ${item.delay}s infinite`,
                        willChange: "transform, opacity",
                        filter: "drop-shadow(0 2px 8px rgba(255,200,0,0.8))",
                        zIndex: 5,
                    }}
                >
                    {item.isDolar ? "💵" : "💸"}
                </div>
            ))}

            {/* ── Grade sutil ── */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
                `,
                backgroundSize: "64px 64px",
                zIndex: 6,
            }} />

            {/* ── Vinheta nas bordas ── */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.8) 100%)",
                zIndex: 7,
            }} />

            {/* ── Keyframes ── */}
            <style>{`
                /*
                 * gatunoBody: corpo sobe/desce 2x por ciclo de 4s
                 * + leve inclinação lateral = ilusão das mãos subindo e descendo
                 */
                @keyframes gatunoBody {
                    0%   {
                        transform: translateY(0px)   rotate(0deg)    scaleX(1);
                        filter: drop-shadow(0 0 32px rgba(255,220,60,0.60)) brightness(1.10) contrast(1.06);
                    }
                    10%  {
                        transform: translateY(-14px) rotate(-3deg)   scaleX(1.015);
                        filter: drop-shadow(0 0 44px rgba(255,220,60,0.78)) brightness(1.20) contrast(1.08);
                    }
                    25%  {
                        transform: translateY(-30px) rotate(0deg)    scaleX(1);
                        filter: drop-shadow(0 0 58px rgba(255,220,60,0.95)) brightness(1.32) contrast(1.10);
                    }
                    40%  {
                        transform: translateY(-14px) rotate(3deg)    scaleX(0.985);
                        filter: drop-shadow(0 0 44px rgba(255,220,60,0.78)) brightness(1.20) contrast(1.08);
                    }
                    50%  {
                        transform: translateY(0px)   rotate(0deg)    scaleX(1);
                        filter: drop-shadow(0 0 32px rgba(255,220,60,0.60)) brightness(1.10) contrast(1.06);
                    }
                    60%  {
                        transform: translateY(-14px) rotate(-2.5deg) scaleX(1.015);
                        filter: drop-shadow(0 0 44px rgba(255,220,60,0.78)) brightness(1.20) contrast(1.08);
                    }
                    75%  {
                        transform: translateY(-30px) rotate(0deg)    scaleX(1);
                        filter: drop-shadow(0 0 58px rgba(255,220,60,0.95)) brightness(1.32) contrast(1.10);
                    }
                    90%  {
                        transform: translateY(-14px) rotate(2.5deg)  scaleX(0.985);
                        filter: drop-shadow(0 0 44px rgba(255,220,60,0.78)) brightness(1.20) contrast(1.08);
                    }
                    100% {
                        transform: translateY(0px)   rotate(0deg)    scaleX(1);
                        filter: drop-shadow(0 0 32px rgba(255,220,60,0.60)) brightness(1.10) contrast(1.06);
                    }
                }

                /* Braço esquerdo: oscila para cima e para baixo independentemente */
                @keyframes armLeftWave {
                    0%,100% { transform: rotate(0deg)   translateY(0px);  }
                    20%     { transform: rotate(-14deg) translateY(-10px); }
                    50%     { transform: rotate(0deg)   translateY(0px);  }
                    70%     { transform: rotate(12deg)  translateY(-10px); }
                }

                /* Halo pulsante */
                @keyframes haloGlow {
                    0%,100% { transform: translate(-50%,-50%) scale(1);    opacity: 0.65; }
                    25%     { transform: translate(-50%,-50%) scale(1.14); opacity: 1;    }
                    50%     { transform: translate(-50%,-50%) scale(1.22); opacity: 0.80; }
                    75%     { transform: translate(-50%,-50%) scale(1.14); opacity: 1;    }
                }

                /* Queda de dinheiro com balanço lateral suave */
                @keyframes moneyFall {
                    0%   { transform: translateY(0)     translateX(0px)   rotate(0deg);   opacity: 0;   }
                    7%   { opacity: 1; }
                    25%  { transform: translateY(25vh)  translateX(14px)  rotate(50deg);  opacity: 1;   }
                    50%  { transform: translateY(52vh)  translateX(-12px) rotate(145deg); opacity: 0.9; }
                    75%  { transform: translateY(78vh)  translateX(16px)  rotate(270deg); opacity: 0.75;}
                    93%  { opacity: 0.5; }
                    100% { transform: translateY(115vh) translateX(-8px)  rotate(360deg); opacity: 0;   }
                }
            `}</style>
        </div>
    );
}

export default function Admin() {
    const [aba, setAba] = useState<'pedidos' | 'catalogo' | 'novo'>('pedidos');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [imgProd, setImgProd] = useState('');

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
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '8px', borderRadius: '8px' }}>👕</div>
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
                                            <div style={{ 
                                                width: '80px', 
                                                height: '80px', 
                                                borderRadius: '8px', 
                                                overflow: 'hidden',
                                                background: '#f1f5f9',
                                                border: '1px solid #e2e8f0'
                                            }}>
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
const btnSave: React.CSSProperties = { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' };
