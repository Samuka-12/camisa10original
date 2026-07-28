import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStoreConfig, PriceRule, FloatingStory, CatalogImage, Coupon } from '../contexts/StoreConfigContext';
import { allProducts } from '../data/products';
import { getTeamPlayers, getTeamsWithPlayers } from '../data/teamPlayers';
import {
    LayoutDashboard, ShoppingCart, PlusCircle, Eye, RefreshCw, Trash2,
    LogOut, Sliders, Activity, Calculator, Shield, Camera, Sparkles,
    Play, Plus, Download, Search, Check, Edit2, ExternalLink, Copy, Tag,
    Package, Film, Palette, X, Link2, Menu, Save
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

function AnimatedBackground() {
    const moneyItems = Array.from({ length: 25 });
    return (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none", backgroundColor: "#050505" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.12 }}>
                <img src="/gatuno.jpg" alt="Gatuno" style={{ width: "100%", height: "100%", objectFit: "contain", animation: "gatunoExtasia 4s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "center bottom" }} />
            </div>
            {moneyItems.map((_, i) => {
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 4;
                const randomDuration = 4 + Math.random() * 4;
                const randomScale = 0.5 + Math.random() * 1.5;
                const isDolar = Math.random() > 0.5;
                return (
                    <div key={i} style={{ position: "absolute", left: `${randomLeft}%`, top: "-10%", fontSize: `${24 * randomScale}px`, animation: `moneyRain ${randomDuration}s linear ${randomDelay}s infinite`, opacity: 0.35 }}>
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

    // Navigation & Mobile menu
    const [aba, setAba] = useState<ActiveTab>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Data
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [metaEvents, setMetaEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Local config copy
    const [localConfig, setLocalConfig] = useState(config);

    // NEW PRODUCT FORM
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

    // DYNAMIC PRODUCT FORM
    const [dynNome, setDynNome] = useState('');
    const [dynPreco, setDynPreco] = useState('');
    const [dynImg, setDynImg] = useState('');
    const [dynDesc, setDynDesc] = useState('');
    const [dynLinks, setDynLinks] = useState<Array<{ id: string; nome: string; preco: string; img: string; url: string }>>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // EDIT VITRINE PRODUCT
    const [editingProd, setEditingProd] = useState<string | null>(null);
    const [editNome, setEditNome] = useState('');
    const [editPreco, setEditPreco] = useState('');

    // PRICE RULES
    const [ruleNome, setRuleNome] = useState('');
    const [ruleDesc, setRuleDesc] = useState('');
    const [ruleEscopo, setRuleEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [ruleCat, setRuleCat] = useState('europeus');
    const [ruleProdId, setRuleProdId] = useState('');
    const [ruleOp, setRuleOp] = useState<'aumentar' | 'diminuir'>('aumentar');
    const [rulePercent, setRulePercent] = useState('10');
    const [simulationOpen, setSimulationOpen] = useState(false);
    const [simulatedProducts, setSimulatedProducts] = useState<any[]>([]);

    // COUPONS
    const [cupomNome, setCupomNome] = useState('');
    const [cupomCodigo, setCupomCodigo] = useState('');
    const [cupomDesconto, setCupomDesconto] = useState('10');
    const [cupomEscopo, setCupomEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [cupomCat, setCupomCat] = useState('europeus');
    const [cupomProdId, setCupomProdId] = useState('');
    const [cupomValidade, setCupomValidade] = useState('');
    const [cupomDesc, setCupomDesc] = useState('');

    // STORIES
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

    // IMAGES BANK
    const [bankAlbum, setBankAlbum] = useState('Geral');
    const [bankImageUrl, setBankImageUrl] = useState('');
    const [imageSearch, setImageSearch] = useState('');
    const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('Todos');
    const [imageCols, setImageCols] = useState<'2' | '3' | '4'>('4');
    const [newAlbumName, setNewAlbumName] = useState('');

    // CALCULATOR
    const [calcVal1, setCalcVal1] = useState('');
    const [calcVal2, setCalcVal2] = useState('');
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/'>('-');

    // SAVE FEEDBACK
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

    // -------- SINGLE SAVE ALL BUTTON LOGIC (Persists to Supabase & syncs mobile + desktop) --------
    const handleSaveAll = async (targetConfig = localConfig) => {
        setSaving(true);
        setSaveMsg('');
        const success = await saveConfig(targetConfig);
        setSaving(false);
        if (success) {
            setSaveMsg('✅ TODAS AS ALTERAÇÕES FORAM SALVAS NO BANCO E APLICADAS NO SITE!');
        } else {
            setSaveMsg('⚠️ Erro ao salvar no banco Supabase. Tente novamente.');
        }
        setTimeout(() => setSaveMsg(''), 4500);
    };

    // AI Description
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

    // PRODUCT CRUD
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
            alert('✅ Produto cadastrado com sucesso!');
            setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setDescProd(''); setDescVideoProd(''); setSelectedPlayer('');
            await buscarProdutos();
            setAba('vitrine');
        } else {
            alert('Erro ao cadastrar no banco: ' + error.message);
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

    // DYNAMIC LINKS
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

    // PRICE RULES
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
        await handleSaveAll(updatedConfig);
        setRuleNome(''); setRuleDesc('');
    };

    const handleToggleRule = async (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).map(r => r.id === id ? { ...r, ativa: !r.ativa } : r);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleRemoveRule = async (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).filter(r => r.id !== id);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
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

    // COUPONS
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
        await handleSaveAll(updatedConfig);
        setCupomCodigo(''); setCupomNome(''); setCupomDesc(''); setCupomValidade('');
    };

    const handleRemoveCoupon = async (id: string) => {
        const updated = (localConfig.precoGestao?.cupons || []).filter(c => c.id !== id);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleToggleCoupon = async (id: string) => {
        const updated = (localConfig.precoGestao?.cupons || []).map(c => c.id === id ? { ...c, ativo: !c.ativo } : c);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    // STORIES
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
        await handleSaveAll(updatedConfig);
        setStoryNome(''); setStoryVideoUrl(''); setStoryText('');
    };

    const handleRemoveStory = async (id: string) => {
        const updated = (localConfig.stories?.lista || []).filter(s => s.id !== id);
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
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

    // IMAGE BANK
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
        await handleSaveAll(updatedConfig);
        setBankImageUrl('');
    };

    const handleRemoveBankImage = async (id: string) => {
        const updated = (localConfig.imagensBanco?.lista || []).filter(i => i.id !== id);
        const updatedConfig = { ...localConfig, imagensBanco: { ...localConfig.imagensBanco, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleCreateAlbum = async () => {
        if (!newAlbumName.trim()) { alert('Digite o nome do álbum!'); return; }
        const currentAlbuns = localConfig.imagensBanco?.albuns || [];
        if (currentAlbuns.includes(newAlbumName.trim())) { alert('Álbum já existe!'); return; }
        const updatedConfig = { ...localConfig, imagensBanco: { ...localConfig.imagensBanco, albuns: [...currentAlbuns, newAlbumName.trim()] } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setBankAlbum(newAlbumName.trim());
        setNewAlbumName('');
    };

    // CALCULATOR
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

    // METRICS
    const totalFaturamento = pedidos.reduce((acc, p) => (p.status === 'paid' || p.status === 'approved') ? acc + parseFloat(String(p.valor_total || 0)) : acc, 0);
    const totalLeads = pedidos.length;
    const pedidosPagos = pedidos.filter(p => p.status === 'paid' || p.status === 'approved').length;
    const taxaConversao = totalLeads > 0 ? ((pedidosPagos / totalLeads) * 100).toFixed(1) : '0.0';
    const ticketMedio = pedidosPagos > 0 ? (totalFaturamento / pedidosPagos).toFixed(2) : '0,00';
    const pageViews = metaEvents.filter(e => e.event_name === 'PageView').length;
    const viewContents = metaEvents.filter(e => e.event_name === 'ViewContent').length;
    const initiateCheckouts = metaEvents.filter(e => e.event_name === 'InitiateCheckout').length;

    const allVitrineProducts = [
        ...allProducts.map(p => ({ id: p.id, nome: p.name, preco: p.priceNum, imagem_url: p.image, category: Array.isArray(p.category) ? p.category[0] : p.category, isStatic: true })),
        ...produtos.map(p => ({ ...p, isStatic: false }))
    ];

    const teamPlayersList = getTeamPlayers(teamProd);

    const tabsList: Array<[ActiveTab, React.ReactNode, string]> = [
        ['dashboard', <LayoutDashboard size={16} key="db" />, 'Dashboard'],
        ['vitrine', <Package size={16} key="vit" />, 'Vitrine da Loja'],
        ['novo', <PlusCircle size={16} key="nov" />, 'Novo Produto'],
        ['dinamicos', <Link2 size={16} key="din" />, 'Produtos Dinâmicos'],
        ['configuracoes', <Sliders size={16} key="cfg" />, 'Banners & Widgets'],
        ['stories', <Play size={16} key="st" />, 'Stories Flutuantes'],
        ['precos', <Activity size={16} key="prc" />, 'Preços & Cupons'],
        ['imagens', <Camera size={16} key="img" />, 'Banco de Imagens'],
        ['calculadora', <Calculator size={16} key="calc" />, 'Calculadora ROI'],
        ['integracoes', <Shield size={16} key="int" />, 'Integrações'],
        ['frontend', <Palette size={16} key="fe" />, 'Editar Frontend'],
    ];

    // LOGIN SCREEN
    if (authLoading) return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative' }}>
            <AnimatedBackground />
            <span style={{ zIndex: 10, color: '#fff', fontSize: '16px', fontWeight: 900 }}>Verificando credenciais...</span>
        </div>
    );

    if (!authorized) return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <AnimatedBackground />
            <form onSubmit={handleLogin} style={{ background: 'rgba(10,14,30,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '28px 24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '380px', boxShadow: '0 12px 64px rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', padding: '12px', borderRadius: '14px', width: 'fit-content', margin: '0 auto 12px', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', fontSize: '28px', lineHeight: 1 }}>🐱</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>MantoSagrado Admin</h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Painel Mobile & Desktop 💸</p>
                </div>
                {loginError && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fc8181', fontSize: '12px', fontWeight: 700 }}>{loginError}</div>}
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>Usuário</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="gatuno171" style={input} required />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>Senha</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" style={input} required />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', fontSize: '15px' }}>
                    {loading ? 'Autenticando...' : 'Acessar Central 🐱'}
                </button>
            </form>
        </div>
    );

    // MAIN ADMIN INTERFACE (Responsive Mobile & Desktop)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'sans-serif', position: 'relative' }}>
            <AnimatedBackground />

            {/* Notification Toast */}
            {saveMsg && (
                <div style={{ position: 'fixed', top: '12px', right: '12px', left: '12px', smLeft: 'auto', zIndex: 200, background: saveMsg.startsWith('✅') ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)', color: '#fff', padding: '12px 18px', borderRadius: '12px', fontWeight: 900, fontSize: '12px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                    {saveMsg}
                </div>
            )}

            {/* MOBILE TOP HEADER */}
            <header className="md:hidden flex items-center justify-between p-4 bg-slate-950/90 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
                <div className="flex items-center gap-2 font-black text-sm text-white">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-1.5 rounded-lg text-lg">🐱</div>
                    MantoSagrado Admin
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleSaveAll()} disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow">
                        <Save size={13} /> {saving ? 'Salvando...' : 'SALVAR BANCO'}
                    </button>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-800 border border-white/10 rounded-lg text-white">
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* MOBILE MENU MODAL / OVERLAY */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-slate-950/95 backdrop-blur-xl p-5 pt-20 flex flex-col justify-between overflow-y-auto">
                    <nav className="space-y-1">
                        {tabsList.map(([tab, icon, label]) => (
                            <button
                                key={tab}
                                onClick={() => { setAba(tab); setMobileMenuOpen(false); }}
                                className={`w-full text-left p-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition ${aba === tab ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/30 text-white border border-purple-500/40' : 'text-gray-400 hover:text-white'}`}
                            >
                                {icon} {label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-white/10 space-y-3">
                        <button onClick={() => { handleSaveAll(); setMobileMenuOpen(false); }} disabled={saving} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black p-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg">
                            <Save size={16} /> {saving ? 'Salvando...' : '💾 SALVAR TODAS ALTERAÇÕES NO BANCO'}
                        </button>
                        <button onClick={handleLogout} className="w-full text-red-400 font-bold p-3 text-sm flex items-center justify-center gap-2">
                            <LogOut size={16} /> Sair do Painel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-1 min-h-screen">
                {/* DESKTOP SIDEBAR */}
                <aside className="hidden md:flex w-64 bg-slate-900/90 border-r border-white/10 p-5 flex-col z-20 sticky top-0 h-screen overflow-y-auto backdrop-blur-xl">
                    <div className="font-black text-base mb-6 flex items-center gap-2.5 text-white">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-xl text-xl">🐱</div>
                        MantoSagrado Admin
                    </div>

                    <nav className="flex-1 space-y-1">
                        {tabsList.map(([tab, icon, label]) => (
                            <button key={tab} onClick={() => setAba(tab)} style={aba === tab ? bAt : bIn}>
                                {icon} {label}
                            </button>
                        ))}
                    </nav>

                    {/* DESKTOP SAVE ALL BUTTON */}
                    <button
                        onClick={() => handleSaveAll()}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black p-3 rounded-xl cursor-pointer mb-3 shadow-lg transition text-xs flex items-center justify-center gap-2 border border-green-400/30"
                    >
                        <Save size={15} /> {saving ? 'SALVANDO...' : '💾 SALVAR TODAS AS ALTERAÇÕES'}
                    </button>

                    <button onClick={handleLogout} className="border-none bg-none color-red-400 font-bold flex gap-2 p-2.5 cursor-pointer text-xs items-center text-red-400 hover:text-red-300">
                        <LogOut size={15} /> Sair do Painel
                    </button>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 z-10 overflow-y-auto max-w-full">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
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
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={() => handleSaveAll()} disabled={saving} className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow border border-green-400/30">
                                <Save size={14} /> {saving ? 'Salvando...' : 'SALVAR NO BANCO'}
                            </button>
                            <button onClick={refreshAll} style={btnRef} className="flex-shrink-0">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* HORIZONTAL MOBILE SCROLLABLE TAB BAR */}
                    <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
                        {tabsList.map(([tab, icon, label]) => (
                            <button
                                key={tab}
                                onClick={() => setAba(tab)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border transition flex-shrink-0 ${aba === tab ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-900/80 text-gray-400 border-white/10'}`}
                            >
                                {icon} {label}
                            </button>
                        ))}
                    </div>

                    {/* DASHBOARD */}
                    {aba === 'dashboard' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
                                    <div key={label} className="bg-slate-900/60 border border-white/5 p-4 rounded-xl sm:rounded-2xl">
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                                        <h3 className={`text-lg sm:text-xl font-black mt-1.5 ${color}`}>{value}</h3>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-900/60 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl">
                                <h4 className="text-xs sm:text-sm font-bold text-white mb-3 uppercase tracking-wider">Funil de Conversão</h4>
                                <div className="space-y-3">
                                    {[
                                        ['Visitas (PageViews)', pageViews, 'bg-cyan-500'],
                                        ['Produto Visto (ViewContent)', viewContents, 'bg-blue-500'],
                                        ['Checkout Aberto', initiateCheckouts, 'bg-yellow-500'],
                                        [`Vendas Pagas (${taxaConversao}%)`, pedidosPagos, 'bg-green-500'],
                                    ].map(([label, count, color]) => (
                                        <div key={label as string}>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{label as string}</span><span className="font-bold text-white">{count as number}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pageViews > 0 ? Math.min(100, ((count as number) / pageViews) * 100) : 0}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={tabCard}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 900, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.08em' }}>ÚLTIMAS CAPTURAS DO CHECKOUT</div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
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
                                            {pedidos.length === 0 && <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '20px' }}>Nenhuma captura ainda.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VITRINE DA LOJA */}
                    {aba === 'vitrine' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <p className="text-xs sm:text-sm text-gray-400">{allVitrineProducts.length} produtos na vitrine ({allProducts.length} estáticos + {produtos.length} cadastrados)</p>
                                <button onClick={() => setAba('novo')} style={{ ...btnRef, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', border: 'none', color: '#fff', fontWeight: 900 }}>
                                    <Plus size={14} /> Adicionar Produto
                                </button>
                            </div>
                            <div style={tabCard}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead><tr>
                                            <th style={th}>FOTO</th><th style={th}>PRODUTO</th><th style={th}>PREÇO</th><th style={th}>TIPO</th><th style={th}>AÇÕES</th>
                                        </tr></thead>
                                        <tbody>
                                            {allVitrineProducts.map(prod => (
                                                <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={td}>
                                                        <div style={{ width: '44px', height: '44px', background: '#fff', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                            <img src={prod.imagem_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                                                        </div>
                                                    </td>
                                                    <td style={td}>
                                                        {editingProd === prod.id ? (
                                                            <div className="flex gap-2 flex-wrap">
                                                                <input value={editNome} onChange={e => setEditNome(e.target.value)} style={{ ...input, marginBottom: 0, width: '140px' }} />
                                                                <input value={editPreco} onChange={e => setEditPreco(e.target.value)} style={{ ...input, marginBottom: 0, width: '70px' }} placeholder="Preço" />
                                                            </div>
                                                        ) : (
                                                            <><strong style={{ fontSize: '12px' }}>{prod.nome}</strong><br /><span style={{ fontSize: '11px', color: '#a78bfa' }}>{prod.category}</span></>
                                                        )}
                                                    </td>
                                                    <td style={{ ...td, fontWeight: 900, color: '#10b981' }}>R$ {(prod.preco || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td style={td}>
                                                        <span style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 900, background: prod.isStatic ? 'rgba(59,130,246,0.2)' : 'rgba(124,58,237,0.2)', color: prod.isStatic ? '#93c5fd' : '#c4b5fd' }}>
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

                    {/* NOVO PRODUTO */}
                    {aba === 'novo' && (
                        <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl max-w-2xl">
                            <form onSubmit={cadastrarProduto} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome da Camisa</label>
                                    <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Ex: Brasil Retrô 2002" style={input} required />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Time/Clube</label>
                                        <select value={teamProd} onChange={e => { setTeamProd(e.target.value); setSelectedPlayer(''); }} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-sm">
                                            <option value="Personalizado">Personalizado</option>
                                            {getTeamsWithPlayers().map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Preço (R$)</label>
                                        <input value={precoProd} onChange={e => setPrecoProd(e.target.value)} placeholder="139.90" style={input} required />
                                    </div>
                                </div>

                                {teamPlayersList.length > 0 && (
                                    <div className="border border-white/5 p-3.5 rounded-xl bg-slate-950/40">
                                        <label className="block text-xs font-bold text-white uppercase mb-2">Jogadores Disponíveis — {teamProd}</label>
                                        <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto">
                                            {teamPlayersList.map(p => (
                                                <button key={p.nome} type="button"
                                                    onClick={() => setSelectedPlayer(prev => prev === p.nome + ' #' + p.numero ? '' : p.nome + ' #' + p.numero)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${selectedPlayer === p.nome + ' #' + p.numero ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-300'}`}>
                                                    #{p.numero} {p.nome}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedPlayer && <p className="text-xs text-purple-300 mt-2 font-bold">✓ Selecionado: {selectedPlayer}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
                                    <select value={categoryProd} onChange={e => setCategoryProd(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-sm">
                                        <option value="seleções">Seleções</option>
                                        <option value="brasileirão">Brasileirão</option>
                                        <option value="retrô">Retrô Histórica</option>
                                        <option value="europeus">Europeus</option>
                                    </select>
                                </div>

                                {/* 6 Image Slots */}
                                <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40">
                                    <label className="block text-xs font-bold text-white uppercase mb-2">Imagens do Produto (até 6) — 2000x2000px</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {productImages.map((url, idx) => (
                                            <div key={idx}>
                                                <p className="text-[10px] text-gray-500 mb-1">{idx === 0 ? '⭐ Principal' : `Foto ${idx + 1}`}</p>
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
                                <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40 space-y-3">
                                    <label className="block text-xs font-bold text-white uppercase">Grade de Tamanhos</label>
                                    {[
                                        ['Masculino', 'blue', ['P', 'M', 'G', 'GG', 'XGG', 'G1', 'G2', 'G3']],
                                        ['Feminino', 'pink', ['Fem P', 'Fem M', 'Fem G', 'Fem GG', 'Fem XGG']],
                                        ['Infantil', 'amber', ['2 anos', '4 anos', '6 anos', '8 anos', '10 anos', '12 anos', '14 anos']]
                                    ].map(([label, color, sizes]) => (
                                        <div key={label as string}>
                                            <span className={`text-[11px] text-${color}-400 font-bold uppercase`}>{label as string}</span>
                                            <div className="flex gap-1.5 flex-wrap mt-1">
                                                {(sizes as string[]).map(size => (
                                                    <button key={size} type="button"
                                                        onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${selectedSizes.includes(size) ? `bg-${color}-600 border-${color}-500 text-white` : 'bg-slate-800 border-white/10 text-gray-300'}`}>
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vídeo para Descrição (URL YouTube/Vimeo)</label>
                                    <input value={descVideoProd} onChange={e => setDescVideoProd(e.target.value)} placeholder="https://youtube.com/..." style={input} />
                                </div>

                                <div className="border border-white/5 p-4 rounded-xl bg-slate-950/40 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-bold text-white uppercase">Descrição Persuasiva</label>
                                        <button type="button" onClick={() => handleGenerateAiDescription(nomeProd, teamProd, setDescProd)} disabled={aiGenerating}
                                            className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-2.5 py-1 rounded-lg border border-purple-500/30 text-xs font-bold flex items-center gap-1 transition">
                                            <Sparkles size={12} className={aiGenerating ? 'animate-spin' : ''} />
                                            {aiGenerating ? 'Gerando...' : 'IA ✨'}
                                        </button>
                                    </div>
                                    <textarea value={descProd} onChange={e => setDescProd(e.target.value)} placeholder="Descrição do produto ou use o assistente de IA..." rows={4} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-sm" required />
                                </div>

                                <button type="submit" style={btnSave}>CADASTRAR PRODUTO NA VITRINE</button>
                            </form>
                        </div>
                    )}

                    {/* PRODUTOS DINÂMICOS */}
                    {aba === 'dinamicos' && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">🔗 Criar Link Dinâmico de Checkout</h3>
                                <p className="text-xs text-gray-400">Cria um link de pagamento personalizado. <strong className="text-purple-300">Não entra na vitrine da loja.</strong></p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Pedido</label><input value={dynNome} onChange={e => setDynNome(e.target.value)} placeholder="Ex: Kit 3 Camisetas Atacado" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Preço (R$)</label><input value={dynPreco} onChange={e => setDynPreco(e.target.value)} placeholder="250.00" style={input} /></div>
                                </div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">URL da Imagem (opcional)</label><input value={dynImg} onChange={e => setDynImg(e.target.value)} placeholder="https://..." style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Descrição Interna</label><textarea value={dynDesc} onChange={e => setDynDesc(e.target.value)} rows={2} placeholder="Anotações sobre o pedido..." className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-sm" /></div>
                                <button onClick={gerarLinkDinamico} style={btnSave}>🔗 GERAR LINK DINÂMICO</button>
                            </div>

                            {dynLinks.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                    <h3 className="text-xs sm:text-sm font-bold text-white">Links Gerados</h3>
                                    {dynLinks.map(link => (
                                        <div key={link.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/40 border border-white/5 p-3.5 rounded-xl gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-xs sm:text-sm text-white">{link.nome}</div>
                                                <div className="text-green-400 font-black text-xs">R$ {parseFloat(link.preco).toFixed(2).replace('.', ',')}</div>
                                                <div className="text-[10px] text-gray-500 truncate mt-0.5">{link.url}</div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button onClick={() => copiarLink(link.id, link.url)} style={{ ...btnV, background: copiedId === link.id ? '#10b981' : 'rgba(255,255,255,0.1)', boxShadow: 'none' }} className="flex-1 sm:flex-none justify-center">
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

                    {/* CONFIGURAÇÕES BANNERS */}
                    {aba === 'configuracoes' && localConfig && (
                        <div className="space-y-5 max-w-4xl">
                            {/* Banner Geolocalizado */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white">📍 Banner Geolocalizado</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.bannerGeolocalizado?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input type="checkbox" checked={localConfig.bannerGeolocalizado?.ativo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                    </label>
                                </div>
                                {localConfig.bannerGeolocalizado?.ativo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor de Fundo</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerGeolocalizado.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corFundo: e.target.value } })} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerGeolocalizado.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corFundo: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor do Texto</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerGeolocalizado.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corTexto: e.target.value } })} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerGeolocalizado.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, corTexto: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Posição no Site</label>
                                            <select value={localConfig.bannerGeolocalizado.posicao || 'topo_vitrine'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, posicao: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="topo_vitrine">Topo da Vitrine</option>
                                                <option value="header_abaixo">Abaixo do Header</option>
                                                <option value="acima_botao_comprar">Acima do Botão Comprar</option>
                                                <option value="abaixo_botao_comprar">Abaixo do Botão Comprar</option>
                                                <option value="vitrine_categoria">Topo da Vitrine Categoria</option>
                                                <option value="popup_modal">Popup Modal</option>
                                                <option value="rodape">Rodapé</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Visibilidade</label>
                                            <select value={localConfig.bannerGeolocalizado.visibilidade || 'global'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, visibilidade: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="global">Toda a Loja</option>
                                                <option value="inicial">Apenas Página Inicial</option>
                                                <option value="categoria">Categoria Específica</option>
                                                <option value="produto">Produto Específico</option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Template do Texto</label>
                                            <input value={localConfig.bannerGeolocalizado.textoTemplate} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, textoTemplate: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Banner Topo Marquee */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white">🔥 Banner Topo Rotativo (Marquee)</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.bannerTopo?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input type="checkbox" checked={localConfig.bannerTopo?.ativo} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, ativo: e.target.checked } })} className="w-5 h-5 accent-purple-600" />
                                    </label>
                                </div>
                                {localConfig.bannerTopo?.ativo && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-400 font-bold mb-1">Fundo</label>
                                                <input type="color" value={localConfig.bannerTopo.corFundo} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value } })} className="w-full h-9 border border-white/10 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 font-bold mb-1">Texto</label>
                                                <input type="color" value={localConfig.bannerTopo.corTexto} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corTexto: e.target.value } })} className="w-full h-9 border border-white/10 rounded cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade</label>
                                                <input type="number" value={localConfig.bannerTopo.velocidade} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, velocidade: parseInt(e.target.value) || 30 } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto</label>
                                            <input value={localConfig.bannerTopo.textoMarquee} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, textoMarquee: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp + Selo Verificado */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-5 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs sm:text-sm font-bold text-white">✅ Selo Verificado</h3>
                                        <input type="checkbox" checked={localConfig.verificadoLoja?.ativo} onChange={e => setLocalConfig({ ...localConfig, verificadoLoja: { ativo: e.target.checked } })} className="w-4 h-4 accent-purple-600" />
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-5 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs sm:text-sm font-bold text-white">💬 WhatsApp 1x1</h3>
                                        <input type="checkbox" checked={localConfig.whatsapp?.ativo} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, ativo: e.target.checked } })} className="w-4 h-4 accent-purple-600" />
                                    </div>
                                    {localConfig.whatsapp?.ativo && (
                                        <input value={localConfig.whatsapp.numero} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, numero: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs" placeholder="5547983174463" />
                                    )}
                                </div>
                            </div>

                            <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                {saving ? '⏳ Salvando no Banco...' : '💾 SALVAR TODAS AS ALTERAÇÕES NO BANCO'}
                            </button>
                        </div>
                    )}

                    {/* STORIES */}
                    {aba === 'stories' && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">📱 Adicionar Story Flutuante</h3>

                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Story</label><input value={storyNome} onChange={e => setStoryNome(e.target.value)} placeholder="Ex: Promo Flamengo" style={input} /></div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Vídeo do Story</label>
                                    <input value={storyVideoUrl} onChange={e => setStoryVideoUrl(e.target.value)} placeholder="URL do vídeo ou upload abaixo" style={{ ...input, marginBottom: '6px' }} />
                                    <div className="border border-white/5 p-3 rounded-xl bg-slate-950/40">
                                        <label className="block text-xs text-gray-400 font-bold mb-1.5">Upload de Vídeo (Mobile/PC)</label>
                                        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={async e => { if (e.target.files?.[0]) await handleUploadStoryVideo(e.target.files[0]); }} />
                                        <button type="button" onClick={() => videoInputRef.current?.click()} disabled={storyUploadingVideo} className="w-full bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-2 rounded-lg border border-purple-500/20 text-xs font-bold flex items-center justify-center gap-2 transition">
                                            <Film size={13} /> {storyUploadingVideo ? 'Enviando vídeo...' : 'Selecionar Vídeo'}
                                        </button>
                                        {storyVideoUrl && <p className="text-[11px] text-green-400 mt-1.5 truncate">✅ Vídeo carregado</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Vínculo</label>
                                        <select value={storyTipo} onChange={e => setStoryTipo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="produto">Produto da Loja</option>
                                            <option value="texto">Texto Promocional</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Visibilidade</label>
                                        <select value={storyVisib} onChange={e => setStoryVisib(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="global">Toda a Loja</option>
                                            <option value="inicial">Apenas Página Inicial</option>
                                            <option value="categoria">Categoria Específica</option>
                                            <option value="produto">Produto Específico</option>
                                        </select>
                                    </div>
                                </div>

                                {storyTipo === 'produto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto</label><input value={storyProdId} onChange={e => setStoryProdId(e.target.value)} style={input} /></div>}
                                {storyTipo === 'texto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">Texto Promo</label><input value={storyText} onChange={e => setStoryText(e.target.value)} style={input} /></div>}

                                <button onClick={handleAddStory} disabled={saving} style={btnSave}>📱 PUBLICAR STORY</button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-white">Stories Ativos ({(localConfig.stories?.lista || []).length})</h3>
                                {(localConfig.stories?.lista || []).map(s => (
                                    <div key={s.id} className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-3 rounded-xl">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="text-xs font-bold text-white truncate">{s.nome}</h4>
                                            <span className="text-[10px] text-purple-300 font-bold">{s.visibilidade} • {s.tipoViculo}</span>
                                        </div>
                                        <button onClick={() => handleRemoveStory(s.id)} className="bg-red-900/20 border border-red-500/20 hover:bg-red-600 text-red-300 hover:text-white p-2 rounded-lg transition"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PREÇOS & CUPONS */}
                    {aba === 'precos' && (
                        <div className="space-y-5 max-w-3xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">💰 Criar Regra de Preço</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome da Regra *</label><input value={ruleNome} onChange={e => setRuleNome(e.target.value)} placeholder="Ex: Oferta Especial" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                        <select value={ruleEscopo} onChange={e => setRuleEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="tudo">Todos os Produtos</option>
                                            <option value="categoria">Categoria Específica</option>
                                            <option value="produto">Produto Único (ID)</option>
                                        </select>
                                    </div>
                                    {ruleEscopo === 'categoria' && <div><label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label><select value={ruleCat} onChange={e => setRuleCat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs"><option value="seleções">Seleções</option><option value="brasileirão">Brasileirão</option><option value="retrô">Retrô</option><option value="europeus">Europeus</option></select></div>}
                                    {ruleEscopo === 'produto' && <div><label className="block text-xs text-gray-400 font-bold mb-1">ID do Produto</label><input value={ruleProdId} onChange={e => setRuleProdId(e.target.value)} style={input} /></div>}
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Operação</label>
                                        <select value={ruleOp} onChange={e => setRuleOp(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="aumentar">▲ Aumentar %</option>
                                            <option value="diminuir">▼ Diminuir %</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Percentual (%)</label><input type="number" value={rulePercent} onChange={e => setRulePercent(e.target.value)} placeholder="10" style={input} /></div>
                                    <div className="sm:col-span-2"><label className="block text-xs text-gray-400 font-bold mb-1">Descrição</label><input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} placeholder="Detalhes da oferta..." style={input} /></div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={handleAddPriceRule} disabled={saving} style={{ ...btnSave, flex: 1 }}>
                                        {saving ? 'Salvando...' : 'CRIAR REGRA NO BANCO'}
                                    </button>
                                    <button onClick={handleSimulate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1">
                                        <Eye size={13} /> SIMULAR
                                    </button>
                                    {simulationOpen && (
                                        <button onClick={() => setSimulationOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-2 rounded-xl text-xs">
                                            Ocultar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Simulation Table */}
                            {simulationOpen && simulatedProducts.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                                    <h3 className="text-xs font-bold text-white">Simulação ({simulatedProducts.length} itens)</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                                            <thead><tr><th style={th}>PRODUTO</th><th style={th}>ORIGINAL</th><th style={th}>SIMULADO</th><th style={th}>DIF.</th></tr></thead>
                                            <tbody>
                                                {simulatedProducts.map(p => {
                                                    const sim = getSimulatedPrice(p);
                                                    const diff = sim - p.preco;
                                                    return (
                                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                            <td style={td}><div className="font-bold text-xs">{p.nome}</div></td>
                                                            <td style={td}>R$ {(p.preco || 0).toFixed(2).replace('.', ',')}</td>
                                                            <td style={{ ...td, color: diff !== 0 ? (diff > 0 ? '#34d399' : '#f87171') : '#fff', fontWeight: 900 }}>R$ {sim.toFixed(2).replace('.', ',')}</td>
                                                            <td style={{ ...td, color: diff > 0 ? '#34d399' : diff < 0 ? '#f87171' : '#64748b', fontWeight: 900 }}>{diff > 0 ? `+${diff.toFixed(2)}` : diff < 0 ? `-${Math.abs(diff).toFixed(2)}` : '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Regras e Cupons list */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-xs sm:text-sm font-bold text-white">Regras Ativas ({(localConfig.precoGestao?.regras || []).length})</h3>
                                {(localConfig.precoGestao?.regras || []).map(r => (
                                    <div key={r.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                                        <div>
                                            <h4 className="text-xs font-bold text-white">{r.nome}</h4>
                                            <p className="text-[11px] text-gray-400">{r.escopo} • <span className={r.operacao === 'aumentar' ? 'text-green-400' : 'text-red-400'}>{r.operacao} {r.percentual}%</span></p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggleRule(r.id)} className="text-[10px] px-2 py-1 bg-slate-800 rounded font-bold">{r.ativa ? 'Ativa' : 'Pausada'}</button>
                                            <button onClick={() => handleRemoveRule(r.id)} className="p-1.5 bg-red-900/20 text-red-400 rounded"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Cupons */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-xs sm:text-sm font-bold text-white">🏷️ Criar Cupom</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Código</label><input value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value.toUpperCase())} placeholder="PROMO10" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome</label><input value={cupomNome} onChange={e => setCupomNome(e.target.value)} placeholder="Cupom" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Desconto (%)</label><input type="number" value={cupomDesconto} onChange={e => setCupomDesconto(e.target.value)} style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label><select value={cupomEscopo} onChange={e => setCupomEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs"><option value="tudo">Todos</option><option value="categoria">Categoria</option><option value="produto">Produto Único</option></select></div>
                                </div>
                                <button onClick={handleAddCoupon} disabled={saving} style={btnSave}>🏷️ CRIAR CUPOM NO BANCO</button>

                                <div className="space-y-2 pt-1">
                                    {(localConfig.precoGestao?.cupons || []).map(c => (
                                        <div key={c.id} className="flex justify-between items-center bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                                            <div>
                                                <span className="font-mono text-xs font-bold text-yellow-300 bg-yellow-500/20 px-1.5 py-0.5 rounded mr-2">{c.codigo}</span>
                                                <span className="text-xs text-white">{c.desconto}% OFF</span>
                                            </div>
                                            <button onClick={() => handleRemoveCoupon(c.id)} className="p-1.5 bg-red-900/20 text-red-400 rounded"><Trash2 size={13} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BANCO DE IMAGENS */}
                    {aba === 'imagens' && (
                        <div className="space-y-5">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3 max-w-2xl">
                                <h3 className="text-sm font-bold text-white">🖼️ Banco de Mídias</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Álbum</label>
                                        <select value={bankAlbum} onChange={e => setBankAlbum(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-xs">
                                            {(localConfig.imagensBanco?.albuns || ['Geral', 'Brasileirão', 'Europeus', 'Seleções', 'Retrô']).map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Novo Álbum</label>
                                        <div className="flex gap-2">
                                            <input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nome" style={{ ...input, marginBottom: 0, flex: 1 }} />
                                            <button onClick={handleCreateAlbum} className="bg-purple-600 text-white px-3 rounded-xl text-xs font-bold"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="border border-white/5 p-3 rounded-xl bg-slate-950/40">
                                    <ImageUploader onUploadSuccess={u => setBankImageUrl(u)} currentImageUrl={bankImageUrl} onRemoveImage={() => setBankImageUrl('')} />
                                    {bankImageUrl && <input value={bankImageUrl} onChange={e => setBankImageUrl(e.target.value)} style={{ ...input, marginTop: '6px' }} placeholder="URL" />}
                                </div>
                                <button onClick={handleAddBankImage} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 w-full text-xs transition"><Plus size={14} /> ADICIONAR AO BANCO</button>
                            </div>

                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <select value={selectedAlbumFilter} onChange={e => setSelectedAlbumFilter(e.target.value)} className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs focus:outline-none">
                                        <option value="Todos">Todos os Álbuns</option>
                                        {(localConfig.imagensBanco?.albuns || []).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                    <input value={imageSearch} onChange={e => setImageSearch(e.target.value)} placeholder="Buscar..." className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 w-full sm:w-48 text-xs focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {(localConfig.imagensBanco?.lista || []).filter(i => selectedAlbumFilter === 'Todos' || i.album === selectedAlbumFilter).filter(i => i.nome.toLowerCase().includes(imageSearch.toLowerCase())).map(img => (
                                        <div key={img.id} className="bg-slate-950 border border-white/5 rounded-xl overflow-hidden group relative">
                                            <div className="aspect-square bg-white flex items-center justify-center p-1.5 relative overflow-hidden">
                                                <img src={img.url} className="max-w-full max-h-full object-contain" alt="" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                    <a href={img.url} download target="_blank" rel="noopener noreferrer" className="p-2 bg-white text-slate-900 rounded-full"><Download size={14} /></a>
                                                    <button onClick={() => handleRemoveBankImage(img.id)} className="p-2 bg-red-600 text-white rounded-full"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <h4 className="text-[11px] font-bold text-white truncate">{img.nome}</h4>
                                                <span className="text-[9px] uppercase bg-purple-900/50 text-purple-300 font-bold px-1 py-0.5 rounded">{img.album}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CALCULADORA */}
                    {aba === 'calculadora' && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm font-bold text-white">🧮 Calculadora ROI</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Valor 1 (R$)</label><input type="number" value={calcVal1} onChange={e => setCalcVal1(e.target.value)} placeholder="5000" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Valor 2 (R$)</label><input type="number" value={calcVal2} onChange={e => setCalcVal2(e.target.value)} placeholder="1000" style={input} /></div>
                                </div>
                                <div className="flex gap-1.5">
                                    {(['+', '-', '*', '/'] as const).map(op => (
                                        <button key={op} type="button" onClick={() => setCalcOp(op)} className={`flex-1 py-2.5 rounded-lg font-bold border text-xs transition ${calcOp === op ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'}`}>
                                            {op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : '÷'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCalculator} style={{ ...btnSave, flex: 2 }}>CALCULAR</button>
                                    <button onClick={() => { setCalcVal1(''); setCalcVal2(''); setCalcResult(null); }} className="flex-1 bg-slate-800 text-gray-300 font-bold py-3 rounded-xl border border-white/5 text-xs">LIMPAR</button>
                                </div>
                                {calcResult !== null && (
                                    <div className="bg-slate-950/80 border border-white/5 p-4 rounded-xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Resultado:</p>
                                        <h3 className="text-2xl font-black text-green-400 mt-0.5">R$ {calcResult.toFixed(2).replace('.', ',')}</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INTEGRAÇÕES */}
                    {aba === 'integracoes' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">💳 APIs de Pagamento Ativas</h3>
                                <div className="space-y-2">
                                    <div className="p-3.5 bg-slate-950/40 rounded-xl border border-green-500/20 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-white">💳 IronPay — Cartão de Crédito</h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Parcelamento até 12x. Token ativo no backend.</p>
                                        </div>
                                        <span className="text-[9px] bg-green-900/50 text-green-300 font-bold px-2 py-0.5 rounded">ATIVO</span>
                                    </div>
                                    <div className="p-3.5 bg-slate-950/40 rounded-xl border border-green-500/20 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-white">⚡ IronPay — Pix Instantâneo</h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5">QR Code tempo real + Webhook Netlify.</p>
                                        </div>
                                        <span className="text-[9px] bg-green-900/50 text-green-300 font-bold px-2 py-0.5 rounded">ATIVO</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">📊 Rastreamento & Analytics</h3>
                                <div className="space-y-2">
                                    {[
                                        ['Meta Pixel', '4980340808962720', 'PageView, ViewContent, Checkout, Purchase'],
                                        ['Meta CAPI', 'EAAShZBr3...', 'Server-side via Netlify Function'],
                                        ['Supabase DB', 'kffjkhyhhjpkwzfrcvzh', 'Checkouts e StoreConfig sincronizados'],
                                    ].map(([name, value, desc]) => (
                                        <div key={name} className="flex justify-between items-start p-3 bg-slate-950/40 rounded-xl border border-white/5">
                                            <div>
                                                <h4 className="text-xs font-bold text-white">{name}</h4>
                                                <p className="text-[10px] text-gray-400">{desc}</p>
                                            </div>
                                            <span className="text-[9px] bg-green-900/50 text-green-300 font-bold px-1.5 py-0.5 rounded">ATIVO</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FRONTEND EDITOR */}
                    {aba === 'frontend' && localConfig && (
                        <div className="space-y-5 max-w-3xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white">🎨 Personalizar Visual do Site</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        ['Cor Principal (Botões/CTA)', 'primaryColor', '#dc2626'],
                                        ['Cor de Destaque', 'accentColor', '#fbbf24'],
                                        ['Fundo Header', 'headerBg', '#0a0a0a'],
                                        ['Texto Header', 'headerTextColor', '#ffffff'],
                                        ['Fundo Rodapé', 'footerBg', '#0a0a0a'],
                                        ['Texto Rodapé', 'footerTextColor', '#ffffff'],
                                    ].map(([label, key, defaultVal]) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">{label}</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={(localConfig.frontend as any)?.[key] || defaultVal} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={(localConfig.frontend as any)?.[key] || defaultVal} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        ['Título Hero', 'heroTitle', 'MANTO SAGRADO'],
                                        ['Subtítulo Hero', 'heroSubtitle', 'Camisetas Oficiais'],
                                        ['Texto CTA', 'heroCta', 'Ver Camisetas'],
                                        ['Copyright Rodapé', 'footerCopyright', '© 2025 Camisa 10'],
                                    ].map(([label, key, placeholder]) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">{label}</label>
                                            <input value={(localConfig.frontend as any)?.[key] || ''} onChange={e => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, [key]: e.target.value } as any })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" placeholder={placeholder} />
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                    {saving ? '⏳ Salvando no Banco...' : '💾 SALVAR E APLICAR NO SITE IMEDIATAMENTE'}
                                </button>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}

// Styles
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', borderRadius: '9px', fontWeight: 800, textAlign: 'left', transition: 'all 0.2s', fontSize: '12px' };
const bAt: React.CSSProperties = { ...bIn, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.08em' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const btnV: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', fontSize: '11px', textDecoration: 'none', whiteSpace: 'nowrap' };
const btnRef: React.CSSProperties = { padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', transition: 'all 0.2s', fontSize: '11px', alignItems: 'center' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', marginBottom: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, outline: 'none', transition: 'all 0.2s', fontSize: '13px', boxSizing: 'border-box' };
const btnSave: React.CSSProperties = { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)', fontSize: '13px', transition: 'opacity 0.2s' };