import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStoreConfig, PriceRule, FloatingStory, CatalogImage, Coupon } from '../contexts/StoreConfigContext';
import { allProducts } from '../data/products';
import { getTeamPlayers, getTeamsWithPlayers } from '../data/teamPlayers';
import {
    LayoutDashboard, ShoppingCart, PlusCircle, Eye, RefreshCw, Trash2,
    LogOut, Sliders, Activity, Calculator, Shield, Camera, Sparkles,
    Play, Plus, Download, Search, Check, Edit2, ExternalLink, Copy, Tag,
    Package, Film, Palette, X, Link2
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

function AnimatedBackground() {
    const moneyItems = Array.from({ length: 30 });
    return (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none", backgroundColor: "#050505" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.15 }}>
                <img src="/gatuno.jpg" alt="Gatuno" style={{ width: "100%", height: "100%", objectFit: "contain", animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "center bottom" }} />
            </div>
            {moneyItems.map((_, i) => {
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 4;
                const randomDuration = 4 + Math.random() * 4;
                const randomScale = 0.5 + Math.random() * 1.5;
                const isDolar = Math.random() > 0.5;
                return (
                    <div key={i} style={{ position: "absolute", left: `${randomLeft}%`, top: "-10%", fontSize: `${24 * randomScale}px`, animation: `moneyRain ${randomDuration}s linear ${randomDelay}s infinite`, opacity: 0.4 }}>
                        {isDolar ? "💵" : "💸"}
                    </div>
                );
            })}
            <style>{`
                @keyframes gatunoExtasia { 0%, 100% { transform: scale(1) translateY(0px) rotate(0deg); } 25% { transform: scale(1.03) translateY(-5px) rotate(-0.5deg); } 50% { transform: scale(1.05) translateY(-10px) rotate(0.5deg); } 75% { transform: scale(1.03) translateY(-5px) rotate(-0.5deg); } }
                @keyframes moneyRain { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { transform: translateY(120vh) rotate(360deg) scale(1.2); opacity: 0; } }
            `}</style>
        </div>
    );
}

type ActiveTab = 'dashboard' | 'vitrine' | 'novo' | 'dinamicos' | 'configuracoes' | 'stories' | 'precos' | 'imagens' | 'calculadora' | 'integracoes' | 'frontend';

export default function Admin() {
    const { config, saveConfig } = useStoreConfig();

    // Auth
    const [authorized, setAuthorized] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Navigation
    const [aba, setAba] = useState<ActiveTab>('dashboard');

    // Data
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]); // Dynamic products from Supabase (not store_config)
    const [metaEvents, setMetaEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Local config copy for editing
    const [localConfig, setLocalConfig] = useState(config);

    // ---------- NEW PRODUCT FORM ----------
    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [productImages, setProductImages] = useState<string[]>(['', '', '', '', '', '']);
    const [categoryProd, setCategoryProd] = useState('europeus');
    const [teamProd, setTeamProd] = useState('Personalizado');
    const [descProd, setDescProd] = useState('');
    const [descVideoProd, setDescVideoProd] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(['P', 'M', 'G', 'GG', 'XGG']);
    const [selectedPlayer, setSelectedPlayer] = useState('');

    // ---------- DYNAMIC PRODUCT FORM ----------
    const [dynNome, setDynNome] = useState('');
    const [dynPreco, setDynPreco] = useState('');
    const [dynImg, setDynImg] = useState('');
    const [dynDesc, setDynDesc] = useState('');
    const [dynLinks, setDynLinks] = useState<Array<{ id: string; nome: string; preco: string; img: string; url: string }>>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ---------- EDIT VITRINE PRODUCT ----------
    const [editingProd, setEditingProd] = useState<string | null>(null);
    const [editNome, setEditNome] = useState('');
    const [editPreco, setEditPreco] = useState('');

    // ---------- PRICE RULES ----------
    const [ruleNome, setRuleNome] = useState('');
    const [ruleDesc, setRuleDesc] = useState('');
    const [ruleEscopo, setRuleEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [ruleCat, setRuleCat] = useState('europeus');
    const [ruleProdId, setRuleProdId] = useState('');
    const [ruleOp, setRuleOp] = useState<'aumentar' | 'diminuir'>('aumentar');
    const [rulePercent, setRulePercent] = useState('10');
    const [simulationOpen, setSimulationOpen] = useState(false);
    const [simulatedProducts, setSimulatedProducts] = useState<any[]>([]);

    // ---------- COUPONS ----------
    const [cupomNome, setCupomNome] = useState('');
    const [cupomCodigo, setCupomCodigo] = useState('');
    const [cupomDesconto, setCupomDesconto] = useState('10');
    const [cupomEscopo, setCupomEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [cupomCat, setCupomCat] = useState('europeus');
    const [cupomProdId, setCupomProdId] = useState('');
    const [cupomValidade, setCupomValidade] = useState('');
    const [cupomDesc, setCupomDesc] = useState('');

    // ---------- STORIES ----------
    const [storyNome, setStoryNome] = useState('');
    const [storyVideoUrl, setStoryVideoUrl] = useState('');
    const [storyTipo, setStoryTipo] = useState<'produto' | 'texto'>('produto');
    const [storyProdId, setStoryProdId] = useState('');
    const [storyText, setStoryText] = useState('');
    const [storyVisib, setStoryVisib] = useState<'global' | 'inicial' | 'categoria' | 'produto'>('global');
    const [storyCategoria, setStoryCategoria] = useState('europeus');
    const [storyPageProdId, setStoryPageProdId] = useState('');
    const [storyUploadingVideo, setStoryUploadingVideo] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // ---------- IMAGES BANK ----------
    const [bankAlbum, setBankAlbum] = useState('Geral');
    const [bankImageUrl, setBankImageUrl] = useState('');
    const [imageSearch, setImageSearch] = useState('');
    const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('Todos');
    const [imageCols, setImageCols] = useState<'2' | '3' | '4'>('4');
    const [newAlbumName, setNewAlbumName] = useState('');

    // ---------- CALCULATOR ----------
    const [calcVal1, setCalcVal1] = useState('');
    const [calcVal2, setCalcVal2] = useState('');
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/'>('-');

    // ---------- SAVE INDICATOR ----------
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

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
        if (config) setLocalConfig(config);
    }, [config]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        const email = USER_EMAIL_MAP[username.trim().toLowerCase()];
        if (!email) { setLoginError('Usuário não encontrado.'); return; }
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) setLoginError('Usuário ou senha incorretos!');
        else setAuthorized(true);
    };

    const handleLogout = async () => { await supabase.auth.signOut(); setAuthorized(false); };

    const buscarPedidos = async () => {
        const { data } = await supabase.from('checkouts').select('*').order('created_at', { ascending: false });
        if (data) setPedidos(data);
    };

    const buscarProdutos = async () => {
        // Only products with real UUIDs (not store_config)
        const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
        if (data) setProdutos(data.filter(p => p.id !== 'store_config'));
    };

    const buscarMetaEvents = async () => {
        try {
            const { data } = await supabase.from('meta_events').select('event_name, created_at').order('created_at', { ascending: false }).limit(1000);
            if (data) setMetaEvents(data);
        } catch (_) {}
    };

    const refreshAll = async () => {
        setLoading(true);
        await Promise.all([buscarPedidos(), buscarProdutos(), buscarMetaEvents()]);
        setLoading(false);
    };

    useEffect(() => {
        if (authorized) refreshAll();
    }, [authorized]);

    // -------- SAVE CONFIG (applies immediately) --------
    const handleSaveConfig = async (newConfig: typeof config) => {
        setSaving(true);
        const ok = await saveConfig(newConfig);
        setSaving(false);
        if (ok) {
            setSaveMsg('✅ Salvo e aplicado imediatamente!');
        } else {
            setSaveMsg('⚠️ Erro ao salvar no banco. Salvo localmente.');
        }
        setTimeout(() => setSaveMsg(''), 3000);
    };

    // -------- AI DESCRIPTION --------
    const handleGenerateAiDescription = (nomeProduto: string, time: string, setter: (v: string) => void) => {
        if (!nomeProduto) { alert('Preencha o Nome da Camisa primeiro!'); return; }
        setAiGenerating(true);
        setTimeout(() => {
            const templates = [
                `Vista o manto sagrado com orgulho! A Camiseta ${nomeProduto} do ${time} é ideal para o torcedor que quer carregar as glórias e a tradição do clube em todos os momentos. Confeccionada com tecido altamente tecnológico que absorve o suor e garante extremo conforto, esta peça traz detalhes bordados em alta definição e o design oficial da temporada 2026. Perfeita para empurrar o time na arquibancada ou esbanjar estilo no dia a dia. Adquira já a sua e sinta a energia do manto!`,
                `A herança histórica e a paixão inabalável se encontram na nova Camiseta ${nomeProduto} do ${time}. Com acabamento premium e modelagem que proporciona ajuste anatômico perfeito ao corpo, ela combina a tradicional cor do clube com grafismos modernos inspirados na garra dos jogadores em campo. O tecido aerodinâmico de secagem rápida garante frescor absoluto do primeiro ao último minuto de jogo. Seja parte da história, garanta a sua agora!`,
                `Desempenho de atleta e elegância de torcedor. A Camiseta ${nomeProduto} ${time} foi desenvolvida para os verdadeiros apaixonados por futebol. Seu design exclusivo celebra a rica história e as vitórias épicas do time. Feita com materiais sustentáveis de alta durabilidade, oferece leveza inigualável e respirabilidade inteligente no dia a dia. Uma edição indispensável para a sua coleção!`
            ];
            setter(templates[Math.floor(Math.random() * templates.length)]);
            setAiGenerating(false);
        }, 1500);
    };

    // -------- PRODUCT CRUD --------
    const cadastrarProduto = async (e: React.FormEvent) => {
        e.preventDefault();
        const precoNumerico = parseFloat(precoProd.replace(',', '.'));
        const mainImg = productImages.find(i => i) || '';
        const allImgs = productImages.filter(i => i);

        const { error } = await supabase.from('produtos').insert([{
            id: crypto.randomUUID(),
            nome: nomeProd,
            preco: precoNumerico,
            imagem_url: mainImg,
            image: mainImg,
            images: JSON.stringify(allImgs),
            category: categoryProd,
            team: teamProd,
            description: descProd + (descVideoProd ? `\n\n[VÍDEO](${descVideoProd})` : ''),
            sizes: selectedSizes
        }]);

        if (!error) {
            alert('✅ Produto cadastrado na vitrine com sucesso!');
            setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setDescProd(''); setDescVideoProd(''); setSelectedPlayer('');
            await buscarProdutos();
            setAba('vitrine');
        } else {
            alert('Erro ao cadastrar: ' + error.message);
        }
    };

    const deletarProduto = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto da vitrine?')) return;
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (error) alert('Erro ao excluir: ' + error.message);
        else { await buscarProdutos(); }
    };

    const salvarEdicaoProduto = async (id: string) => {
        const preco = parseFloat(editPreco.replace(',', '.'));
        const { error } = await supabase.from('produtos').update({ nome: editNome, preco }).eq('id', id);
        if (!error) { setEditingProd(null); await buscarProdutos(); }
        else alert('Erro: ' + error.message);
    };

    // -------- DYNAMIC LINKS --------
    const gerarLinkDinamico = () => {
        if (!dynNome || !dynPreco) { alert('Preencha nome e preço!'); return; }
        const base = window.location.origin;
        const url = `${base}/checkout?nome=${encodeURIComponent(dynNome)}&preco=${encodeURIComponent(dynPreco)}${dynImg ? `&img=${encodeURIComponent(dynImg)}` : ''}`;
        const newLink = { id: crypto.randomUUID(), nome: dynNome, preco: dynPreco, img: dynImg, url };
        setDynLinks(prev => [newLink, ...prev]);
        setDynNome(''); setDynPreco(''); setDynImg(''); setDynDesc('');
    };

    const copiarLink = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // -------- PRICE RULES --------
    const handleAddPriceRule = async () => {
        if (!ruleNome) { alert('Dê um nome para a regra!'); return; }
        const percentage = parseFloat(rulePercent);
        if (isNaN(percentage) || percentage <= 0) { alert('Digite um percentual válido.'); return; }

        const newRule: PriceRule = {
            id: crypto.randomUUID(),
            nome: ruleNome,
            descricao: ruleDesc,
            escopo: ruleEscopo,
            categoria: ruleEscopo === 'categoria' ? ruleCat : undefined,
            produtoId: ruleEscopo === 'produto' ? ruleProdId : undefined,
            operacao: ruleOp,
            percentual: percentage,
            ativa: true,
            criadaEm: new Date().toISOString()
        };

        const updatedConfig = {
            ...localConfig,
            precoGestao: { ...localConfig.precoGestao, regras: [...(localConfig.precoGestao?.regras || []), newRule] }
        };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
        setRuleNome(''); setRuleDesc('');
    };

    const handleToggleRule = async (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).map(r => r.id === id ? { ...r, ativa: !r.ativa } : r);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    const handleRemoveRule = async (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).filter(r => r.id !== id);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    const getSimulatedPrice = (prod: any) => {
        let finalPrice = prod.preco;
        const rules = localConfig.precoGestao?.regras || [];
        rules.forEach(rule => {
            if (!rule.ativa) return;
            let apply = false;
            if (rule.escopo === 'tudo') apply = true;
            else if (rule.escopo === 'categoria' && rule.categoria) apply = prod.category === rule.categoria || (Array.isArray(prod.category) && prod.category.includes(rule.categoria));
            else if (rule.escopo === 'produto' && rule.produtoId) apply = rule.produtoId === prod.id;
            if (apply) {
                const factor = rule.percentual / 100;
                finalPrice = rule.operacao === 'aumentar' ? finalPrice * (1 + factor) : finalPrice * (1 - factor);
            }
        });
        return finalPrice;
    };

    const handleSimulate = () => {
        const allProds = [
            ...allProducts.map(p => ({ id: p.id, nome: p.name, preco: p.priceNum, category: Array.isArray(p.category) ? p.category[0] : p.category, imagem_url: p.image })),
            ...produtos.map(p => ({ id: p.id, nome: p.nome, preco: p.preco, category: p.category, imagem_url: p.imagem_url }))
        ];
        setSimulatedProducts(allProds);
        setSimulationOpen(true);
    };

    // -------- COUPONS --------
    const handleAddCoupon = async () => {
        if (!cupomCodigo || !cupomNome) { alert('Preencha código e nome do cupom!'); return; }
        const newCoupon: Coupon = {
            id: crypto.randomUUID(),
            codigo: cupomCodigo.toUpperCase(),
            nome: cupomNome,
            descricao: cupomDesc,
            desconto: parseFloat(cupomDesconto) || 10,
            escopo: cupomEscopo,
            categoria: cupomEscopo === 'categoria' ? cupomCat : undefined,
            produtoId: cupomEscopo === 'produto' ? cupomProdId : undefined,
            ativo: true,
            dataValidade: cupomValidade || undefined,
            criadoEm: new Date().toISOString()
        };
        const updatedConfig = {
            ...localConfig,
            precoGestao: { ...localConfig.precoGestao, cupons: [...(localConfig.precoGestao?.cupons || []), newCoupon] }
        };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
        setCupomCodigo(''); setCupomNome(''); setCupomDesc(''); setCupomValidade('');
    };

    const handleRemoveCoupon = async (id: string) => {
        const updated = (localConfig.precoGestao?.cupons || []).filter(c => c.id !== id);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    const handleToggleCoupon = async (id: string) => {
        const updated = (localConfig.precoGestao?.cupons || []).map(c => c.id === id ? { ...c, ativo: !c.ativo } : c);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    // -------- STORIES --------
    const handleAddStory = async () => {
        if (!storyNome || !storyVideoUrl) { alert('Nome e URL/arquivo do vídeo são obrigatórios!'); return; }
        const newStory: FloatingStory = {
            id: crypto.randomUUID(),
            nome: storyNome,
            videoUrl: storyVideoUrl,
            tipoViculo: storyTipo,
            produtoId: storyTipo === 'produto' ? storyProdId : undefined,
            textoPromo: storyTipo === 'texto' ? storyText : undefined,
            visibilidade: storyVisib,
            categoriaVisib: storyVisib === 'categoria' ? storyCategoria : undefined,
            produtoPaginaId: storyVisib === 'produto' ? storyPageProdId : undefined
        };
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: [...(localConfig.stories?.lista || []), newStory] } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
        setStoryNome(''); setStoryVideoUrl(''); setStoryText('');
    };

    const handleRemoveStory = async (id: string) => {
        const updated = (localConfig.stories?.lista || []).filter(s => s.id !== id);
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    const handleUploadStoryVideo = async (file: File) => {
        setStoryUploadingVideo(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `stories/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from('camisetas').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('camisetas').getPublicUrl(fileName);
            setStoryVideoUrl(urlData.publicUrl);
        } catch (e: any) {
            alert('Erro ao fazer upload: ' + e.message);
        } finally {
            setStoryUploadingVideo(false);
        }
    };

    // -------- IMAGE BANK --------
    const handleAddBankImage = async () => {
        if (!bankImageUrl) { alert('Faça o upload ou cole a URL primeiro!'); return; }
        const newImage: CatalogImage = {
            id: crypto.randomUUID(),
            album: bankAlbum,
            url: bankImageUrl,
            nome: bankImageUrl.split('/').pop()?.split('?')[0] || 'imagem.jpg',
            tamanho: 'Alta Resolução',
            created_at: new Date().toISOString()
        };
        const updatedConfig = { ...localConfig, imagensBanco: { ...localConfig.imagensBanco, lista: [...(localConfig.imagensBanco?.lista || []), newImage] } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
        setBankImageUrl('');
    };

    const handleRemoveBankImage = async (id: string) => {
        const updated = (localConfig.imagensBanco?.lista || []).filter(i => i.id !== id);
        const updatedConfig = { ...localConfig, imagensBanco: { ...localConfig.imagensBanco, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
    };

    const handleCreateAlbum = async () => {
        if (!newAlbumName.trim()) { alert('Digite o nome do álbum!'); return; }
        const currentAlbuns = localConfig.imagensBanco?.albuns || [];
        if (currentAlbuns.includes(newAlbumName.trim())) { alert('Álbum já existe!'); return; }
        const updatedConfig = { ...localConfig, imagensBanco: { ...localConfig.imagensBanco, albuns: [...currentAlbuns, newAlbumName.trim()] } };
        setLocalConfig(updatedConfig);
        await handleSaveConfig(updatedConfig);
        setBankAlbum(newAlbumName.trim());
        setNewAlbumName('');
    };

    // -------- CALCULATOR --------
    const handleCalculator = () => {
        const v1 = parseFloat(calcVal1); const v2 = parseFloat(calcVal2);
        if (isNaN(v1) || isNaN(v2)) { alert('Digite números válidos!'); return; }
        let res = 0;
        if (calcOp === '+') res = v1 + v2;
        else if (calcOp === '-') res = v1 - v2;
        else if (calcOp === '*') res = v1 * v2;
        else if (v2 === 0) { alert('Divisão por zero!'); return; }
        else res = v1 / v2;
        setCalcResult(res);
    };

    // -------- METRICS --------
    const totalFaturamento = pedidos.reduce((acc, p) => (p.status === 'paid' || p.status === 'approved') ? acc + parseFloat(String(p.valor_total || 0)) : acc, 0);
    const totalLeads = pedidos.length;
    const pedidosPagos = pedidos.filter(p => p.status === 'paid' || p.status === 'approved').length;
    const taxaConversao = totalLeads > 0 ? ((pedidosPagos / totalLeads) * 100).toFixed(1) : '0.0';
    const ticketMedio = pedidosPagos > 0 ? (totalFaturamento / pedidosPagos).toFixed(2) : '0,00';
    const pageViews = metaEvents.filter(e => e.event_name === 'PageView').length;
    const viewContents = metaEvents.filter(e => e.event_name === 'ViewContent').length;
    const initiateCheckouts = metaEvents.filter(e => e.event_name === 'InitiateCheckout').length;

    // All vitrine products: static (from data/products) + dynamic (supabase)
    const allVitrineProducts = [
        ...allProducts.map(p => ({ id: p.id, nome: p.name, preco: p.priceNum, imagem_url: p.image, category: Array.isArray(p.category) ? p.category[0] : p.category, isStatic: true })),
        ...produtos.map(p => ({ ...p, isStatic: false }))
    ];

    const teamPlayersList = getTeamPlayers(teamProd);

    // ==================== LOGIN ====================
    if (authLoading) return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative' }}>
            <AnimatedBackground />
            <span style={{ zIndex: 10, color: '#fff', fontSize: '18px', fontWeight: 900 }}>Verificando credenciais...</span>
        </div>
    );

    if (!authorized) return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedBackground />
            <form onSubmit={handleLogin} style={{ background: 'rgba(10,14,30,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', width: '400px', boxShadow: '0 12px 64px rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '22px' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '14px', borderRadius: '16px', width: 'fit-content', margin: '0 auto 15px', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', fontSize: '32px', lineHeight: 1 }}>🐱</div>
                    <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: 0 }}>MantoSagrado Admin</h2>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>Gestão de Marketing & Vitrine 💸</p>
                </div>
                {loginError && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fc8181', fontSize: '13px', fontWeight: 700 }}>{loginError}</div>}
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="gatuno171" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', fontSize: '16px' }}>
                    {loading ? 'Autenticando...' : 'Acessar Central 🐱'}
                </button>
            </form>
        </div>
    );

    // ==================== MAIN PANEL ====================
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
            <AnimatedBackground />

            {/* Save notification */}
            {saveMsg && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, background: saveMsg.startsWith('✅') ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '13px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
                    {saveMsg}
                </div>
            )}

            {/* SIDEBAR */}
            <aside style={{ width: '260px', background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px', display: 'flex', flexDirection: 'column', zIndex: 10, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
                <div style={{ fontWeight: 900, fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '9px', borderRadius: '10px', fontSize: '18px' }}>🐱</div>
                    MantoSagrado Admin
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {([
                        ['dashboard', <LayoutDashboard size={15} />, 'Dashboard'],
                        ['vitrine', <Package size={15} />, 'Vitrine da Loja'],
                        ['novo', <PlusCircle size={15} />, 'Novo Produto'],
                        ['dinamicos', <Link2 size={15} />, 'Produtos Dinâmicos'],
                        ['configuracoes', <Sliders size={15} />, 'Banners & Widgets'],
                        ['stories', <Play size={15} />, 'Stories Flutuantes'],
                        ['precos', <Activity size={15} />, 'Preços & Cupons'],
                        ['imagens', <Camera size={15} />, 'Banco de Imagens'],
                        ['calculadora', <Calculator size={15} />, 'Calculadora ROI'],
                        ['integracoes', <Shield size={15} />, 'Integrações'],
                        ['frontend', <Palette size={15} />, 'Editar Frontend'],
                    ] as [ActiveTab, React.ReactNode, string][]).map(([tab, icon, label]) => (
                        <button key={tab} onClick={() => setAba(tab)} style={aba === tab ? bAt : bIn}>
                            {icon} {label}
                        </button>
                    ))}
                </nav>

                <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 900, display: 'flex', gap: '10px', padding: '10px', cursor: 'pointer', fontSize: '13px', alignItems: 'center', marginTop: '12px' }}>
                    <LogOut size={16} /> Sair do Painel
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{ flex: 1, padding: '36px', zIndex: 10, overflowY: 'auto', maxHeight: '100vh' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                        {aba === 'dashboard' && '📊 Dashboard de Vendas'}
                        {aba === 'vitrine' && '🏪 Vitrine da Loja'}
                        {aba === 'novo' && '➕ Novo Produto'}
                        {aba === 'dinamicos' && '🔗 Produtos Dinâmicos'}
                        {aba === 'configuracoes' && '⚙️ Banners & Widgets'}
                        {aba === 'stories' && '📱 Stories Flutuantes'}
                        {aba === 'precos' && '💰 Preços & Cupons'}
                        {aba === 'imagens' && '🖼️ Banco de Imagens'}
                        {aba === 'calculadora' && '🧮 Calculadora ROI'}
                        {aba === 'integracoes' && '🔗 Integrações'}
                        {aba === 'frontend' && '🎨 Editar Frontend'}
                    </h1>
                    <button onClick={refreshAll} style={btnRef}>
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> ATUALIZAR
                    </button>
                </div>

                {/* ==================== DASHBOARD ==================== */}
                {aba === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                ['💰 Faturamento', `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, 'text-green-400'],
                                ['📥 Leads (Checkout)', String(totalLeads), 'text-blue-400'],
                                ['✅ Vendas Pagas', String(pedidosPagos), 'text-purple-400'],
                                ['📈 Conversão', `${taxaConversao}%`, 'text-amber-400'],
                                ['👁️ PageViews', String(pageViews), 'text-cyan-400'],
                                ['🛍️ ViewContent', String(viewContents), 'text-pink-400'],
                                ['🛒 Init.Checkout', String(initiateCheckouts), 'text-orange-400'],
                                ['💳 Ticket Médio', `R$ ${ticketMedio.replace('.', ',')}`, 'text-emerald-400'],
                            ].map(([label, value, color]) => (
                                <div key={label} className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                    <h3 className={`text-xl font-black mt-2 ${color}`}>{value}</h3>
                                </div>
                            ))}
                        </div>

                        {/* Conversion Funnel */}
                        <div className="bg-slate-900/60 border border-white/5 p-6 rounded-2xl">
                            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Funil de Conversão</h4>
                            <div className="space-y-4">
                                {[
                                    ['Visitas (PageViews)', pageViews, 'bg-cyan-500'],
                                    ['Produto Visto (ViewContent)', viewContents, 'bg-blue-500'],
                                    ['Checkout Aberto', initiateCheckouts, 'bg-yellow-500'],
                                    [`Vendas Pagas (${taxaConversao}%)`, pedidosPagos, 'bg-green-500'],
                                ].map(([label, count, color]) => (
                                    <div key={label as string}>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                            <span>{label as string}</span><span className="font-bold text-white">{count as number}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                            <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pageViews > 0 ? Math.min(100, ((count as number) / pageViews) * 100) : 0}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent orders */}
                        <div style={tabCard}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 900, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.08em' }}>ÚLTIMAS CAPTURAS DO CHECKOUT</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>
                                        <th style={th}>HORÁRIO</th><th style={th}>CLIENTE</th><th style={th}>PRODUTO / VALOR</th><th style={th}>STATUS</th>
                                    </tr></thead>
                                    <tbody>
                                        {pedidos.slice(0, 15).map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={td}><span style={{ fontSize: '11px' }}>{new Date(p.created_at).toLocaleString('pt-BR')}</span></td>
                                                <td style={td}><strong style={{ fontSize: '12px' }}>{p.nome_completo}</strong><br /><span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.telefone}</span></td>
                                                <td style={td}><div style={{ fontWeight: 'bold', fontSize: '12px' }}>{p.produto_nome}</div><div style={{ color: '#38bdf8', fontWeight: 900, fontSize: '12px' }}>R$ {parseFloat(p.valor_total || 0).toFixed(2).replace('.', ',')}</div></td>
                                                <td style={td}><span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 900, background: (p.status === 'paid' || p.status === 'approved') ? '#10b981' : p.status === 'pix_generated' ? '#3b82f6' : '#64748b', color: '#fff' }}>{p.status?.toUpperCase() || 'PENDENTE'}</span></td>
                                            </tr>
                                        ))}
                                        {pedidos.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '30px' }}>Nenhuma captura ainda.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== VITRINE DA LOJA ==================== */}
                {aba === 'vitrine' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-400">{allVitrineProducts.length} produtos na vitrine ({allProducts.length} estáticos + {produtos.length} cadastrados)</p>
                            <button onClick={() => setAba('novo')} style={{ ...btnRef, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', color: '#fff', fontWeight: 900 }}>
                                <Plus size={14} /> Adicionar Produto
                            </button>
                        </div>
                        <div style={tabCard}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>
                                        <th style={th}>FOTO</th><th style={th}>PRODUTO</th><th style={th}>PREÇO</th><th style={th}>TIPO</th><th style={th}>AÇÕES</th>
                                    </tr></thead>
                                    <tbody>
                                        {allVitrineProducts.map(prod => (
                                            <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={td}>
                                                    <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                        <img src={prod.imagem_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                                                    </div>
                                                </td>
                                                <td style={td}>
                                                    {editingProd === prod.id ? (
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <input value={editNome} onChange={e => setEditNome(e.target.value)} style={{ ...input, marginBottom: 0, width: '160px' }} />
                                                            <input value={editPreco} onChange={e => setEditPreco(e.target.value)} style={{ ...input, marginBottom: 0, width: '80px' }} placeholder="Preço" />
                                                        </div>
                                                    ) : (
                                                        <><strong style={{ fontSize: '12px' }}>{prod.nome}</strong><br /><span style={{ fontSize: '11px', color: '#a78bfa' }}>{prod.category}</span></>
                                                    )}
                                                </td>
                                                <td style={{ ...td, fontWeight: 900, color: '#10b981' }}>R$ {(prod.preco || 0).toFixed(2).replace('.', ',')}</td>
                                                <td style={td}>
                                                    <span style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 900, background: prod.isStatic ? 'rgba(59,130,246,0.2)' : 'rgba(124,58,237,0.2)', color: prod.isStatic ? '#93c5fd' : '#c4b5fd' }}>
                                                        {prod.isStatic ? 'ESTÁTICO' : 'DINÂMICO'}
                                                    </span>
                                                </td>
                                                <td style={td}>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        <a href={`/checkout?id=${prod.id}`} target="_blank" style={{ ...btnV, textDecoration: 'none' }}><ExternalLink size={11} /> Checkout</a>
                                                        {!prod.isStatic && (
                                                            <>
                                                                {editingProd === prod.id ? (
                                                                    <button onClick={() => salvarEdicaoProduto(prod.id)} style={{ ...btnV, background: '#10b981', boxShadow: 'none' }}><Check size={11} /> Salvar</button>
                                                                ) : (
                                                                    <button onClick={() => { setEditingProd(prod.id); setEditNome(prod.nome); setEditPreco(String(prod.preco)); }} style={{ ...btnV, background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}><Edit2 size={11} /> Editar</button>
                                                                )}
                                                                <button onClick={() => deletarProduto(prod.id)} style={{ ...btnV, background: '#ef4444', boxShadow: 'none' }}><Trash2 size={11} /> Excluir</button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== NOVO PRODUTO ==================== */}
                {aba === 'novo' && (
                    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl max-w-2xl">
                        <form onSubmit={cadastrarProduto} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Nome da Camisa</label>
                                <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Ex: Brasil Retrô 2002" style={input} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Time/Clube</label>
                                    <select value={teamProd} onChange={e => { setTeamProd(e.target.value); setSelectedPlayer(''); }} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm">
                                        <option value="Personalizado">Personalizado</option>
                                        {getTeamsWithPlayers().map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Preço (R$)</label>
                                    <input value={precoProd} onChange={e => setPrecoProd(e.target.value)} placeholder="139.90" style={input} required />
                                </div>
                            </div>

                            {/* Team Players */}
                            {teamPlayersList.length > 0 && (
                                <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                    <label className="block text-xs font-bold text-white uppercase mb-3">Jogadores Disponíveis — {teamProd}</label>
                                    <div className="flex gap-2 flex-wrap max-h-40 overflow-y-auto">
                                        {teamPlayersList.map(p => (
                                            <button key={p.nome} type="button"
                                                onClick={() => setSelectedPlayer(prev => prev === p.nome + ' #' + p.numero ? '' : p.nome + ' #' + p.numero)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${selectedPlayer === p.nome + ' #' + p.numero ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-300 hover:border-purple-500'}`}>
                                                #{p.numero} {p.nome}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedPlayer && <p className="text-xs text-purple-300 mt-2 font-bold">✓ Selecionado: {selectedPlayer}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Categoria</label>
                                <select value={categoryProd} onChange={e => setCategoryProd(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none">
                                    <option value="seleções">Seleções</option>
                                    <option value="brasileirão">Brasileirão</option>
                                    <option value="retrô">Retrô Histórica</option>
                                    <option value="europeus">Europeus</option>
                                </select>
                            </div>

                            {/* 6 Image Slots */}
                            <div className="border border-white/5 p-5 rounded-xl bg-slate-950/40">
                                <label className="block text-xs font-bold text-white uppercase mb-3">Imagens do Produto (até 6) — Recomendado 2000x2000px</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {productImages.map((url, idx) => (
                                        <div key={idx}>
                                            <p className="text-[10px] text-gray-500 mb-1.5">{idx === 0 ? '⭐ Principal (Vitrine)' : `Foto ${idx + 1}`}</p>
                                            <ImageUploader
                                                onUploadSuccess={u => { const imgs = [...productImages]; imgs[idx] = u; setProductImages(imgs); }}
                                                currentImageUrl={url}
                                                onRemoveImage={() => { const imgs = [...productImages]; imgs[idx] = ''; setProductImages(imgs); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sizes */}
                            <div className="border border-white/5 p-5 rounded-xl bg-slate-950/40 space-y-3">
                                <label className="block text-xs font-bold text-white uppercase">Grade de Tamanhos</label>
                                {[
                                    ['Masculino', 'blue', ['P', 'M', 'G', 'GG', 'XGG', 'G1', 'G2', 'G3']],
                                    ['Feminino', 'pink', ['Fem P', 'Fem M', 'Fem G', 'Fem GG', 'Fem XGG']],
                                    ['Infantil', 'amber', ['2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos', '14 anos']]
                                ].map(([label, color, sizes]) => (
                                    <div key={label as string}>
                                        <span className={`text-[11px] text-${color}-400 font-bold uppercase tracking-wider`}>{label as string}</span>
                                        <div className="flex gap-2 flex-wrap mt-1.5">
                                            {(sizes as string[]).map(size => (
                                                <button key={size} type="button"
                                                    onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${selectedSizes.includes(size) ? `bg-${color}-600 border-${color}-500 text-white` : 'bg-slate-800 border-white/10 text-gray-300 hover:border-white/30'}`}>
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Vídeo para Descrição (URL YouTube/Vimeo)</label>
                                <input value={descVideoProd} onChange={e => setDescVideoProd(e.target.value)} placeholder="https://youtube.com/..." style={input} />
                            </div>

                            <div className="border border-white/5 p-5 rounded-xl bg-slate-950/40 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-white uppercase">Descrição Persuasiva</label>
                                    <button type="button" onClick={() => handleGenerateAiDescription(nomeProd, teamProd, setDescProd)} disabled={aiGenerating}
                                        className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition">
                                        <Sparkles size={13} className={aiGenerating ? 'animate-spin' : ''} />
                                        {aiGenerating ? 'Gerando...' : 'Escrever com IA ✨'}
                                    </button>
                                </div>
                                <textarea value={descProd} onChange={e => setDescProd(e.target.value)} placeholder="Descrição do produto ou use o assistente de IA..." rows={5} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm" required />
                            </div>

                            <button type="submit" style={btnSave}>✅ CADASTRAR PRODUTO NA VITRINE</button>
                        </form>
                    </div>
                )}

                {/* ==================== PRODUTOS DINÂMICOS ==================== */}
                {aba === 'dinamicos' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">🔗 Criar Link Dinâmico de Checkout</h3>
                            <p className="text-xs text-gray-400">Cria um link de pagamento personalizado (pedido especial, atacado, kit, venda direta). <strong className="text-purple-300">Não aparece na vitrine da loja.</strong></p>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Produto/Pedido</label><input value={dynNome} onChange={e => setDynNome(e.target.value)} placeholder="Ex: Kit 3 Camisetas Atacado" style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Preço (R$)</label><input value={dynPreco} onChange={e => setDynPreco(e.target.value)} placeholder="250.00" style={input} /></div>
                            </div>
                            <div><label className="block text-xs text-gray-400 font-bold mb-1">URL da Imagem (opcional)</label><input value={dynImg} onChange={e => setDynImg(e.target.value)} placeholder="https://..." style={input} /></div>
                            <div><label className="block text-xs text-gray-400 font-bold mb-1">Descrição/Observação Interna</label><textarea value={dynDesc} onChange={e => setDynDesc(e.target.value)} rows={2} placeholder="Anotações sobre o pedido..." className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-sm" /></div>
                            <button onClick={gerarLinkDinamico} style={btnSave}>🔗 GERAR LINK DINÂMICO</button>
                        </div>

                        {dynLinks.length > 0 && (
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-3">
                                <h3 className="text-sm font-bold text-white">Links Gerados (sessão atual)</h3>
                                {dynLinks.map(link => (
                                    <div key={link.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-4 rounded-xl gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-white">{link.nome}</div>
                                            <div className="text-green-400 font-black text-sm mt-0.5">R$ {parseFloat(link.preco).toFixed(2).replace('.', ',')}</div>
                                            <div className="text-xs text-gray-500 truncate mt-1">{link.url}</div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => copiarLink(link.id, link.url)} style={{ ...btnV, background: copiedId === link.id ? '#10b981' : 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                                                {copiedId === link.id ? <Check size={11} /> : <Copy size={11} />} {copiedId === link.id ? 'Copiado!' : 'Copiar'}
                                            </button>
                                            <a href={link.url} target="_blank" style={{ ...btnV, textDecoration: 'none' }}><ExternalLink size={11} /></a>
                                            <button onClick={() => setDynLinks(prev => prev.filter(l => l.id !== link.id))} style={{ ...btnV, background: '#ef4444', boxShadow: 'none' }}><Trash2 size={11} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ==================== CONFIGURAÇÕES BANNERS ==================== */}
                {aba === 'configuracoes' && localConfig && (
                    <div className="space-y-6 max-w-4xl">
                        {/* Banner Geolocalizado */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white">📍 Banner Geolocalizado</h3>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs text-gray-400">{localConfig.bannerGeolocalizado?.ativo ? 'Ativo' : 'Inativo'}</span>
                                    <input type="checkbox" checked={localConfig.bannerGeolocalizado?.ativo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                </label>
                            </div>
                            {localConfig.bannerGeolocalizado?.ativo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Cor de Fundo</label>
                                        <div className="flex gap-3 items-center">
                                            <input type="color" value={localConfig.bannerGeolocalizado.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corFundo: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                            <input value={localConfig.bannerGeolocalizado.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corFundo: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-sm font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Cor do Texto</label>
                                        <div className="flex gap-3 items-center">
                                            <input type="color" value={localConfig.bannerGeolocalizado.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corTexto: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                            <input value={localConfig.bannerGeolocalizado.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corTexto: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-sm font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Tamanho da Fonte</label>
                                        <input value={localConfig.bannerGeolocalizado.tamanhoFonte} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, tamanhoFonte: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="14px" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Posição no Site</label>
                                        <select value={localConfig.bannerGeolocalizado.posicao || 'topo_vitrine'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, posicao: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="topo_vitrine">Topo da Vitrine (todos produtos)</option>
                                            <option value="header_abaixo">Abaixo do Header</option>
                                            <option value="acima_botao_comprar">Acima do Botão Comprar</option>
                                            <option value="abaixo_botao_comprar">Abaixo do Botão Comprar</option>
                                            <option value="vitrine_categoria">Topo da Vitrine por Categoria</option>
                                            <option value="popup_modal">Popup Modal (ao entrar na página)</option>
                                            <option value="rodape">Rodapé da Página</option>
                                            <option value="barra_lateral">Barra Lateral Fixa</option>
                                            <option value="acima_checkout">Acima do Formulário de Checkout</option>
                                            <option value="banner_produto">Dentro da Página do Produto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Visibilidade</label>
                                        <select value={localConfig.bannerGeolocalizado.visibilidade || 'global'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, visibilidade: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="global">Toda a Loja</option>
                                            <option value="inicial">Apenas Página Inicial</option>
                                            <option value="categoria">Categoria Específica</option>
                                            <option value="produto">Produto Específico</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Imagem do Banner (URL)</label>
                                        <input value={localConfig.bannerGeolocalizado.imagem} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, imagem: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="URL da imagem (opcional)" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Template do Texto (use {'{cidade}'} e {'{estado}'})</label>
                                        <input value={localConfig.bannerGeolocalizado.textoTemplate} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, textoTemplate: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Banner Topo Marquee */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white">🔥 Banner Topo Rotativo (Marquee — 1920x128px)</h3>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <span className="text-xs text-gray-400">{localConfig.bannerTopo?.ativo ? 'Ativo' : 'Inativo'}</span>
                                    <input type="checkbox" checked={localConfig.bannerTopo?.ativo} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                </label>
                            </div>
                            {localConfig.bannerTopo?.ativo && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-2">Cor de Fundo</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerTopo.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerTopo.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-2">Cor do Texto</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerTopo.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corTexto: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerTopo.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corTexto: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-2">Velocidade (px/s)</label>
                                            <input type="number" value={localConfig.bannerTopo.velocidade} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, velocidade: parseInt(e.target.value) || 30 } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Marquee</label>
                                        <input value={localConfig.bannerTopo.textoMarquee} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, textoMarquee: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Imagem do Banner (URL — 1920x128px, opcional)</label>
                                        <input value={localConfig.bannerTopo.imagem} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, imagem: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="URL de imagem (.jpg, .png, .gif, .webp, .svg)" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Verificado + WhatsApp */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">✅ Selo Verificado da Loja</h3>
                                    <input type="checkbox" checked={localConfig.verificadoLoja?.ativo} onChange={e => setLocalConfig({ ...localConfig, verificadoLoja: { ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                </div>
                                <p className="text-xs text-gray-400">Exibe o badge de loja verificada no site.</p>
                            </div>
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">💬 Botão WhatsApp</h3>
                                    <input type="checkbox" checked={localConfig.whatsapp?.ativo} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                </div>
                                {localConfig.whatsapp?.ativo && (
                                    <>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Número (com DDI)</label>
                                            <input value={localConfig.whatsapp.numero} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, numero: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="5547983174463" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Botão</label>
                                            <input value={localConfig.whatsapp.textoBotao} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, textoBotao: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Mensagem Padrão de Contato</label>
                                            <textarea value={localConfig.whatsapp.mensagensPersonalizadas?.['padrao'] || ''} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, mensagensPersonalizadas: { ...localConfig.whatsapp.mensagensPersonalizadas, padrao: e.target.value } } })} rows={2} placeholder="Olá! Vim pelo site e quero saber mais sobre as camisetas..." className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Pulse Button */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white">💥 Efeito Pulse no Botão Comprar</h3>
                                <input type="checkbox" checked={localConfig.pulseComprar?.ativo} onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                            </div>
                            {localConfig.pulseComprar?.ativo && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Cor do Pulse</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={localConfig.pulseComprar?.cor || '#2563eb'} onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, cor: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade</label>
                                        <select value={localConfig.pulseComprar?.velocidade || 'normal'} onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, velocidade: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="lento">Lento</option>
                                            <option value="normal">Normal</option>
                                            <option value="rapido">Rápido</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Tamanho (escala)</label>
                                        <input value={localConfig.pulseComprar?.tamanho || '1.05'} onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, tamanho: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="1.05" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Formato</label>
                                        <select value={localConfig.pulseComprar?.formato || 'rounded-lg'} onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, formato: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="rounded-none">Quadrado</option>
                                            <option value="rounded-lg">Arredondado</option>
                                            <option value="rounded-xl">Muito Arredondado</option>
                                            <option value="rounded-full">Pílula/Oval</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Countdown Timer */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white">⏱️ Countdown Timer de Urgência</h3>
                                <input type="checkbox" checked={localConfig.countdownTimer?.ativo} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                            </div>
                            {localConfig.countdownTimer?.ativo && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Título</label><input value={localConfig.countdownTimer.titulo} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, titulo: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Duração (horas)</label><input type="number" value={localConfig.countdownTimer.tempoDuracao} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, tempoDuracao: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Cor de Fundo</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={localConfig.countdownTimer.corFundo} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, corFundo: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                            <input value={localConfig.countdownTimer.corFundo} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, corFundo: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Posição</label>
                                        <select value={localConfig.countdownTimer.posicao} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, posicao: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="acima_botao">Acima do Botão Comprar</option>
                                            <option value="abaixo_botao">Abaixo do Botão Comprar</option>
                                            <option value="rodape">Rodapé</option>
                                            <option value="topo">Topo da Página</option>
                                            <option value="canto">Canto Inferior Direito</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2"><label className="block text-xs text-gray-400 font-bold mb-1">Texto</label><input value={localConfig.countdownTimer.texto} onChange={e => setLocalConfig({ ...localConfig, countdownTimer: { ...localConfig.countdownTimer, texto: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                </div>
                            )}
                        </div>

                        {/* Barra de Compra Fixa */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-md font-bold text-white">📌 Barra de Compra Fixa</h3>
                                <input type="checkbox" checked={localConfig.barraCompraFixa?.ativo} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                            </div>
                            {localConfig.barraCompraFixa?.ativo && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-2">Cor do Botão</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={localConfig.barraCompraFixa.corBotao} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, corBotao: e.target.value } })} className="w-12 h-10 border border-white/10 rounded cursor-pointer" />
                                        </div>
                                    </div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Transparência do Fundo (0-1)</label><input value={localConfig.barraCompraFixa.transparenciaFundo} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, transparenciaFundo: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="0.9" /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Arredondamento (px)</label><input value={localConfig.barraCompraFixa.arredondamento} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, arredondamento: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" placeholder="12px" /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Posição</label>
                                        <select value={localConfig.barraCompraFixa.posicao} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, posicao: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="bottom">Rodapé (bottom)</option>
                                            <option value="top">Topo (top)</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Aparece ao Rolar</label>
                                        <select value={localConfig.barraCompraFixa.rolagem} onChange={e => setLocalConfig({ ...localConfig, barraCompraFixa: { ...localConfig.barraCompraFixa, rolagem: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="ambos">Subindo e Descendo</option>
                                            <option value="subir">Apenas Subindo</option>
                                            <option value="descer">Apenas Descendo</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Personalização Camiseta */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">👕 Personalização da Camiseta (Labels/Placeholders)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Label: Nome nas Costas</label><input value={localConfig.personalizacaoCamiseta?.labelNome || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, labelNome: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Placeholder: Nome</label><input value={localConfig.personalizacaoCamiseta?.placeholderNome || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, placeholderNome: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Label: Número</label><input value={localConfig.personalizacaoCamiseta?.labelNumero || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, labelNumero: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Placeholder: Número</label><input value={localConfig.personalizacaoCamiseta?.placeholderNumero || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, placeholderNumero: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Label: Frase</label><input value={localConfig.personalizacaoCamiseta?.labelFrase || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, labelFrase: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Placeholder: Frase</label><input value={localConfig.personalizacaoCamiseta?.placeholderFrase || ''} onChange={e => setLocalConfig({ ...localConfig, personalizacaoCamiseta: { ...localConfig.personalizacaoCamiseta, placeholderFrase: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                            </div>
                        </div>

                        <button onClick={() => handleSaveConfig(localConfig)} disabled={saving} style={btnSave}>
                            {saving ? '⏳ Salvando...' : '💾 SALVAR TODAS AS CONFIGURAÇÕES (APLICA IMEDIATAMENTE)'}
                        </button>
                    </div>
                )}

                {/* ==================== STORIES FLUTUANTES ==================== */}
                {aba === 'stories' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">📱 Adicionar Story Flutuante</h3>

                            <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Story</label><input value={storyNome} onChange={e => setStoryNome(e.target.value)} placeholder="Ex: Promo Flamengo" style={input} /></div>

                            <div>
                                <label className="block text-xs text-gray-400 font-bold mb-2">Vídeo do Story</label>
                                <input value={storyVideoUrl} onChange={e => setStoryVideoUrl(e.target.value)} placeholder="Cole URL do vídeo ou faça upload abaixo" style={{ ...input, marginBottom: '8px' }} />
                                <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                    <label className="block text-xs text-gray-400 font-bold mb-2">Upload de Vídeo do Computador/Mobile</label>
                                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={async e => { if (e.target.files?.[0]) await handleUploadStoryVideo(e.target.files[0]); }} />
                                    <button type="button" onClick={() => videoInputRef.current?.click()} disabled={storyUploadingVideo} className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-4 py-2.5 rounded-lg border border-purple-500/20 text-xs font-bold flex items-center gap-2 transition">
                                        <Film size={13} /> {storyUploadingVideo ? 'Enviando vídeo...' : 'Selecionar Vídeo do Dispositivo'}
                                    </button>
                                    {storyVideoUrl && <p className="text-xs text-green-400 mt-2 truncate">✅ Vídeo: {storyVideoUrl}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Tipo de Vínculo</label>
                                    <select value={storyTipo} onChange={e => setStoryTipo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none">
                                        <option value="produto">Produto da Loja</option>
                                        <option value="texto">Texto Promocional</option>
                                    </select>
                                </div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Visibilidade</label>
                                    <select value={storyVisib} onChange={e => setStoryVisib(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none">
                                        <option value="global">Toda a Loja</option>
                                        <option value="inicial">Apenas Página Inicial</option>
                                        <option value="categoria">Categoria Específica</option>
                                        <option value="produto">Página de Produto Específico</option>
                                    </select>
                                </div>
                            </div>

                            {storyTipo === 'produto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto para exibir no Story</label><input value={storyProdId} onChange={e => setStoryProdId(e.target.value)} placeholder="ID do produto" style={input} /></div>}
                            {storyTipo === 'texto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">Texto Promocional</label><input value={storyText} onChange={e => setStoryText(e.target.value)} placeholder="Ex: Use CAMISA10 e ganhe 10% OFF!" style={input} /></div>}
                            {storyVisib === 'categoria' && (
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label>
                                    <select value={storyCategoria} onChange={e => setStoryCategoria(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none">
                                        <option value="seleções">Seleções</option><option value="brasileirão">Brasileirão</option><option value="retrô">Retrô</option><option value="europeus">Europeus</option>
                                    </select>
                                </div>
                            )}
                            {storyVisib === 'produto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto (página específica)</label><input value={storyPageProdId} onChange={e => setStoryPageProdId(e.target.value)} style={input} /></div>}

                            <button onClick={handleAddStory} disabled={saving} style={btnSave}>📱 ADICIONAR E PUBLICAR STORY</button>
                        </div>

                        {/* Stories List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-white">Stories Ativos ({(localConfig.stories?.lista || []).length})</h3>
                            {(localConfig.stories?.lista || []).map(s => (
                                <div key={s.id} className="flex justify-between items-start bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">{s.nome}</h4>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            <span className="text-[10px] bg-blue-900/50 text-blue-300 font-bold px-2 py-0.5 rounded">Visib: {s.visibilidade}</span>
                                            <span className="text-[10px] bg-purple-900/50 text-purple-300 font-bold px-2 py-0.5 rounded">Vínculo: {s.tipoViculo}</span>
                                        </div>
                                        {s.videoUrl && <p className="text-[10px] text-gray-500 truncate max-w-xs mt-1">{s.videoUrl}</p>}
                                    </div>
                                    <button onClick={() => handleRemoveStory(s.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition ml-3"><Trash2 size={15} /></button>
                                </div>
                            ))}
                            {(localConfig.stories?.lista || []).length === 0 && <p className="text-xs text-gray-400 text-center py-6">Nenhum story configurado.</p>}
                        </div>
                    </div>
                )}

                {/* ==================== PREÇOS & CUPONS ==================== */}
                {aba === 'precos' && (
                    <div className="space-y-6 max-w-3xl">
                        {/* Criar Regra */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">💰 Criar Regra de Preço</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome da Regra *</label><input value={ruleNome} onChange={e => setRuleNome(e.target.value)} placeholder="Ex: Promoção Seleções" style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                    <select value={ruleEscopo} onChange={e => setRuleEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                        <option value="tudo">Todos os Produtos</option>
                                        <option value="categoria">Categoria Específica</option>
                                        <option value="produto">Produto Único (ID)</option>
                                    </select>
                                </div>
                                {ruleEscopo === 'categoria' && (
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label>
                                        <select value={ruleCat} onChange={e => setRuleCat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                            <option value="seleções">Seleções</option><option value="brasileirão">Brasileirão</option><option value="retrô">Retrô</option><option value="europeus">Europeus</option>
                                        </select>
                                    </div>
                                )}
                                {ruleEscopo === 'produto' && (
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto</label><input value={ruleProdId} onChange={e => setRuleProdId(e.target.value)} placeholder="ID do produto" style={input} /></div>
                                )}
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Operação</label>
                                    <select value={ruleOp} onChange={e => setRuleOp(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                        <option value="aumentar">▲ Aumentar %</option>
                                        <option value="diminuir">▼ Diminuir %</option>
                                    </select>
                                </div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Percentual (%)</label><input type="number" value={rulePercent} onChange={e => setRulePercent(e.target.value)} placeholder="10" style={input} /></div>
                                <div className="col-span-2"><label className="block text-xs text-gray-400 font-bold mb-1">Descrição (sobre o que se trata essa oferta)</label><input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} placeholder="Ex: Promoção da copa do mundo — todos os produtos da seleção com desconto" style={input} /></div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleAddPriceRule} disabled={saving} style={{ ...btnSave, flex: 1 }}>
                                    {saving ? '⏳ Salvando...' : '✅ CRIAR REGRA (vale imediatamente)'}
                                </button>
                                <button onClick={handleSimulate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl border-none cursor-pointer text-sm transition flex items-center gap-2">
                                    <Eye size={15} /> SIMULAR
                                </button>
                                {simulationOpen && (
                                    <button onClick={() => { setSimulationOpen(false); setSimulatedProducts([]); }} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl border-none cursor-pointer text-sm transition flex items-center gap-2">
                                        <X size={15} /> Remover Simulação
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Regras Ativas */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-3">
                            <h3 className="text-sm font-bold text-white">Regras Ativas ({(localConfig.precoGestao?.regras || []).length})</h3>
                            {(localConfig.precoGestao?.regras || []).map(r => (
                                <div key={r.id} className="flex justify-between items-start bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">{r.nome}</h4>
                                        {r.descricao && <p className="text-xs text-gray-500 mt-0.5 italic">{r.descricao}</p>}
                                        <p className="text-xs text-gray-400 mt-1">
                                            Escopo: <span className="text-blue-400 font-semibold">{r.escopo === 'tudo' ? 'Toda a Loja' : r.escopo === 'categoria' ? `Categoria: ${r.categoria}` : `Produto ID: ${r.produtoId}`}</span>
                                            {' | '}
                                            <span className={r.operacao === 'aumentar' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{r.operacao === 'aumentar' ? '▲ Aumentar' : '▼ Diminuir'} {r.percentual}%</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                        <button onClick={() => handleToggleRule(r.id)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${r.ativa ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-white/10 text-gray-400'}`}>{r.ativa ? 'Ativa' : 'Pausada'}</button>
                                        <button onClick={() => handleRemoveRule(r.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            {(localConfig.precoGestao?.regras || []).length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhuma regra ativa.</p>}
                        </div>

                        {/* Simulation */}
                        {simulationOpen && simulatedProducts.length > 0 && (
                            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-3">
                                <h3 className="text-sm font-bold text-white">👁️ Simulação de Preços ({simulatedProducts.length} produtos)</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr>
                                            <th style={th}>FOTO</th><th style={th}>PRODUTO</th><th style={th}>ORIGINAL</th><th style={th}>SIMULADO</th><th style={th}>DIFERENÇA</th>
                                        </tr></thead>
                                        <tbody>
                                            {simulatedProducts.map(prod => {
                                                const sim = getSimulatedPrice(prod);
                                                const diff = sim - prod.preco;
                                                return (
                                                    <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                        <td style={td}><img src={prod.imagem_url} className="w-10 h-10 object-contain bg-white rounded" alt="" /></td>
                                                        <td style={td}><div className="font-bold text-xs">{prod.nome}</div><span className="text-[10px] text-gray-400">{prod.category}</span></td>
                                                        <td style={td}>R$ {(prod.preco || 0).toFixed(2).replace('.', ',')}</td>
                                                        <td style={{ ...td, color: diff !== 0 ? (diff > 0 ? '#34d399' : '#f87171') : '#fff', fontWeight: diff !== 0 ? 900 : 400 }}>R$ {sim.toFixed(2).replace('.', ',')}</td>
                                                        <td style={{ ...td, color: diff > 0 ? '#34d399' : diff < 0 ? '#f87171' : '#64748b', fontWeight: 900 }}>{diff > 0 ? `+R$ ${diff.toFixed(2).replace('.', ',')}` : diff < 0 ? `-R$ ${Math.abs(diff).toFixed(2).replace('.', ',')}` : '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Cupons */}
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white flex items-center gap-2"><Tag size={16} /> Criar Cupom de Desconto</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Código do Cupom *</label><input value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value.toUpperCase())} placeholder="PROMO10" style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Cupom *</label><input value={cupomNome} onChange={e => setCupomNome(e.target.value)} placeholder="Promoção Especial" style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Desconto (%)</label><input type="number" value={cupomDesconto} onChange={e => setCupomDesconto(e.target.value)} style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                    <select value={cupomEscopo} onChange={e => setCupomEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                        <option value="tudo">Todos os Produtos</option>
                                        <option value="categoria">Categoria</option>
                                        <option value="produto">Produto Único</option>
                                    </select>
                                </div>
                                {cupomEscopo === 'categoria' && <div><label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label><select value={cupomCat} onChange={e => setCupomCat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none"><option value="seleções">Seleções</option><option value="brasileirão">Brasileirão</option><option value="retrô">Retrô</option><option value="europeus">Europeus</option></select></div>}
                                {cupomEscopo === 'produto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto</label><input value={cupomProdId} onChange={e => setCupomProdId(e.target.value)} style={input} /></div>}
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Validade (opcional)</label><input type="date" value={cupomValidade} onChange={e => setCupomValidade(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none" /></div>
                                <div className="col-span-2"><label className="block text-xs text-gray-400 font-bold mb-1">Descrição do Cupom</label><input value={cupomDesc} onChange={e => setCupomDesc(e.target.value)} placeholder="Ex: Cupom exclusivo para novos clientes da landing page" style={input} /></div>
                            </div>
                            <button onClick={handleAddCoupon} disabled={saving} style={btnSave}>{saving ? '⏳ Salvando...' : '🏷️ CRIAR CUPOM (ativa imediatamente)'}</button>

                            <div className="space-y-2 pt-2">
                                {(localConfig.precoGestao?.cupons || []).map(c => (
                                    <div key={c.id} className="flex justify-between items-start bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-black bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-mono">{c.codigo}</span>
                                                <span className="text-xs font-bold text-white">{c.nome}</span>
                                                <span className="text-xs text-green-400 font-bold">{c.desconto}% OFF</span>
                                            </div>
                                            {c.descricao && <p className="text-xs text-gray-500 mt-1 italic">{c.descricao}</p>}
                                            <p className="text-xs text-gray-400 mt-1">Escopo: {c.escopo === 'tudo' ? 'Toda a loja' : c.escopo === 'categoria' ? c.categoria : `Produto: ${c.produtoId}`}{c.dataValidade ? ` | Válido até: ${new Date(c.dataValidade).toLocaleDateString('pt-BR')}` : ''}</p>
                                        </div>
                                        <div className="flex gap-2 ml-3 flex-shrink-0">
                                            <button onClick={() => handleToggleCoupon(c.id)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${c.ativo ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-slate-800 border-white/10 text-gray-400'}`}>{c.ativo ? 'Ativo' : 'Inativo'}</button>
                                            <button onClick={() => handleRemoveCoupon(c.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                                {(localConfig.precoGestao?.cupons || []).length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum cupom criado.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== BANCO DE IMAGENS ==================== */}
                {aba === 'imagens' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4 max-w-2xl">
                            <h3 className="text-md font-bold text-white">🖼️ Banco de Mídias</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Álbum</label>
                                    <select value={bankAlbum} onChange={e => setBankAlbum(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3.5 focus:outline-none text-sm">
                                        {(localConfig.imagensBanco?.albuns || ['Geral', 'Brasileirão', 'Europeus', 'Seleções', 'Retrô']).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Criar Novo Álbum</label>
                                    <div className="flex gap-2">
                                        <input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nome do álbum" onKeyDown={e => e.key === 'Enter' && handleCreateAlbum()} style={{ ...input, marginBottom: 0, flex: 1 }} />
                                        <button onClick={handleCreateAlbum} className="bg-purple-600 hover:bg-purple-700 text-white px-3 rounded-xl border-none cursor-pointer text-xs font-bold transition flex-shrink-0"><Plus size={14} /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                <label className="block text-xs text-gray-400 font-bold mb-2">Upload de Imagem (2000x2000px recomendado)</label>
                                <ImageUploader onUploadSuccess={u => setBankImageUrl(u)} currentImageUrl={bankImageUrl} onRemoveImage={() => setBankImageUrl('')} />
                                {bankImageUrl && (
                                    <input value={bankImageUrl} onChange={e => setBankImageUrl(e.target.value)} style={{ ...input, marginTop: '8px' }} placeholder="URL (preenchido automaticamente)" />
                                )}
                            </div>
                            <button onClick={handleAddBankImage} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 w-full transition">
                                <Plus size={15} /> ADICIONAR AO BANCO
                            </button>
                        </div>

                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <select value={selectedAlbumFilter} onChange={e => setSelectedAlbumFilter(e.target.value)} className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs focus:outline-none">
                                        <option value="Todos">Todos os Álbuns</option>
                                        {(localConfig.imagensBanco?.albuns || []).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                    <select value={imageCols} onChange={e => setImageCols(e.target.value as any)} className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs focus:outline-none">
                                        <option value="2">2 cols</option><option value="3">3 cols</option><option value="4">4 cols</option>
                                    </select>
                                    <span className="text-xs text-gray-400">{(localConfig.imagensBanco?.lista || []).length} imagens</span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <input value={imageSearch} onChange={e => setImageSearch(e.target.value)} placeholder="Buscar..." className="pl-9 bg-slate-800 text-white rounded-lg border border-white/10 p-2 w-56 text-xs focus:outline-none" />
                                </div>
                            </div>
                            <div className={`grid grid-cols-1 md:grid-cols-${imageCols} gap-4`}>
                                {(localConfig.imagensBanco?.lista || [])
                                    .filter(i => selectedAlbumFilter === 'Todos' || i.album === selectedAlbumFilter)
                                    .filter(i => i.nome.toLowerCase().includes(imageSearch.toLowerCase()))
                                    .map(img => (
                                        <div key={img.id} className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden group relative">
                                            <div className="aspect-square bg-white flex items-center justify-center p-2 relative overflow-hidden">
                                                <img src={img.url} className="max-w-full max-h-full object-contain" alt="" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                                    <a href={img.url} download target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white text-slate-900 rounded-full hover:scale-110 transition shadow"><Download size={16} /></a>
                                                    <button onClick={() => handleRemoveBankImage(img.id)} className="p-2.5 bg-red-600 text-white rounded-full hover:scale-110 transition shadow"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-xs font-bold text-white truncate" title={img.nome}>{img.nome}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[9px] uppercase bg-purple-900/50 text-purple-300 font-bold px-1.5 py-0.5 rounded">{img.album}</span>
                                                    <span className="text-[9px] text-gray-500">{new Date(img.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {(localConfig.imagensBanco?.lista || []).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-10 col-span-4">Nenhuma imagem no banco.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== CALCULADORA ==================== */}
                {aba === 'calculadora' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">🧮 Calculadora de Tráfego & ROI</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Faturamento/Valor 1 (R$)</label><input type="number" value={calcVal1} onChange={e => setCalcVal1(e.target.value)} placeholder="Ex: 5000" style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Gastos com Anúncios/Valor 2 (R$)</label><input type="number" value={calcVal2} onChange={e => setCalcVal2(e.target.value)} placeholder="Ex: 1000" style={input} /></div>
                            </div>
                            <div className="flex gap-2">
                                {(['+', '-', '*', '/'] as const).map(op => (
                                    <button key={op} type="button" onClick={() => setCalcOp(op)} className={`flex-1 p-3 rounded-lg font-bold border text-sm transition ${calcOp === op ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400 hover:border-purple-500'}`}>
                                        {op === '+' ? 'Somar' : op === '-' ? 'Subtrair (Lucro)' : op === '*' ? 'Multiplicar' : 'Dividir (ROAS)'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={handleCalculator} style={{ ...btnSave, flex: 2 }}>CALCULAR</button>
                                <button onClick={() => { setCalcVal1(''); setCalcVal2(''); setCalcResult(null); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold p-3.5 rounded-xl border border-white/5 cursor-pointer text-sm">LIMPAR</button>
                            </div>
                            {calcResult !== null && (
                                <div className="bg-slate-950/80 border border-white/5 p-5 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Resultado:</p>
                                    <h3 className="text-3xl font-extrabold text-green-400 mt-1">R$ {calcResult.toFixed(2).replace('.', ',')}</h3>
                                    <p className="text-xs text-gray-400 mt-2">{calcOp === '-' ? '💰 Lucro Líquido (Faturamento - Gastos com anúncios)' : calcOp === '/' ? '📈 ROAS — Retorno sobre investimento em anúncios' : calcOp === '+' ? 'Soma total dos valores' : 'Produto dos valores'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ==================== INTEGRAÇÕES ==================== */}
                {aba === 'integracoes' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">💳 APIs de Pagamento Ativas</h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-slate-950/40 rounded-xl border border-green-500/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">💳 IronPay — Cartão de Crédito</h4>
                                            <p className="text-xs text-gray-400 mt-1">Parcelamento até 12x. Aprovação instantânea.</p>
                                            <p className="text-xs text-gray-500 mt-1 font-mono">Token: qoVerJe5...7CRz22 (mascarado)</p>
                                            <p className="text-xs text-gray-500">Endpoint: api.ironpayapp.com.br/api/public/v1/transactions</p>
                                        </div>
                                        <span className="text-[10px] bg-green-900/50 border border-green-500/20 text-green-300 font-bold px-2 py-1 rounded flex-shrink-0 ml-3">ATIVO</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-950/40 rounded-xl border border-green-500/20">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">⚡ IronPay — Pix Instantâneo</h4>
                                            <p className="text-xs text-gray-400 mt-1">QR Code gerado em tempo real. Expira em 30min.</p>
                                            <p className="text-xs text-gray-500 mt-1">Webhook: /api/ironpay/webhook (Netlify Functions)</p>
                                            <p className="text-xs text-gray-500">Métodos: Pix e Cartão de Crédito (sem boleto)</p>
                                        </div>
                                        <span className="text-[10px] bg-green-900/50 border border-green-500/20 text-green-300 font-bold px-2 py-1 rounded flex-shrink-0 ml-3">ATIVO</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-4">
                            <h3 className="text-md font-bold text-white">📊 Rastreamento & Analytics</h3>
                            <div className="space-y-3">
                                {[
                                    ['Meta Pixel (Facebook Ads)', '4980340808962720', 'Pixel ID', `PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Contact — ${pageViews} eventos hoje`],
                                    ['Meta CAPI (Conversions API)', 'EAAShZBr3...', 'Access Token', 'Server-side via Netlify Function — deduplicação ativa'],
                                    ['WhatsApp Conversa 1x1', localConfig.whatsapp?.numero || '5547983174463', 'Número', 'Cliques rastreados como evento Contact no Meta Pixel'],
                                    ['Supabase DB', 'kffjkhyhhjpkwzfrcvzh', 'Project ID', `Checkouts: ${totalLeads} | Meta Events: ${metaEvents.length} | Produtos: ${produtos.length}`],
                                ].map(([name, value, label, desc]) => (
                                    <div key={name} className="flex justify-between items-start p-4 bg-slate-950/40 rounded-xl border border-white/5">
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{label}: <span className="font-mono text-gray-300">{value}</span></p>
                                            <p className="text-xs text-gray-400 mt-1">{desc}</p>
                                        </div>
                                        <span className="text-[10px] bg-green-900/50 border border-green-500/20 text-green-300 font-bold px-2 py-1 rounded flex-shrink-0 ml-3">ATIVO</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== FRONTEND EDITOR ==================== */}
                {aba === 'frontend' && localConfig && (
                    <div className="space-y-6 max-w-3xl">
                        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl space-y-5">
                            <h3 className="text-md font-bold text-white">🎨 Personalizar Visual do Site</h3>
                            <p className="text-xs text-gray-400">Edite cores, textos e elementos do frontend. Salve para aplicar imediatamente.</p>

                            {/* Colors */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">🎨 Cores</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ['Cor Principal (Botões/CTA)', 'primaryColor', '#dc2626'],
                                        ['Cor de Destaque (Acento)', 'accentColor', '#fbbf24'],
                                        ['Fundo do Header', 'headerBg', '#0a0a0a'],
                                        ['Texto do Header', 'headerTextColor', '#ffffff'],
                                        ['Fundo do Rodapé', 'footerBg', '#0a0a0a'],
                                        ['Texto do Rodapé', 'footerTextColor', '#ffffff'],
                                        ['Fundo do Hero', 'heroBg', '#0a0a0a'],
                                        ['Cor Secundária', 'secondaryColor', '#0a0a0a'],
                                    ].map(([label, key, defaultVal]) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 font-bold mb-2">{label}</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={(localConfig.frontend as any)?.[key] || defaultVal} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="w-12 h-10 border border-white/10 rounded cursor-pointer flex-shrink-0" />
                                                <input value={(localConfig.frontend as any)?.[key] || defaultVal} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Texts */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">✍️ Textos</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ['Título Principal (Hero)', 'heroTitle', 'MANTO SAGRADO'],
                                        ['Subtítulo do Hero', 'heroSubtitle', 'Camisetas Oficiais'],
                                        ['Texto do Botão CTA', 'heroCta', 'Ver Camisetas'],
                                        ['Copyright do Rodapé', 'footerCopyright', '© 2025 Camisa 10'],
                                    ].map(([label, key, placeholder]) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">{label}</label>
                                            <input value={(localConfig.frontend as any)?.[key] || ''} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-sm" placeholder={placeholder} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Font */}
                            <div>
                                <label className="block text-xs text-gray-400 font-bold mb-1">Família de Fonte</label>
                                <select value={(localConfig.frontend as any)?.fontFamily || 'sans-serif'} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, fontFamily: e.target.value } as any })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none">
                                    <option value="sans-serif">Padrão do Sistema</option>
                                    <option value="'Inter', sans-serif">Inter (Moderna)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Google)</option>
                                    <option value="'Outfit', sans-serif">Outfit (Clean)</option>
                                    <option value="'Poppins', sans-serif">Poppins (Arredondada)</option>
                                    <option value="'Montserrat', sans-serif">Montserrat (Premium)</option>
                                </select>
                            </div>

                            <button onClick={() => handleSaveConfig(localConfig)} disabled={saving} style={btnSave}>
                                {saving ? '⏳ Salvando...' : '💾 SALVAR E APLICAR NO SITE IMEDIATAMENTE'}
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

// Styles
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', borderRadius: '9px', fontWeight: 800, textAlign: 'left', transition: 'all 0.2s', fontSize: '12px' };
const bAt: React.CSSProperties = { ...bIn, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' };
const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.08em' };
const td: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const btnV: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '5px', alignItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', fontSize: '11px', textDecoration: 'none', whiteSpace: 'nowrap' };
const btnRef: React.CSSProperties = { padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', transition: 'all 0.2s', fontSize: '11px', alignItems: 'center' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const input: React.CSSProperties = { width: '100%', padding: '11px 14px', marginBottom: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, outline: 'none', transition: 'all 0.2s', fontSize: '13px', boxSizing: 'border-box' };
const btnSave: React.CSSProperties = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', fontSize: '14px', transition: 'opacity 0.2s' };