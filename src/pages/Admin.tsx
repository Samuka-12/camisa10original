import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStoreConfig, PriceRule, FloatingStory, CatalogImage } from '../contexts/StoreConfigContext';
import { allProducts } from '../data/products';
import {
    LayoutDashboard,
    ShoppingCart,
    PlusCircle,
    Eye,
    RefreshCw,
    Trash2,
    UserSearch,
    LogOut,
    Sliders,
    MessageCircle,
    Activity,
    Calculator,
    Shield,
    Camera,
    Sparkles,
    Play,
    Plus,
    Download,
    Search,
    Info,
    Check
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

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
            {/* Gatuno background */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.15,
                }}
            >
                <img 
                    src="/gatuno.jpg" 
                    alt="Gatuno"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                        transformOrigin: "center bottom",
                    }}
                />
            </div>

            {/* Money Rain */}
            {moneyItems.map((_, i) => {
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 4;
                const randomDuration = 4 + Math.random() * 4;
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
                            opacity: 0.4,
                        }}
                    >
                        {isDolar ? "💵" : "💸"}
                    </div>
                );
            })}

            {/* Keyframes */}
            <style>{`
                @keyframes gatunoExtasia {
                    0%, 100% { transform: scale(1) translateY(0px) rotate(0deg); }
                    25% { transform: scale(1.03) translateY(-5px) rotate(-0.5deg); }
                    50% { transform: scale(1.05) translateY(-10px) rotate(0.5deg); }
                    75% { transform: scale(1.03) translateY(-5px) rotate(-0.5deg); }
                }
                @keyframes moneyRain {
                    0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(120vh) rotate(360deg) scale(1.2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default function Admin() {
    const { config, saveConfig } = useStoreConfig();
    const [authorized, setAuthorized] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    type ActiveTab = 'dashboard' | 'pedidos' | 'catalogo' | 'novo' | 'configuracoes' | 'stories' | 'precos' | 'imagens' | 'calculadora' | 'integracoes';
    const [aba, setAba] = useState<ActiveTab>('dashboard');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Enhanced product form states
    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [imgProd, setImgProd] = useState('');
    const [categoryProd, setCategoryProd] = useState('europeus');
    const [teamProd, setTeamProd] = useState('Personalizado');
    const [descProd, setDescProd] = useState('');
    const [descVideoProd, setDescVideoProd] = useState('');
    const [descImgProd, setDescImgProd] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // Selected sizes checklist
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["P", "M", "G", "GG", "XGG"]);

    // Settings config local states
    const [localConfig, setLocalConfig] = useState(config);

    // Pricing rule local states
    const [ruleNome, setRuleNome] = useState('');
    const [ruleEscopo, setRuleEscopo] = useState<'tudo' | 'categoria'>('tudo');
    const [ruleCat, setRuleCat] = useState('europeus');
    const [ruleOp, setRuleOp] = useState<'aumentar' | 'diminuir'>('aumentar');
    const [rulePercent, setRulePercent] = useState('10');
    const [simulationOpen, setSimulationOpen] = useState(false);

    // Stories manager states
    const [storyNome, setStoryNome] = useState('');
    const [storyVideoUrl, setStoryVideoUrl] = useState('');
    const [storyTipo, setStoryTipo] = useState<'produto' | 'texto'>('produto');
    const [storyProdId, setStoryProdId] = useState('');
    const [storyText, setStoryText] = useState('');
    const [storyVisib, setStoryVisib] = useState<'global' | 'produto'>('global');
    const [storyPageProdId, setStoryPageProdId] = useState('');

    // Image bank upload states
    const [bankAlbum, setBankAlbum] = useState('Geral');
    const [bankImageUrl, setBankImageUrl] = useState('');
    const [imageSearch, setImageSearch] = useState('');
    const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('Todos');
    const [imageCols, setImageCols] = useState<'2' | '3' | '4'>('4');

    // Calculator states
    const [calcVal1, setCalcVal1] = useState('');
    const [calcVal2, setCalcVal2] = useState('');
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/'>('+');

    const USER_EMAIL_MAP: Record<string, string> = {
        'gatuno171': 'gatuno171@camisa10admin.com',
        'samuel': 'samuelcab444@gmail.com',
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setAuthorized(true);
            setAuthLoading(false);
        });
    }, []);

    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

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
        const { data } = await supabase
            .from('produtos')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) {
            // Filter out store configurations row
            setProdutos(data.filter(prod => prod.id !== 'store_config'));
        }
        setLoading(false);
    };

    useEffect(() => {
        if (authorized) {
            buscarPedidos();
            buscarProdutos();
        }
    }, [authorized]);

    // AI Description generator mock/persuasive template logic
    const handleGenerateAiDescription = () => {
        if (!nomeProd) {
            alert("Por favor, preencha o Nome da Camisa primeiro!");
            return;
        }
        setAiGenerating(true);
        setTimeout(() => {
            const templates = [
                `Vista o manto sagrado com orgulho! A Camiseta ${nomeProd} do ${teamProd} é ideal para o torcedor que quer carregar as glórias e a tradição do clube em todos os momentos. Confeccionada com tecido altamente tecnológico que absorve o suor e garante extremo conforto, esta peça traz detalhes bordados em alta definição e o design oficial da temporada 2026/27. Perfeita para empurrar o time na arquibancada ou esbanjar estilo no dia a dia. Adquira já a sua e sinta a energia do manto!`,
                `A herança histórica e a paixão inabalável se encontram na nova Camiseta ${nomeProd} do ${teamProd}. Com acabamento premium e modelagem que proporciona ajuste anatômico perfeito ao corpo, ela combina a tradicional cor do clube com grafismos modernos inspirados na garra dos jogadores em campo. O tecido aerodinâmico de secagem rápida garante frescor absoluto do primeiro ao último minuto de jogo. Seja parte da história, garanta a sua agora!`,
                `Desempenho de atleta e elegância de torcedor. A Camiseta ${nomeProd} ${teamProd} foi desenvolvida para os verdadeiros apaixonados por futebol. Seu design exclusivo celebra a rica história e as vitórias épicas do time, trazendo o escudo clássico com costura dupla reforçada. Feita com materiais sustentáveis de alta durabilidade, oferece leveza inigualável e respirabilidade inteligente no dia a dia. Uma edição indispensável para a sua coleção!`
            ];
            const result = templates[Math.floor(Math.random() * templates.length)];
            setDescProd(result);
            setAiGenerating(false);
        }, 1500);
    };

    const cadastrarProduto = async (e: React.FormEvent) => {
        e.preventDefault();
        const precoNumerico = parseFloat(precoProd.replace(',', '.'));
        
        // Merge optional description medias
        let fullDescription = descProd;
        if (descImgProd) {
            fullDescription += `\n\n[IMAGEM_DESCRIÇÃO](${descImgProd})`;
        }
        if (descVideoProd) {
            fullDescription += `\n\n[VÍDEO_DESCRIÇÃO](${descVideoProd})`;
        }

        const { error } = await supabase
            .from('produtos')
            .insert([{
                id: crypto.randomUUID(),
                nome: nomeProd,
                preco: precoNumerico,
                imagem_url: imgProd,
                image: imgProd,
                category: categoryProd,
                team: teamProd,
                description: fullDescription,
                sizes: selectedSizes
            }]);

        if (!error) {
            alert("Produto cadastrado no catálogo com sucesso!");
            setNomeProd(''); setPrecoProd(''); setImgProd(''); setDescProd(''); setDescImgProd(''); setDescVideoProd('');
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

    const handleSaveGlobalConfig = async (configData: any) => {
        const success = await saveConfig(configData);
        if (success) {
            alert("Configurações salvas e aplicadas com sucesso em toda a loja!");
        } else {
            alert("Erro ao salvar no banco, mas as alterações foram mantidas no cache local.");
        }
    };

    // Rule pricing logic
    const handleAddPriceRule = () => {
        if (!ruleNome) {
            alert("Dê um nome para a regra de preço!");
            return;
        }
        const percentage = parseFloat(rulePercent);
        if (isNaN(percentage) || percentage <= 0) {
            alert("Por favor, digite um percentual válido maior que zero.");
            return;
        }

        const newRule: PriceRule = {
            id: crypto.randomUUID(),
            nome: ruleNome,
            escopo: ruleEscopo,
            categoria: ruleEscopo === 'categoria' ? ruleCat : undefined,
            operacao: ruleOp,
            percentual: percentage,
            ativa: true
        };

        const updatedConfig = {
            ...localConfig,
            precoGestao: {
                ...localConfig.precoGestao,
                regras: [...(localConfig.precoGestao?.regras || []), newRule]
            }
        };

        setLocalConfig(updatedConfig);
        setRuleNome('');
        alert("Regra adicionada! Clique em 'SALVAR ALTERAÇÕES DA LOJA' para aplicar.");
    };

    const handleToggleRule = (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).map(r => 
            r.id === id ? { ...r, ativa: !r.ativa } : r
        );
        setLocalConfig({
            ...localConfig,
            precoGestao: { ...localConfig.precoGestao, regras: updatedRules }
        });
    };

    const handleRemoveRule = (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).filter(r => r.id !== id);
        setLocalConfig({
            ...localConfig,
            precoGestao: { ...localConfig.precoGestao, regras: updatedRules }
        });
    };

    // Calculate rule dynamic prices on dynamic products
    const getSimulatedPrice = (prod: any) => {
        let finalPrice = prod.preco;
        const rules = localConfig.precoGestao?.regras || [];
        
        rules.forEach(rule => {
            if (!rule.ativa) return;
            let apply = false;
            if (rule.escopo === 'tudo') {
                apply = true;
            } else if (rule.escopo === 'categoria' && rule.categoria) {
                apply = prod.category?.includes(rule.categoria);
            }

            if (apply) {
                const factor = rule.percentual / 100;
                if (rule.operacao === 'aumentar') {
                    finalPrice = finalPrice * (1 + factor);
                } else if (rule.operacao === 'diminuir') {
                    finalPrice = finalPrice * (1 - factor);
                }
            }
        });
        return finalPrice;
    };

    // Stories manager logic
    const handleAddStory = () => {
        if (!storyNome || !storyVideoUrl) {
            alert("Nome do Story e URL do vídeo são obrigatórios!");
            return;
        }

        const newStory: FloatingStory = {
            id: crypto.randomUUID(),
            nome: storyNome,
            videoUrl: storyVideoUrl,
            tipoViculo: storyTipo,
            produtoId: storyTipo === 'produto' ? storyProdId : undefined,
            textoPromo: storyTipo === 'texto' ? storyText : undefined,
            visibilidade: storyVisib,
            produtoPaginaId: storyVisib === 'produto' ? storyPageProdId : undefined
        };

        const updatedConfig = {
            ...localConfig,
            stories: {
                ...localConfig.stories,
                lista: [...(localConfig.stories?.lista || []), newStory]
            }
        };

        setLocalConfig(updatedConfig);
        setStoryNome(''); setStoryVideoUrl(''); setStoryText('');
        alert("Story adicionado! Clique em 'SALVAR ALTERAÇÕES DA LOJA' para ativar.");
    };

    const handleRemoveStory = (id: string) => {
        const updatedList = (localConfig.stories?.lista || []).filter(s => s.id !== id);
        setLocalConfig({
            ...localConfig,
            stories: { ...localConfig.stories, lista: updatedList }
        });
    };

    // Image bank gallery logic
    const handleAddBankImage = () => {
        if (!bankImageUrl) {
            alert("Faça o upload ou digite a URL da imagem primeiro!");
            return;
        }

        const newImage: CatalogImage = {
            id: crypto.randomUUID(),
            album: bankAlbum,
            url: bankImageUrl,
            nome: bankImageUrl.split('/').pop()?.split('?')[0] || 'imagem_catalogo.jpg',
            tamanho: 'Alta Resolução (2000x2000px)',
            created_at: new Date().toISOString()
        };

        const updatedConfig = {
            ...localConfig,
            imagensBanco: {
                ...localConfig.imagensBanco,
                lista: [...(localConfig.imagensBanco?.lista || []), newImage]
            }
        };

        setLocalConfig(updatedConfig);
        setBankImageUrl('');
        alert("Imagem salva no banco de mídias! Salve as configurações gerais para consolidar.");
    };

    const handleRemoveBankImage = (id: string) => {
        const updatedList = (localConfig.imagensBanco?.lista || []).filter(img => img.id !== id);
        setLocalConfig({
            ...localConfig,
            imagensBanco: { ...localConfig.imagensBanco, lista: updatedList }
        });
    };

    // Calculator operations
    const handleCalculator = () => {
        const v1 = parseFloat(calcVal1);
        const v2 = parseFloat(calcVal2);

        if (isNaN(v1) || isNaN(v2)) {
            alert("Digite números válidos!");
            return;
        }

        let res = 0;
        if (calcOp === '+') res = v1 + v2;
        else if (calcOp === '-') res = v1 - v2;
        else if (calcOp === '*') res = v1 * v2;
        else if (calcOp === '/') {
            if (v2 === 0) {
                alert("Divisão por zero não é permitida!");
                return;
            }
            res = v1 / v2;
        }
        setCalcResult(res);
    };

    // Metrics calculations for dashboard
    const totalFaturamento = pedidos.reduce((acc, p) => p.status === 'paid' || p.status === 'approved' ? acc + parseFloat(String(p.valor_total)) : acc, 0);
    const totalLeads = pedidos.length;
    const pedidosPagos = pedidos.filter(p => p.status === 'paid' || p.status === 'approved').length;
    const taxaConversao = totalLeads > 0 ? ((pedidosPagos / totalLeads) * 100).toFixed(1) : '0.0';
    const ticketMedio = pedidosPagos > 0 ? (totalFaturamento / pedidosPagos).toFixed(2) : '0,00';

    if (authLoading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative' }}>
                <AnimatedBackground />
                <span style={{ zIndex: 10, color: '#fff', fontSize: '18px', fontWeight: 900 }}>Verificando credenciais...</span>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatedBackground />
                <form onSubmit={handleLogin} style={{
                    background: 'rgba(10,14,30,0.85)', 
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    padding: '40px', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    width: '400px',
                    boxShadow: '0 12px 64px rgba(0,0,0,0.8)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '22px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{ 
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', 
                            color: '#fff', 
                            padding: '14px', 
                            borderRadius: '16px', 
                            width: 'fit-content', 
                            margin: '0 auto 15px',
                            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                            fontSize: '32px',
                            lineHeight: 1
                        }}>
                            🐱
                        </div>
                        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: 0, tracking: 'tight' }}>MantoSagrado Admin</h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>Gestão de Marketing & Vitrine 💸</p>
                    </div>

                    {loginError && (
                        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fc8181', fontSize: '13px', fontWeight: 700 }}>
                            {loginError}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="gatuno171" 
                            style={{
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '10px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.05)', 
                                color: '#fff', 
                                fontWeight: 'bold', 
                                outline: 'none',
                                boxSizing: 'border-box'
                            }} 
                            required 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••••••" 
                            style={{
                                width: '100%', 
                                padding: '12px 16px', 
                                borderRadius: '10px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.05)', 
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
                        padding: '15px',
                        background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 900,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                        transition: 'all 0.2s',
                        fontSize: '16px'
                    }}>
                        {loading ? 'Autenticando...' : 'Acessar Central 🐱'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
            <AnimatedBackground />

            {/* Admin Sidebar Navigation */}
            <aside style={{ 
                width: '300px', 
                background: 'rgba(15,23,42,0.92)', 
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(255,255,255,0.06)', 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column',
                zIndex: 10
            }}>
                <div style={{ fontWeight: 900, fontSize: '19px', marginBottom: '35px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '10px', borderRadius: '10px' }}>🐱</div>
                    MantoSagrado Admin
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                    <button onClick={() => setAba('dashboard')} style={aba === 'dashboard' ? bAt : bIn}>
                        <LayoutDashboard size={18} /> Dashboard de Vendas
                    </button>
                    <button onClick={() => setAba('pedidos')} style={aba === 'pedidos' ? bAt : bIn}>
                        <ShoppingCart size={18} /> Captura de Pedidos
                    </button>
                    <button onClick={() => setAba('catalogo')} style={aba === 'catalogo' ? bAt : bIn}>
                        <Eye size={18} /> Catálogo da Vitrine
                    </button>
                    <button onClick={() => setAba('novo')} style={aba === 'novo' ? bAt : bIn}>
                        <PlusCircle size={18} /> Novo Produto (Grade & IA)
                    </button>
                    <button onClick={() => setAba('configuracoes')} style={aba === 'configuracoes' ? bAt : bIn}>
                        <Sliders size={18} /> Banners & Widgets
                    </button>
                    <button onClick={() => setAba('stories')} style={aba === 'stories' ? bAt : bIn}>
                        <Play size={18} /> Stories Flutuantes
                    </button>
                    <button onClick={() => setAba('precos')} style={aba === 'precos' ? bAt : bIn}>
                        <Activity size={18} /> Regras de Preços
                    </button>
                    <button onClick={() => setAba('imagens')} style={aba === 'imagens' ? bAt : bIn}>
                        <Camera size={18} /> Banco de Imagens
                    </button>
                    <button onClick={() => setAba('calculadora')} style={aba === 'calculadora' ? bAt : bIn}>
                        <Calculator size={18} /> Calculadora ROI
                    </button>
                    <button onClick={() => setAba('integracoes')} style={aba === 'integracoes' ? bAt : bIn}>
                        <Shield size={18} /> Integrações
                    </button>
                </nav>

                {/* Floating save state indicator if localConfig != config */}
                {JSON.stringify(localConfig) !== JSON.stringify(config) && (
                    <button 
                        onClick={() => handleSaveGlobalConfig(localConfig)}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 900,
                            padding: '12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            marginBottom: '15px',
                            boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                            fontSize: '13px'
                        }}
                    >
                        💾 SALVAR ALTERAÇÕES
                    </button>
                )}

                <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 900, display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer', fontSize: '14px' }}>
                    <LogOut size={18} /> Sair do Painel
                </button>
            </aside>

            {/* Main Area */}
            <main style={{ flex: 1, padding: '40px', zIndex: 10, overflowY: 'auto', maxHeight: '100vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                        {aba === 'dashboard' && '📊 Dashboard de Vendas'}
                        {aba === 'pedidos' && '🛒 Pedidos Capturados'}
                        {aba === 'catalogo' && '👕 Catálogo de Camisas'}
                        {aba === 'novo' && '➕ Novo Produto (Vitrine)'}
                        {aba === 'configuracoes' && '⚙️ Banners e Comportamento Visual'}
                        {aba === 'stories' && '📱 Stories Flutuantes de Vídeo'}
                        {aba === 'precos' && '💰 Precificação Varejo & Atacado'}
                        {aba === 'imagens' && '🖼️ Banco de Mídias e Mockups'}
                        {aba === 'calculadora' && '🧮 Calculadora de Gastos e ROI'}
                        {aba === 'integracoes' && '🔗 Integrações e Rastreamento'}
                    </h1>
                    <button onClick={aba === 'pedidos' ? buscarPedidos : buscarProdutos} style={btnRef}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> ATUALIZAR DADOS
                    </button>
                </div>

                {/* 1. Dashboard Tab */}
                {aba === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase">Faturamento Aprovado</p>
                                <h3 className="text-2xl font-black text-green-400 mt-2">R$ {totalFaturamento.toFixed(2).replace('.', ',')}</h3>
                            </div>
                            <div className="bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase">Leads Iniciados (Checkout)</p>
                                <h3 className="text-2xl font-black text-blue-400 mt-2">{totalLeads}</h3>
                            </div>
                            <div className="bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase">Vendas Realizadas</p>
                                <h3 className="text-2xl font-black text-purple-400 mt-2">{pedidosPagos}</h3>
                            </div>
                            <div className="bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase">Conversão Média</p>
                                <h3 className="text-2xl font-black text-amber-400 mt-2">{taxaConversao}%</h3>
                            </div>
                        </div>

                        {/* Graph visual details */}
                        <div className="bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl mt-6">
                            <h4 className="text-sm font-bold text-white mb-4">FUNIL DE CONVERSÃO</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Checkout Aberto (100%)</span>
                                        <span>{totalLeads} leads</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Vendas Pagas ({taxaConversao}%)</span>
                                        <span>{pedidosPagos} pedidos</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full" style={{ width: `${taxaConversao}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Pedidos Tab (Dados Checkout) */}
                {aba === 'pedidos' && (
                    <div style={tabCard}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <tr>
                                        <th style={th}>HORÁRIO</th>
                                        <th style={th}>CLIENTE</th>
                                        <th style={th}>PRODUTO / VALOR</th>
                                        <th style={th}>STATUS</th>
                                        <th style={th}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={td}>{new Date(p.created_at).toLocaleDateString('pt-BR')} {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={td}><strong>{p.nome_completo}</strong><br /><span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.telefone}</span></td>
                                            <td style={td}>
                                                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{p.produto_nome}</div>
                                                <div style={{ color: '#38bdf8', fontWeight: 900 }}>R$ {parseFloat(p.valor_total).toFixed(2).replace('.', ',')}</div>
                                            </td>
                                            <td style={td}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '10px',
                                                    fontWeight: 900,
                                                    background: p.status === 'paid' || p.status === 'approved' ? '#10b981' : 
                                                                p.status === 'pix_generated' ? '#3b82f6' : 
                                                                p.status === 'checkout_iniciado' ? '#f59e0b' : '#64748b',
                                                    color: '#fff'
                                                }}>
                                                    {p.status?.toUpperCase() || 'PENDENTE'}
                                                </span>
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
                                                    <UserSearch size={14} /> VER FICHA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. Catalogo Tab */}
                {aba === 'catalogo' && (
                    <div style={tabCard}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <tr>
                                    <th style={th}>MOCKUP</th>
                                    <th style={th}>PRODUTO</th>
                                    <th style={th}>CATEGORIA</th>
                                    <th style={th}>VALOR ORIGINAL</th>
                                    <th style={th}>VALOR AJUSTADO</th>
                                    <th style={th}>AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtos.map(prod => {
                                    const simulatedPrice = getSimulatedPrice(prod);
                                    return (
                                        <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={td}>
                                                <div style={{ width: '60px', height: '60px', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <img
                                                        src={prod.imagem_url || prod.image}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        alt="camisa"
                                                    />
                                                </div>
                                            </td>
                                            <td style={td}>
                                                <strong>{prod.nome}</strong><br />
                                                <span style={{ fontSize: '11px', color: '#a78bfa' }}>{prod.team}</span>
                                            </td>
                                            <td style={td} className="capitalize text-gray-300 font-semibold">{prod.category}</td>
                                            <td style={td}>R$ {prod.preco?.toFixed(2).replace('.', ',')}</td>
                                            <td style={td} className="text-green-400 font-extrabold">
                                                R$ {simulatedPrice.toFixed(2).replace('.', ',')}
                                            </td>
                                            <td style={td}>
                                                <button onClick={() => deletarProduto(prod.id)} style={{ ...btnV, background: '#ef4444', boxShadow: 'none' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. Novo Produto Tab (Grade & IA) */}
                {aba === 'novo' && (
                    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl max-w-2xl">
                        <form onSubmit={cadastrarProduto} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nome da Camisa</label>
                                <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Ex: Brasil Retrô 2002" style={input} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Time/Clube</label>
                                    <input value={teamProd} onChange={e => setTeamProd(e.target.value)} placeholder="Ex: Seleção Brasileira" style={input} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço base (R$)</label>
                                    <input value={precoProd} onChange={e => setPrecoProd(e.target.value)} placeholder="139.90" style={input} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria da Loja</label>
                                    <select 
                                        value={categoryProd} 
                                        onChange={e => setCategoryProd(e.target.value)} 
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none"
                                    >
                                        <option value="seleções">Seleções</option>
                                        <option value="brasileirão">Brasileirão</option>
                                        <option value="retrô">Retrô Histórica</option>
                                        <option value="europeus">Europeus</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Imagem Vitrine (mockup principal)</label>
                                    <input value={imgProd} onChange={e => setImgProd(e.target.value)} placeholder="Cole o URL ou use o uploader abaixo" style={input} required />
                                </div>
                            </div>

                            {/* Image Uploader for new product */}
                            <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Upload de Mockup da Vitrine (Recomendado 2000x2000px)</label>
                                <ImageUploader 
                                    onUploadSuccess={(url) => setImgProd(url)} 
                                    currentImageUrl={imgProd} 
                                    onRemoveImage={() => setImgProd('')} 
                                />
                            </div>

                            {/* Sizes Checklist Grade */}
                            <div className="border border-white/5 p-5 rounded-xl bg-slate-950/40 space-y-4">
                                <label className="block text-xs font-bold text-white uppercase tracking-wider">Grade de Tamanhos Disponíveis</label>
                                
                                <div className="space-y-3">
                                    {/* Masculino */}
                                    <div>
                                        <span className="text-[11px] text-blue-400 font-bold uppercase">Masculino</span>
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {["P", "M", "G", "GG", "XGG", "G1", "G2", "G3"].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${selectedSizes.includes(size) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-white/10 text-gray-300'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Feminino */}
                                    <div>
                                        <span className="text-[11px] text-pink-400 font-bold uppercase">Feminino</span>
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {["Fem P", "Fem M", "Fem G", "Fem GG"].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${selectedSizes.includes(size) ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-white/10 text-gray-300'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Infantil */}
                                    <div>
                                        <span className="text-[11px] text-amber-400 font-bold uppercase">Infantil</span>
                                        <div className="flex gap-2 flex-wrap mt-1">
                                            {["1 ano", "2 anos", "4 anos", "6 anos", "8 anos", "10 anos", "12 anos", "14 anos"].map(size => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${selectedSizes.includes(size) ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-white/10 text-gray-300'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description Media Import */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Importar Imagem p/ Descrição (URL)</label>
                                    <input value={descImgProd} onChange={e => setDescImgProd(e.target.value)} placeholder="URL de imagem explicativa" style={input} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Importar Vídeo p/ Descrição (URL)</label>
                                    <input value={descVideoProd} onChange={e => setDescVideoProd(e.target.value)} placeholder="URL de vídeo do Youtube/Vimeo" style={input} />
                                </div>
                            </div>

                            {/* AI Description Assistant */}
                            <div className="border border-white/5 p-5 rounded-xl bg-slate-950/40 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-white uppercase tracking-wider">Descrição Persuasiva do Produto</label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiDescription}
                                        disabled={aiGenerating}
                                        className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition"
                                    >
                                        <Sparkles size={14} className={aiGenerating ? 'animate-spin' : ''} />
                                        {aiGenerating ? 'Gerando Copy com IA...' : 'Escrever com IA ✨'}
                                    </button>
                                </div>
                                <textarea
                                    value={descProd}
                                    onChange={e => setDescProd(e.target.value)}
                                    placeholder="Escreva a descrição do produto ou utilize o assistente de Inteligência Artificial acima para gerar um texto promocional padrão do seu time de futebol."
                                    rows={5}
                                    className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm leading-relaxed"
                                    required
                                />
                            </div>

                            <button type="submit" style={btnSave}>CADASTRAR PRODUTO NOVO</button>
                        </form>
                    </div>
                )}

                {/* 5. Configuracoes Tab (Banners, verificado, barra fixa, pulse) */}
                {aba === 'configuracoes' && localConfig && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Banner Geolocalizado config card */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    📍 Banner Geolocalizado de Promoção
                                </h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.bannerGeolocalizado?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>
                            
                            {localConfig.bannerGeolocalizado?.ativo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Cores do Banner</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                value={localConfig.bannerGeolocalizado.corFundo}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corFundo: e.target.value }
                                                })}
                                                className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                            />
                                            <input 
                                                type="color" 
                                                value={localConfig.bannerGeolocalizado.corTexto}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corTexto: e.target.value }
                                                })}
                                                className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Tamanho da Fonte (px)</label>
                                        <input 
                                            value={localConfig.bannerGeolocalizado.tamanhoFonte}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, tamanhoFonte: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                            placeholder="14px"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Template de Texto (Use as tags {"{cidade}"} e {"{estado}"})</label>
                                        <input 
                                            value={localConfig.bannerGeolocalizado.textoTemplate}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, textoTemplate: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                            placeholder="⚡ Frete Grátis para {cidade} - {estado}!"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Banner Topo Marquee config card */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">
                                    🔥 Banner de Topo Rotativo (Marquee / 1920x128px)
                                </h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.bannerTopo?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        bannerTopo: { ...localConfig.bannerTopo, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>

                            {localConfig.bannerTopo?.ativo && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor de Fundo</label>
                                            <input 
                                                type="color" 
                                                value={localConfig.bannerTopo.corFundo}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value }
                                                })}
                                                className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade da Animação (Segundos)</label>
                                            <input 
                                                type="number"
                                                value={localConfig.bannerTopo.velocidade}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    bannerTopo: { ...localConfig.bannerTopo, velocidade: parseInt(e.target.value) || 30 }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Imagem Anúncio Vitrine (opcional)</label>
                                            <input 
                                                value={localConfig.bannerTopo.imagem}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    bannerTopo: { ...localConfig.bannerTopo, imagem: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                                placeholder="URL de imagem 1920x128px"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Texto de Promoção Rotativo</label>
                                        <input 
                                            value={localConfig.bannerTopo.textoMarquee}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                bannerTopo: { ...localConfig.bannerTopo, textoMarquee: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* General options (verified, personalization) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">🛡️ Selo de Confiança / Verificado</h3>
                                <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-white/5">
                                    <span>Ativar Badges de Confiança</span>
                                    <input 
                                        type="checkbox"
                                        checked={localConfig.verificadoLoja?.ativo}
                                        onChange={e => setLocalConfig({
                                            ...localConfig,
                                            verificadoLoja: { ...localConfig.verificadoLoja, ativo: e.target.checked }
                                        })}
                                        className="w-5 h-5 accent-purple-600"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">👕 Personalização de Camiseta</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] text-gray-400 font-bold mb-1">Label / Placeholder Nome</label>
                                        <div className="flex gap-2">
                                            <input 
                                                value={localConfig.personalizacaoCamiseta?.labelNome}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, labelNome: e.target.value }
                                                })}
                                                className="w-1/2 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs"
                                            />
                                            <input 
                                                value={localConfig.personalizacaoCamiseta?.placeholderNome}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, placeholderNome: e.target.value }
                                                })}
                                                className="w-1/2 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-400 font-bold mb-1">Label / Placeholder Número</label>
                                        <div className="flex gap-2">
                                            <input 
                                                value={localConfig.personalizacaoCamiseta?.labelNumero}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, labelNumero: e.target.value }
                                                })}
                                                className="w-1/2 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs"
                                            />
                                            <input 
                                                value={localConfig.personalizacaoCamiseta?.placeholderNumero}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, placeholderNumero: e.target.value }
                                                })}
                                                className="w-1/2 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Buy Bar & Pulse button settings */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">🛒 Barra de Compra Fixa (Sticky Buy Bar)</h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.barraCompraFixa?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        barraCompraFixa: { ...localConfig.barraCompraFixa, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>

                            {localConfig.barraCompraFixa?.ativo && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Cor do Botão Comprar</label>
                                        <input 
                                            type="color" 
                                            value={localConfig.barraCompraFixa.corBotao}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                barraCompraFixa: { ...localConfig.barraCompraFixa, corBotao: e.target.value }
                                            })}
                                            className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Transparência Fundo (0 a 1)</label>
                                        <input 
                                            type="number"
                                            step="0.05"
                                            min="0"
                                            max="1"
                                            value={localConfig.barraCompraFixa.transparenciaFundo}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                barraCompraFixa: { ...localConfig.barraCompraFixa, transparenciaFundo: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Posição na Tela</label>
                                        <select 
                                            value={localConfig.barraCompraFixa.posicao}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                barraCompraFixa: { ...localConfig.barraCompraFixa, posicao: e.target.value as any }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                        >
                                            <option value="top">Topo</option>
                                            <option value="bottom">Rodapé</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pulse buy button */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">💓 Efeito Pulse no Botão de Comprar</h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.pulseComprar?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        pulseComprar: { ...localConfig.pulseComprar, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>

                            {localConfig.pulseComprar?.ativo && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Cor do Pulso</label>
                                        <input 
                                            type="color" 
                                            value={localConfig.pulseComprar.cor}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                pulseComprar: { ...localConfig.pulseComprar, cor: e.target.value }
                                            })}
                                            className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade</label>
                                        <select 
                                            value={localConfig.pulseComprar.velocidade}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                pulseComprar: { ...localConfig.pulseComprar, velocidade: e.target.value as any }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs"
                                        >
                                            <option value="lento">Lento</option>
                                            <option value="normal">Normal</option>
                                            <option value="rapido">Rápido</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Tamanho Máx Escala</label>
                                        <input 
                                            value={localConfig.pulseComprar.tamanho}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                pulseComprar: { ...localConfig.pulseComprar, tamanho: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                            placeholder="1.05"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Formato</label>
                                        <input 
                                            value={localConfig.pulseComprar.formato}
                                            onChange={e => setLocalConfig({
                                                ...localConfig,
                                                pulseComprar: { ...localConfig.pulseComprar, formato: e.target.value }
                                            })}
                                            className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"
                                            placeholder="rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* WhatsApp Buy configuration */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">💬 Compra Direta por WhatsApp</h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.whatsapp?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        whatsapp: { ...localConfig.whatsapp, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>

                            {localConfig.whatsapp?.ativo && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Número WhatsApp (somente dígitos)</label>
                                            <input 
                                                value={localConfig.whatsapp.numero}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    whatsapp: { ...localConfig.whatsapp, numero: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                                placeholder="5547983174463"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Botão na Página de Produto</label>
                                            <input 
                                                value={localConfig.whatsapp.textoBotao}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    whatsapp: { ...localConfig.whatsapp, textoBotao: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button 
                                                type="button" 
                                                onClick={() => window.open(`https://wa.me/${localConfig.whatsapp.numero}`, '_blank')}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-lg border-none cursor-pointer w-full text-sm"
                                            >
                                                Testar Link WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Personalizadas templates dropdown list */}
                                    <div className="border-t border-white/5 pt-4">
                                        <h4 className="text-xs font-bold text-white mb-2">Mensagens Personalizadas por Produto</h4>
                                        <div className="space-y-3">
                                            {produtos.map(p => {
                                                const currentMsg = localConfig.whatsapp.mensagensPersonalizadas?.[p.id] || '';
                                                return (
                                                    <div key={p.id} className="flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                                        <div className="text-xs font-semibold w-1/4 truncate">{p.nome}</div>
                                                        <input 
                                                            value={currentMsg}
                                                            onChange={e => {
                                                                const updatedMsgs = {
                                                                    ...localConfig.whatsapp.mensagensPersonalizadas,
                                                                    [p.id]: e.target.value
                                                                };
                                                                setLocalConfig({
                                                                    ...localConfig,
                                                                    whatsapp: { ...localConfig.whatsapp, mensagensPersonalizadas: updatedMsgs }
                                                                });
                                                            }}
                                                            className="flex-1 bg-slate-800 text-white rounded border border-white/10 p-2 focus:outline-none text-xs"
                                                            placeholder="Use {nome_produto} e {link_produto} no seu template."
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Promo timer / countdown settings */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white flex items-center gap-2">⏳ Contador Regressivo (Countdown Promo)</h3>
                                <input 
                                    type="checkbox"
                                    checked={localConfig.countdownTimer?.ativo}
                                    onChange={e => setLocalConfig({
                                        ...localConfig,
                                        countdownTimer: { ...localConfig.countdownTimer, ativo: e.target.checked }
                                    })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                            </div>

                            {localConfig.countdownTimer?.ativo && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Título do Banner</label>
                                            <input 
                                                value={localConfig.countdownTimer.titulo}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    countdownTimer: { ...localConfig.countdownTimer, titulo: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Data/Hora Limite (ISO YYYY-MM-DD HH:MM)</label>
                                            <input 
                                                value={localConfig.countdownTimer.dataHoraLimite}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    countdownTimer: { ...localConfig.countdownTimer, dataHoraLimite: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                                placeholder="2026-12-31 23:59:00"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto Auxiliar</label>
                                            <input 
                                                value={localConfig.countdownTimer.texto}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    countdownTimer: { ...localConfig.countdownTimer, texto: e.target.value }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cores (Fundo / Texto)</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="color" 
                                                    value={localConfig.countdownTimer.corFundo}
                                                    onChange={e => setLocalConfig({
                                                        ...localConfig,
                                                        countdownTimer: { ...localConfig.countdownTimer, corFundo: e.target.value }
                                                    })}
                                                    className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                                />
                                                <input 
                                                    type="color" 
                                                    value={localConfig.countdownTimer.corTexto}
                                                    onChange={e => setLocalConfig({
                                                        ...localConfig,
                                                        countdownTimer: { ...localConfig.countdownTimer, corTexto: e.target.value }
                                                    })}
                                                    className="w-10 h-10 border border-white/10 rounded cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Posição na Página de Venda</label>
                                            <select 
                                                value={localConfig.countdownTimer.posicao}
                                                onChange={e => setLocalConfig({
                                                    ...localConfig,
                                                    countdownTimer: { ...localConfig.countdownTimer, posicao: e.target.value as any }
                                                })}
                                                className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm"
                                            >
                                                <option value="topo">Topo do Site</option>
                                                <option value="acima_botao">Acima do Botão de Comprar</option>
                                                <option value="abaixo_botao">Abaixo do Botão de Comprar</option>
                                                <option value="rodape">Rodapé do Site</option>
                                                <option value="canto">Flutuante no Canto</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Products targeting selector search bar */}
                                    <div className="border-t border-white/5 pt-4">
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Vincular Promoção às Camisas Selecionadas</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto bg-slate-950/40 p-4 rounded-xl border border-white/5">
                                            {produtos.map(p => {
                                                const activeIds = localConfig.countdownTimer.produtosIds || [];
                                                const isLinked = activeIds.includes(p.id);
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const newIds = isLinked 
                                                                ? activeIds.filter(id => id !== p.id)
                                                                : [...activeIds, p.id];
                                                            setLocalConfig({
                                                                ...localConfig,
                                                                countdownTimer: { ...localConfig.countdownTimer, produtosIds: newIds }
                                                            });
                                                        }}
                                                        className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between text-left truncate ${
                                                            isLinked ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-white/5 text-gray-400'
                                                        }`}
                                                    >
                                                        <span className="truncate">{p.nome}</span>
                                                        {isLinked && <Check size={14} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 6. Stories Flutuantes Tab */}
                {aba === 'stories' && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Story Creator */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">📱 Criar Novo Story Flutuante (Formato de Bola)</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Título do Story (Aparece abaixo da bola)</label>
                                    <input value={storyNome} onChange={e => setStoryNome(e.target.value)} placeholder="Ex: Vasco Bordada" style={input} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">URL do Vídeo (Bucket ou Link externo)</label>
                                    <input value={storyVideoUrl} onChange={e => setStoryVideoUrl(e.target.value)} placeholder="Ex: https://.../video.mp4" style={input} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Tipo de Conteúdo no Modal do Vídeo</label>
                                    <select 
                                        value={storyTipo} 
                                        onChange={e => setStoryTipo(e.target.value as any)} 
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                    >
                                        <option value="produto">Vincular a uma Camiseta do Catálogo</option>
                                        <option value="texto">Mostrar Barra de Texto Promocional</option>
                                    </select>
                                </div>

                                {storyTipo === 'produto' ? (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Selecionar Camisa Vinculada</label>
                                        <select 
                                            value={storyProdId} 
                                            onChange={e => setStoryProdId(e.target.value)} 
                                            className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                        >
                                            <option value="">Selecione uma camisa</option>
                                            {produtos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Texto Promocional (Fundo em Barra)</label>
                                        <input value={storyText} onChange={e => setStoryText(e.target.value)} placeholder="Ex: 🔥 Cupom: TIME10 para 10% OFF!" style={input} />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Visibilidade</label>
                                    <select 
                                        value={storyVisib} 
                                        onChange={e => setStoryVisib(e.target.value as any)} 
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                    >
                                        <option value="global">Global (Todas as Páginas)</option>
                                        <option value="produto">Por Produto (Somente em Página Específica)</option>
                                    </select>
                                </div>

                                {storyVisib === 'produto' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Mostrar Somente na Página da Camisa:</label>
                                        <select 
                                            value={storyPageProdId} 
                                            onChange={e => setStoryPageProdId(e.target.value)} 
                                            className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                        >
                                            <option value="">Selecione a camisa</option>
                                            {produtos.map(p => (
                                                <option key={p.id} value={p.id}>{p.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            
                            <button type="button" onClick={handleAddStory} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl border-none cursor-pointer flex items-center justify-center gap-2">
                                <Plus size={16} /> ADICIONAR STORY À GRADE
                            </button>
                        </div>

                        {/* List of active stories */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-md font-bold text-white mb-4">Stories Ativos na Loja</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(localConfig.stories?.lista || []).map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full border border-purple-500 flex items-center justify-center bg-slate-900">
                                                <Play size={16} className="text-purple-400 fill-purple-400/20" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{s.nome}</h4>
                                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-gray-300">
                                                    {s.visibilidade === 'global' ? 'Global' : 'Por Produto'}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveStory(s.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(localConfig.stories?.lista || []).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-6 md:col-span-2">Nenhum story cadastrado para exibição.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. Regras de Preço Tab */}
                {aba === 'precos' && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Add Rule Form */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">💰 Configurar Regras de Alteração em Massa</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Nome identificador da Regra</label>
                                    <input value={ruleNome} onChange={e => setRuleNome(e.target.value)} placeholder="Ex: Inflação Europeia" style={input} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Escopo de Alteração</label>
                                    <select 
                                        value={ruleEscopo} 
                                        onChange={e => setRuleEscopo(e.target.value as any)} 
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                    >
                                        <option value="tudo">Toda a Loja (Todas as Camisas)</option>
                                        <option value="categoria">Categorias Específicas</option>
                                    </select>
                                </div>
                                
                                {ruleEscopo === 'categoria' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Selecionar Categoria</label>
                                        <select 
                                            value={ruleCat} 
                                            onChange={e => setRuleCat(e.target.value)} 
                                            className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                        >
                                            <option value="seleções">Seleções</option>
                                            <option value="brasileirão">Brasileirão</option>
                                            <option value="retrô">Retrô Histórica</option>
                                            <option value="europeus">Europeus</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Operação</label>
                                    <select 
                                        value={ruleOp} 
                                        onChange={e => setRuleOp(e.target.value as any)} 
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                    >
                                        <option value="aumentar">Aumentar Preço (+)</option>
                                        <option value="diminuir">Diminuir Preço (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Valor Percentual (%)</label>
                                    <input value={rulePercent} onChange={e => setRulePercent(e.target.value)} placeholder="10" style={input} />
                                </div>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddPriceRule} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3.5 rounded-xl border-none cursor-pointer w-full text-sm">
                                        CRIAR REGRA
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List of active rules */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-bold text-white">Regras de Preço Ativas</h3>
                                <button 
                                    onClick={() => setSimulationOpen(!simulationOpen)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl border-none cursor-pointer text-xs flex items-center gap-1.5 transition"
                                >
                                    <Eye size={14} /> {simulationOpen ? 'Ocultar Simulação' : 'Simular Alterações na Vitrine'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(localConfig.precoGestao?.regras || []).map(r => (
                                    <div key={r.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{r.nome}</h4>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Escopo: <span className="text-blue-400 font-semibold">{r.escopo === 'tudo' ? 'Toda a Loja' : `Categoria ${r.categoria}`}</span> | 
                                                Operação: <span className={r.operacao === 'aumentar' ? 'text-green-400' : 'text-red-400'}>{r.operacao === 'aumentar' ? 'Aumentar' : 'Diminuir'} {r.percentual}%</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleToggleRule(r.id)} 
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                                                    r.ativa ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-white/10 text-gray-400'
                                                }`}
                                            >
                                                {r.ativa ? 'Ativa' : 'Pausada'}
                                            </button>
                                            <button onClick={() => handleRemoveRule(r.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(localConfig.precoGestao?.regras || []).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-6">Nenhuma regra de preço configurada.</p>
                                )}
                            </div>
                        </div>

                        {/* Simulation Table Modal */}
                        {simulationOpen && (
                            <div className="bg-slate-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
                                <h3 className="text-md font-bold text-white">Simulador de Alterações de Preço</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                            <tr>
                                                <th style={th}>FOTO</th>
                                                <th style={th}>PRODUTO</th>
                                                <th style={th}>VALOR ORIGINAL</th>
                                                <th style={th}>VALOR SIMULADO</th>
                                                <th style={th}>DIFERENÇA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produtos.map(prod => {
                                                const original = prod.preco;
                                                const simulated = getSimulatedPrice(prod);
                                                const diff = simulated - original;
                                                const isChanged = diff !== 0;

                                                return (
                                                    <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                        <td style={td}>
                                                            <img src={prod.imagem_url || prod.image} className="w-10 h-10 object-contain bg-white rounded" />
                                                        </td>
                                                        <td style={td}>
                                                            <div className="font-bold text-xs text-white">{prod.nome}</div>
                                                            <span className="text-[10px] text-gray-400">{prod.category}</span>
                                                        </td>
                                                        <td style={td}>R$ {original.toFixed(2).replace('.', ',')}</td>
                                                        <td style={td} className={isChanged ? 'text-green-400 font-extrabold' : 'text-gray-300'}>
                                                            R$ {simulated.toFixed(2).replace('.', ',')}
                                                        </td>
                                                        <td style={td} className={diff > 0 ? 'text-green-400 font-bold' : diff < 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                                                            {diff > 0 ? `+ R$ ${diff.toFixed(2).replace('.', ',')}` : diff < 0 ? `- R$ ${Math.abs(diff).toFixed(2).replace('.', ',')}` : '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 8. Banco de Imagens Tab */}
                {aba === 'imagens' && (
                    <div className="space-y-6">
                        {/* Image Uploader Library */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4 max-w-2xl">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">🖼️ Registrar Fotos no Banco de Mídias</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Nome/Nome do Álbum</label>
                                    <select
                                        value={bankAlbum}
                                        onChange={e => setBankAlbum(e.target.value)}
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm"
                                    >
                                        <option value="Geral">Álbum Geral</option>
                                        <option value="Brasileirão">Álbum Brasileirão</option>
                                        <option value="Europeus">Álbum Europeus</option>
                                        <option value="Seleções">Álbum Seleções</option>
                                        <option value="Retrô">Álbum Retrô</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Link de Imagem (URL carregado)</label>
                                    <input value={bankImageUrl} onChange={e => setBankImageUrl(e.target.value)} placeholder="Aparecerá automaticamente após upload" style={input} />
                                </div>
                            </div>

                            <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                <label className="block text-xs text-gray-400 font-bold mb-2">Fazer Upload de Imagem de Catálogo (2000x2000px recomendado)</label>
                                <ImageUploader 
                                    onUploadSuccess={(url) => {
                                        setBankImageUrl(url);
                                    }} 
                                    currentImageUrl={bankImageUrl}
                                    onRemoveImage={() => setBankImageUrl('')}
                                />
                            </div>

                            <button type="button" onClick={handleAddBankImage} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 w-full">
                                <Plus size={16} /> ADICIONAR IMAGEM AO BANCO DE FOTOS
                            </button>
                        </div>

                        {/* Image Gallery Filters */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedAlbumFilter}
                                        onChange={e => setSelectedAlbumFilter(e.target.value)}
                                        className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs focus:outline-none"
                                    >
                                        <option value="Todos">Todos os Álbuns</option>
                                        <option value="Geral">Álbum Geral</option>
                                        <option value="Brasileirão">Álbum Brasileirão</option>
                                        <option value="Europeus">Álbum Europeus</option>
                                        <option value="Seleções">Álbum Seleções</option>
                                        <option value="Retrô">Álbum Retrô</option>
                                    </select>
                                    
                                    <select
                                        value={imageCols}
                                        onChange={e => setImageCols(e.target.value as any)}
                                        className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs focus:outline-none"
                                    >
                                        <option value="2">2 Colunas</option>
                                        <option value="3">3 Colunas</option>
                                        <option value="4">4 Colunas</option>
                                    </select>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        value={imageSearch}
                                        onChange={e => setImageSearch(e.target.value)}
                                        placeholder="Buscar por nome de foto..."
                                        className="pl-9 bg-slate-800 text-white rounded-lg border border-white/10 p-2 w-full text-xs focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Image Catalog Grid */}
                            <div className={`grid grid-cols-1 md:grid-cols-${imageCols} gap-4`}>
                                {(localConfig.imagensBanco?.lista || [])
                                    .filter(img => selectedAlbumFilter === 'Todos' || img.album === selectedAlbumFilter)
                                    .filter(img => img.nome.toLowerCase().includes(imageSearch.toLowerCase()))
                                    .map(img => (
                                        <div key={img.id} className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden group relative">
                                            <div className="aspect-square bg-white flex items-center justify-center p-2 relative overflow-hidden">
                                                <img src={img.url} className="max-w-full max-h-full object-contain" alt="" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                                    <a href={img.url} download={img.nome} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white text-slate-900 rounded-full hover:scale-105 transition shadow">
                                                        <Download size={18} />
                                                    </a>
                                                    <button onClick={() => handleRemoveBankImage(img.id)} className="p-2.5 bg-red-600 text-white rounded-full hover:scale-105 transition shadow">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-xs font-bold text-white truncate" title={img.nome}>{img.nome}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[9px] uppercase bg-purple-900/50 text-purple-300 font-bold px-1.5 py-0.5 rounded">
                                                        {img.album}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500">
                                                        {new Date(img.created_at).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {(localConfig.imagensBanco?.lista || []).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-10 md:col-span-4">Nenhuma imagem registrada no banco de mídias.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 9. Calculadora ROI Tab */}
                {aba === 'calculadora' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">
                                🧮 Calculadora de Gastos com Anúncios (Tráfego) x Vendas Obtidas (ROI)
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Faturamento Vendas (R$)</label>
                                    <input 
                                        type="number" 
                                        value={calcVal1} 
                                        onChange={e => setCalcVal1(e.target.value)} 
                                        placeholder="Ex: 5000" 
                                        style={input} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Gasto com Anúncios/Tráfego (R$)</label>
                                    <input 
                                        type="number" 
                                        value={calcVal2} 
                                        onChange={e => setCalcVal2(e.target.value)} 
                                        placeholder="Ex: 1000" 
                                        style={input} 
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {(['+', '-', '*', '/'] as const).map(op => (
                                    <button
                                        key={op}
                                        type="button"
                                        onClick={() => setCalcOp(op)}
                                        className={`flex-1 p-3 rounded-lg font-bold border text-sm transition ${
                                            calcOp === op ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'
                                        }`}
                                    >
                                        {op === '+' && 'Somar (+)'}
                                        {op === '-' && 'Diminuir (-)'}
                                        {op === '*' && 'Multiplicar (*)'}
                                        {op === '/' && 'Dividir (/)'}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button type="button" onClick={handleCalculator} className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3.5 rounded-xl border-none cursor-pointer w-full text-sm">
                                    CALCULAR METRICAS
                                </button>
                                <button type="button" onClick={() => { setCalcVal1(''); setCalcVal2(''); setCalcResult(null); }} className="bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold p-3.5 rounded-xl border border-white/5 cursor-pointer w-full text-sm">
                                    LIMPAR
                                </button>
                            </div>

                            {calcResult !== null && (
                                <div className="bg-slate-950/80 border border-white/5 p-5 rounded-xl mt-4 space-y-2">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Resultado da Operação:</p>
                                    <h3 className="text-xl font-extrabold text-white">
                                        {calcResult.toFixed(2).replace('.', ',')}
                                    </h3>
                                    
                                    {/* Financial Context Helper */}
                                    <div className="border-t border-white/5 pt-2 text-xs text-gray-400">
                                        {calcOp === '-' && (
                                            <span>Lucro Líquido Estimado de Campanhas de Tráfego.</span>
                                        )}
                                        {calcOp === '/' && (
                                            <span>ROAS (Retorno sobre Investimento em Anúncios) / CAC (Custo de Aquisição de Clientes).</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 10. Integracoes Tab */}
                {aba === 'integracoes' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2">🔗 Integrações e Scripts de Rastreamento Detectados</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-950/40 rounded-xl border border-white/5">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Meta Pixel (Facebook Ads)</h4>
                                        <p className="text-xs text-gray-400 mt-1">Status: Conectado e Monitorando Checkout & Conversão via CAPI.</p>
                                    </div>
                                    <span className="text-[10px] bg-green-900/50 border border-green-500/20 text-green-300 font-bold px-2 py-1 rounded">ATIVO</span>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-slate-950/40 rounded-xl border border-white/5">
                                    <div>
                                        <h4 className="text-sm font-bold text-white">WhatsApp Conversa 1x1 (X1)</h4>
                                        <p className="text-xs text-gray-400 mt-1">Status: Conectado e Rastreando Cliques com ID personalizado.</p>
                                    </div>
                                    <span className="text-[10px] bg-green-900/50 border border-green-500/20 text-green-300 font-bold px-2 py-1 rounded">ATIVO</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '13px 15px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '10px', fontWeight: 900, textAlign: 'left', transition: 'all 0.2s', fontSize: '13px' };
const bAt: React.CSSProperties = { ...bIn, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' };
const th: React.CSSProperties = { padding: '15px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' };
const td: React.CSSProperties = { padding: '15px 20px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const btnV: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '6px', alignItems: 'center', boxShadow: '0 4px 15px rgba(124,58,237,0.35)', fontSize: '11px' };
const btnRef: React.CSSProperties = { padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', transition: 'all 0.2s', fontSize: '11px', alignItems: 'center' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const input: React.CSSProperties = { width: '100%', padding: '12px 14px', marginBottom: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', outline: 'none', transition: 'all 0.2s', fontSize: '13px' };
const btnSave: React.CSSProperties = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.35)', fontSize: '14px' };