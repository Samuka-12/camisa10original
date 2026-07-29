import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    useStoreConfig, PriceRule, FloatingStory, CatalogImage, Coupon,
    VendaRealizada, GastoAnuncio, EstrategiaEscala, DescontoProdutoSpec
} from '../contexts/StoreConfigContext';

const STORE_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

import { allProducts } from '../data/products';
import { getTeamPlayers, getTeamsWithPlayers } from '../data/teamPlayers';
import {
    LayoutDashboard, ShoppingCart, PlusCircle, Eye, RefreshCw, Trash2,
    LogOut, Sliders, Activity, Calculator, Shield, Camera, Sparkles,
    Play, Plus, Download, Search, Check, Edit2, ExternalLink, Copy, Tag,
    Package, Film, Palette, X, Link2, Menu, Save, DollarSign, TrendingUp,
    MessageSquare, Truck, Clock, Percent, ListFilter, CheckCircle, Smartphone
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

function AnimatedBackground() {
    const moneyItems = Array.from({ length: 25 });
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

export default function Admin() {
    const { config, saveConfig } = useStoreConfig();
    const [authorized, setAuthorized] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    type ActiveTab = 'dashboard' | 'vitrine' | 'pedidos' | 'catalogo' | 'novo' | 'configuracoes' | 'stories' | 'precos' | 'imagens' | 'calculadora' | 'integracoes' | 'frontend';
    const [aba, setAba] = useState<ActiveTab>('dashboard');
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [metaEvents, setMetaEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Local config copy synced with global config
    const [localConfig, setLocalConfig] = useState(config);

    useEffect(() => {
        if (config) {
            setLocalConfig(config);
        }
    }, [config]);

    // NEW / EDIT PRODUCT FORM STATE
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
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

    // PRODUCT SPECIFIC DISCOUNT / PROMO SETTINGS
    const [prodDescontoPercent, setProdDescontoPercent] = useState('0');
    const [prodTempoLimitado, setProdTempoLimitado] = useState(false);
    const [prodFreteGratis, setProdFreteGratis] = useState(false);
    const [prodEstadoFreteGratis, setProdEstadoFreteGratis] = useState('');
    const [prodCidadeFreteGratis, setProdCidadeFreteGratis] = useState('');

    // DYNAMIC PRODUCT LINK FORM & EDITING
    const [editingDynId, setEditingDynId] = useState<string | null>(null);
    const [dynNome, setDynNome] = useState('');
    const [dynPreco, setDynPreco] = useState('');
    const [dynImg, setDynImg] = useState('');
    const [dynDesc, setDynDesc] = useState('');
    const [dynLinks, setDynLinks] = useState<Array<{ id: string; nome: string; preco: string; img: string; url: string; desc?: string }>>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // PRICE RULES
    const [ruleNome, setRuleNome] = useState('');
    const [ruleDesc, setRuleDesc] = useState('');
    const [ruleEscopo, setRuleEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [ruleCat, setRuleCat] = useState('europeus');
    const [ruleProdId, setRuleProdId] = useState('');
    const [ruleOp, setRuleOp] = useState<'aumentar' | 'diminuir'>('aumentar');
    const [rulePercent, setRulePercent] = useState('10');
    const [simulationOpen, setSimulationOpen] = useState(false);

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

    // CALCULATOR & PLANILHA DE VENDAS & AD SPEND & ESCALA
    const [calcVal1, setCalcVal1] = useState('');
    const [calcVal2, setCalcVal2] = useState('');
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/'>('-');

    // Planilha de Vendas Form
    const [vendaCliente, setVendaCliente] = useState('');
    const [vendaProduto, setVendaProduto] = useState('');
    const [vendaValor, setVendaValor] = useState('');
    const [vendaOrigem, setVendaOrigem] = useState<'checkout' | 'link_externo'>('checkout');

    // Gastos Anúncios Form
    const [gastoCampanha, setGastoCampanha] = useState('');
    const [gastoConjunto, setGastoConjunto] = useState('');
    const [gastoPlataforma, setGastoPlataforma] = useState<'meta' | 'google' | 'tiktok'>('meta');
    const [gastoValor, setGastoValor] = useState('');

    // Estratégias de Escala Form
    const [escalaTitulo, setEscalaTitulo] = useState('');
    const [escalaDesc, setEscalaDesc] = useState('');
    const [escalaRoas, setEscalaRoas] = useState('');

    // WhatsApp Message Per Product Form
    const [wspSelectedProd, setWspSelectedProd] = useState('');
    const [wspProdMessage, setWspProdMessage] = useState('');

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
        if (data) setProdutos(data.filter(p => p.id !== 'store_config' && p.id !== STORE_CONFIG_ID));
    };

    const buscarMetaEvents = async () => {
        try {
            const { data, error } = await supabase.from('meta_events').select('event_name, created_at').order('created_at', { ascending: false }).limit(1000);
            if (data && !error) setMetaEvents(data);
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

    // -------- GLOBAL SAVE TO SUPABASE & LOCALSTORAGE --------
    const handleSaveAll = async (targetConfig = localConfig) => {
        setSaving(true);
        setSaveMsg('');
        const success = await saveConfig(targetConfig);
        setSaving(false);
        if (success) {
            setSaveMsg('✅ ALTERAÇÕES SALVAS COM SUCESSO NO BANCO DE DADOS E APLICADAS EM TODA A LOJA!');
        } else {
            setSaveMsg('✅ ALTERAÇÕES SALVAS LOCALMENTE E TRANSMITIDAS PARA A LOJA!');
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
        }, 1200);
    };

    // PRODUCT CREATE / EDIT LOGIC
    const handleStartEditProduct = (prod: any) => {
        setEditingProdId(prod.id);
        setNomeProd(prod.nome || prod.name || '');
        setPrecoProd(String(prod.preco || prod.priceNum || ''));
        setCategoryProd(Array.isArray(prod.category) ? prod.category[0] : (prod.category || 'europeus'));
        setTeamProd(prod.team || 'Personalizado');
        setDescProd(prod.description || '');

        let imgs: string[] = ['', '', '', '', '', ''];
        if (prod.images) {
            try {
                const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
                if (Array.isArray(parsed)) {
                    parsed.forEach((img: string, i: number) => { if (i < 6) imgs[i] = img; });
                }
            } catch (_) {
                imgs[0] = prod.imagem_url || prod.image || '';
            }
        } else if (prod.imagem_url || prod.image) {
            imgs[0] = prod.imagem_url || prod.image;
        }
        setProductImages(imgs);
        setSelectedSizes(prod.sizes || ['P', 'M', 'G', 'GG', 'XGG']);

        // Check specific product discount settings
        const spec = (localConfig.precoGestao?.descontosEspecificos || []).find(d => d.produtoId === prod.id);
        if (spec) {
            setProdDescontoPercent(String(spec.descontoPercent || 0));
            setProdTempoLimitado(!!spec.tempoLimitado);
            setProdFreteGratis(!!spec.freteGratis);
            setProdEstadoFreteGratis(spec.estadoFreteGratis || '');
            setProdCidadeFreteGratis(spec.cidadeFreteGratis || '');
        } else {
            setProdDescontoPercent('0');
            setProdTempoLimitado(false);
            setProdFreteGratis(false);
            setProdEstadoFreteGratis('');
            setProdCidadeFreteGratis('');
        }

        setAba('novo');
    };

    const salvarProduto = async (e: React.FormEvent) => {
        e.preventDefault();
        const precoNumerico = parseFloat(precoProd.replace(',', '.'));
        const mainImg = productImages.find(i => i) || '';
        const allImgs = productImages.filter(i => i);
        const prodId = editingProdId || crypto.randomUUID();

        // 1. Save product to Supabase 'produtos' table
        const { error } = await supabase.from('produtos').upsert([{
            id: prodId,
            nome: nomeProd,
            preco: precoNumerico,
            imagem_url: mainImg,
            image: mainImg,
            images: JSON.stringify(allImgs),
            category: categoryProd,
            team: teamProd,
            description: descProd + (descVideoProd ? `\n\n[VÍDEO](${descVideoProd})` : ''),
            sizes: selectedSizes,
            tipo: 'vitrine'
        }], { onConflict: 'id' });

        if (error) {
            console.warn('Fallback local para salvar produto:', error.message);
        }

        // 2. Save specific product discount & offer settings in store_config
        const currentSpecs = localConfig.precoGestao?.descontosEspecificos || [];
        const existingIdx = currentSpecs.findIndex(s => s.produtoId === prodId);
        const newSpec: DescontoProdutoSpec = {
            produtoId: prodId,
            descontoPercent: parseFloat(prodDescontoPercent) || 0,
            tempoLimitado: prodTempoLimitado,
            freteGratis: prodFreteGratis,
            estadoFreteGratis: prodEstadoFreteGratis || undefined,
            cidadeFreteGratis: prodCidadeFreteGratis || undefined
        };

        let updatedSpecs = [...currentSpecs];
        if (existingIdx >= 0) updatedSpecs[existingIdx] = newSpec;
        else updatedSpecs.push(newSpec);

        const updatedConfig = {
            ...localConfig,
            precoGestao: { ...localConfig.precoGestao, descontosEspecificos: updatedSpecs }
        };

        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);

        alert(editingProdId ? '✅ Produto atualizado com sucesso!' : '✅ Produto cadastrado na vitrine!');

        // Reset form
        setEditingProdId(null); setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setDescProd(''); setDescVideoProd(''); setSelectedPlayer('');
        setProdDescontoPercent('0'); setProdTempoLimitado(false); setProdFreteGratis(false); setProdEstadoFreteGratis(''); setProdCidadeFreteGratis('');
        await buscarProdutos();
        setAba('vitrine');
    };

    // PERMANENT PRODUCT REMOVAL — works for both DB and static products
    const removerProdutoPermanente = async (prod: { id: string; nome: string; origem: string }) => {
        if (!confirm(`⚠️ Remover PERMANENTEMENTE "${prod.nome}" da loja?\n\nEste produto será removido da vitrine e das páginas do cliente. Só voltará se você criar ele novamente.`)) return;

        if (prod.origem === 'estatico') {
            // Static product: add to hidden list in config
            const ocultos = [...(localConfig.produtosOcultos || []), prod.id];
            const updatedConfig = { ...localConfig, produtosOcultos: ocultos };
            setLocalConfig(updatedConfig);
            await handleSaveAll(updatedConfig);
        } else {
            // DB product: delete from Supabase
            const { error } = await supabase.from('produtos').delete().eq('id', prod.id);
            if (error) console.warn('Erro ao excluir do Supabase:', error.message);
            await buscarProdutos();
        }
        alert('✅ Produto removido permanentemente da loja!');
    };

    // Legacy deletarProduto used for dynamic links from vitrine
    const deletarProduto = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto da vitrine?')) return;
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (error) console.warn('Erro ao excluir do Supabase:', error.message);
        await buscarProdutos();
    };

    // DYNAMIC LINKS — persist to Supabase with tipo='dinamico'
    const gerarLinkDinamico = async () => {
        if (!dynNome || !dynPreco) { alert('Preencha nome e preço!'); return; }
        const base = window.location.origin;
        const url = `${base}/checkout?nome=${encodeURIComponent(dynNome)}&preco=${encodeURIComponent(dynPreco)}${dynImg ? `&img=${encodeURIComponent(dynImg)}` : ''}`;
        const precoNum = parseFloat(dynPreco.replace(',', '.')) || 0;

        if (editingDynId) {
            // Update in state
            setDynLinks(prev => prev.map(l => l.id === editingDynId ? { id: editingDynId, nome: dynNome, preco: dynPreco, img: dynImg, url, desc: dynDesc } : l));
            // Update in Supabase
            await supabase.from('produtos').update({
                nome: dynNome,
                preco: precoNum,
                imagem_url: dynImg || null,
                image: dynImg || null,
                description: dynDesc || '',
            }).eq('id', editingDynId);
            setEditingDynId(null);
            alert('✅ Link dinâmico atualizado com sucesso!');
        } else {
            const newId = crypto.randomUUID();
            const newLink = { id: newId, nome: dynNome, preco: dynPreco, img: dynImg, url, desc: dynDesc };
            setDynLinks(prev => [newLink, ...prev]);
            // Persist in Supabase
            await supabase.from('produtos').upsert([{
                id: newId,
                nome: dynNome,
                preco: precoNum,
                imagem_url: dynImg || null,
                image: dynImg || null,
                category: 'dinamico',
                tipo: 'dinamico',
                description: dynDesc || '',
                team: 'Link Dinâmico',
                sizes: [],
            }], { onConflict: 'id' });
            alert('✅ Link dinâmico gerado e salvo!');
        }

        setDynNome(''); setDynPreco(''); setDynImg(''); setDynDesc('');
        await buscarProdutos();
    };

    const handleStartEditDynLink = (link: any) => {
        setEditingDynId(link.id);
        setDynNome(link.nome);
        setDynPreco(link.preco);
        setDynImg(link.img || '');
        setDynDesc(link.desc || '');
    };

    const deletarDynLink = async (id: string) => {
        if (!confirm('Remover este link dinâmico?')) return;
        setDynLinks(prev => prev.filter(l => l.id !== id));
        await supabase.from('produtos').delete().eq('id', id);
        await buscarProdutos();
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

    // COUPONS
    const handleAddCoupon = async () => {
        if (!cupomCodigo || !cupomNome) { alert('Código e Nome do cupom são obrigatórios!'); return; }
        const newCoupon: Coupon = {
            id: crypto.randomUUID(),
            codigo: cupomCodigo.toUpperCase().trim(),
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

    const handleRemoveAlbum = async (albumName: string) => {
        if (albumName === 'Geral') { alert('O álbum Geral não pode ser removido.'); return; }
        if (!confirm(`Deseja remover o álbum "${albumName}" e suas imagens?`)) return;
        const currentAlbuns = (localConfig.imagensBanco?.albuns || []).filter(a => a !== albumName);
        const currentLista = (localConfig.imagensBanco?.lista || []).filter(i => i.album !== albumName);
        const updatedConfig = {
            ...localConfig,
            imagensBanco: { albuns: currentAlbuns, lista: currentLista }
        };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setBankAlbum(currentAlbuns[0] || 'Geral');
    };

    // CALCULATOR & PLANILHA DE VENDAS & AD SPEND & ESCALA
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

    const handleAddVendaPlanilha = async () => {
        if (!vendaCliente || !vendaValor) { alert('Preencha o nome do cliente e valor!'); return; }
        const novaVenda: VendaRealizada = {
            id: crypto.randomUUID(),
            cliente: vendaCliente,
            produto: vendaProduto || 'Camiseta Manto Sagrado',
            valor: parseFloat(vendaValor) || 0,
            origem: vendaOrigem,
            data: new Date().toISOString()
        };
        const currentPlanilha = localConfig.calculadoraAds?.vendasPlanilha || [];
        const updatedConfig = {
            ...localConfig,
            calculadoraAds: { ...localConfig.calculadoraAds, vendasPlanilha: [novaVenda, ...currentPlanilha] }
        };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setVendaCliente(''); setVendaProduto(''); setVendaValor('');
    };

    const handleRemoveVendaPlanilha = async (id: string) => {
        const updated = (localConfig.calculadoraAds?.vendasPlanilha || []).filter(v => v.id !== id);
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, vendasPlanilha: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleAddGastoAnuncio = async () => {
        if (!gastoCampanha || !gastoValor) { alert('Preencha nome da campanha e valor!'); return; }
        const novoGasto: GastoAnuncio = {
            id: crypto.randomUUID(),
            campanha: gastoCampanha,
            conjunto: gastoConjunto || 'Geral',
            plataforma: gastoPlataforma,
            valor: parseFloat(gastoValor) || 0,
            data: new Date().toISOString()
        };
        const currentGastos = localConfig.calculadoraAds?.gastosDetalhados || [];
        const updatedConfig = {
            ...localConfig,
            calculadoraAds: { ...localConfig.calculadoraAds, gastosDetalhados: [novoGasto, ...currentGastos] }
        };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setGastoCampanha(''); setGastoConjunto(''); setGastoValor('');
    };

    const handleRemoveGastoAnuncio = async (id: string) => {
        const updated = (localConfig.calculadoraAds?.gastosDetalhados || []).filter(g => g.id !== id);
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, gastosDetalhados: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleAddEstrategiaEscala = async () => {
        if (!escalaTitulo || !escalaDesc) { alert('Preencha título e descrição da estratégia!'); return; }
        const novaEscala: EstrategiaEscala = {
            id: crypto.randomUUID(),
            titulo: escalaTitulo,
            descricao: escalaDesc,
            metaRoas: escalaRoas || undefined,
            criadaEm: new Date().toISOString()
        };
        const currentEscala = localConfig.calculadoraAds?.estrategiasEscala || [];
        const updatedConfig = {
            ...localConfig,
            calculadoraAds: { ...localConfig.calculadoraAds, estrategiasEscala: [novaEscala, ...currentEscala] }
        };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setEscalaTitulo(''); setEscalaDesc(''); setEscalaRoas('');
    };

    const handleRemoveEstrategiaEscala = async (id: string) => {
        const updated = (localConfig.calculadoraAds?.estrategiasEscala || []).filter(e => e.id !== id);
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, estrategiasEscala: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    // Save WhatsApp per product message
    const handleSaveWspProdMessage = async () => {
        if (!wspSelectedProd) { alert('Selecione um produto!'); return; }
        const updatedMsgs = { ...(localConfig.whatsapp?.mensagensPorProduto || {}), [wspSelectedProd]: wspProdMessage };
        const updatedConfig = { ...localConfig, whatsapp: { ...localConfig.whatsapp, mensagensPorProduto: updatedMsgs } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        alert('✅ Mensagem do produto salva!');
    };

    // DASHBOARD RESET FILTER
    const dashResetTime = localConfig.dashboardResetTime ? new Date(localConfig.dashboardResetTime) : null;
    const filteredPedidos = dashResetTime ? pedidos.filter(p => new Date(p.created_at) >= dashResetTime) : pedidos;
    const filteredMetaEvents = dashResetTime ? metaEvents.filter(e => new Date(e.created_at) >= dashResetTime) : metaEvents;

    const handleResetDashboard = async () => {
        if (!confirm('Isso vai zerar o dashboard e começar a contar apenas novas informações a partir de agora. Continuar?')) return;
        const updatedConfig = { ...localConfig, dashboardResetTime: new Date().toISOString() };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        alert('✅ Dashboard zerado! A partir de agora, apenas novos dados serão contados.');
    };

    // DASHBOARD COMPUTED STATS (using filtered data)
    const totalLeads = filteredPedidos.length;
    const pedidosPagosList = filteredPedidos.filter(p => p.status === 'paid' || p.status === 'approved');
    const pedidosPagos = pedidosPagosList.length;
    const totalFaturamento = pedidosPagosList.reduce((acc, p) => acc + (parseFloat(p.valor_total) || 0), 0);
    const taxaConversao = totalLeads > 0 ? ((pedidosPagos / totalLeads) * 100).toFixed(1) : '0.0';
    const ticketMedio = pedidosPagos > 0 ? (totalFaturamento / pedidosPagos).toFixed(2) : '0.00';

    const pageViews = filteredMetaEvents.filter(e => e.event_name === 'PageView').length;
    const viewContents = filteredMetaEvents.filter(e => e.event_name === 'ViewContent').length;
    const initiateCheckouts = filteredMetaEvents.filter(e => e.event_name === 'InitiateCheckout').length;

    // COMBINED STORE PRODUCTS LIST (Static + Supabase — real vitrine products only)
    const produtosOcultos = localConfig.produtosOcultos || [];

    const realDbProducts = produtos.filter(p => {
        if (p.id === 'store_config' || p.id === STORE_CONFIG_ID) return false;
        if (produtosOcultos.includes(p.id)) return false;
        if (p.tipo === 'vitrine') return true;
        // Exclude all dynamic/custom links (price != 90.93, cart images, custom names, etc.)
        if (p.tipo === 'dinamico' || p.is_dynamic === true) return false;
        if (p.nome && (p.nome.startsWith('Camisetas -') || p.nome.toLowerCase().includes('dinamico'))) return false;
        if (p.preco && p.preco !== 90.93 && p.preco !== 90.9) return false;
        if (p.team === 'Personalizado') return false;
        if (p.imagem_url && (p.imagem_url.includes('flaticon') || p.imagem_url.includes('checkout'))) return false;
        if (p.image && (p.image.includes('flaticon') || p.image.includes('checkout'))) return false;
        if (!p.imagem_url && !p.image) return false;
        return false;
    });

    const allVitrineProducts = [
        ...realDbProducts.map(p => ({
            id: p.id,
            nome: p.nome,
            preco: p.preco,
            imagem: p.imagem_url || p.image,
            category: Array.isArray(p.category) ? p.category[0] : (p.category || 'europeus'),
            team: p.team || 'Time',
            origem: 'db'
        })),
        ...allProducts
            .filter(p => !produtosOcultos.includes(p.id))
            .map(p => ({
                id: p.id,
                nome: p.name,
                preco: p.priceNum,
                imagem: p.image,
                category: p.category[0] || 'europeus',
                team: p.team,
                origem: 'estatico'
            }))
    ];

    // Dynamic products list (only dynamic/custom checkout links)
    const dynamicDbProducts = produtos.filter(p => {
        if (p.id === 'store_config' || p.id === STORE_CONFIG_ID) return false;
        if (p.tipo === 'vitrine') return false;
        return true;
    });
    // Merge state dynLinks with DB dynamic products (avoid duplicates)
    const allDynLinks = [
        ...dynLinks,
        ...dynamicDbProducts
            .filter(p => !dynLinks.find(l => l.id === p.id))
            .map(p => ({
                id: p.id,
                nome: p.nome,
                preco: String(p.preco),
                img: p.imagem_url || p.image || '',
                url: p.imagem_url && p.imagem_url.startsWith('http') && p.imagem_url.includes('/checkout?') ? p.imagem_url : `${window.location.origin}/checkout?nome=${encodeURIComponent(p.nome)}&preco=${encodeURIComponent(p.preco)}${(p.imagem_url || p.image) ? `&img=${encodeURIComponent(p.imagem_url || p.image)}` : ''}`,
                desc: p.description || '',
            }))
    ];

    // Filter image bank by album and search
    const bankList = localConfig.imagensBanco?.lista || [];
    const filteredBankImages = bankList.filter(img => {
        const matchAlbum = selectedAlbumFilter === 'Todos' || img.album === selectedAlbumFilter;
        const matchSearch = !imageSearch || img.nome.toLowerCase().includes(imageSearch.toLowerCase()) || img.album.toLowerCase().includes(imageSearch.toLowerCase());
        return matchAlbum && matchSearch;
    });

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <RefreshCw className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
                <AnimatedBackground />
                <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-2">
                            <Shield size={32} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white">PAINEL ADMINISTRATIVO</h1>
                        <p className="text-xs text-gray-400">Camisa 10 Original • Acesso Restrito</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">USUÁRIO</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="gatuno171" style={input} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">SENHA DE ACESSO</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={input} />
                        </div>
                        {loginError && <p className="text-xs font-bold text-red-400 bg-red-950/50 p-2.5 rounded-xl border border-red-500/20">{loginError}</p>}
                        <button type="submit" disabled={loading} style={btnSave}>
                            {loading ? 'Entrando...' : 'ENTRAR NO PAINEL'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const tabsList: Array<[ActiveTab, React.ReactNode, string]> = [
        ['dashboard', <LayoutDashboard size={16} />, 'Dashboard'],
        ['vitrine', <ShoppingCart size={16} />, 'Vitrine da Loja'],
        ['novo', <PlusCircle size={16} />, editingProdId ? 'Editar Produto' : 'Novo Produto'],
        ['dinamicos', <Link2 size={16} />, 'Produtos Dinâmicos'],
        ['configuracoes', <Sliders size={16} />, 'Banners & Widgets'],
        ['stories', <Film size={16} />, 'Stories Flutuantes'],
        ['precos', <Tag size={16} />, 'Preços & Cupons'],
        ['imagens', <Camera size={16} />, 'Banco de Imagens'],
        ['calculadora', <Calculator size={16} />, 'Calculadora ROI & Escala'],
        ['integracoes', <Activity size={16} />, 'Integrações'],
        ['frontend', <Palette size={16} />, 'Editar Frontend'],
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col relative font-sans">
            <AnimatedBackground />

            {/* HEADER ADMIN */}
            <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white rounded-xl bg-slate-900 border border-white/10">
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚽</span>
                        <h1 className="text-sm font-black text-white tracking-wide">CAMISA 10 <span className="text-purple-400">ADMIN</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {saveMsg && (
                        <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                            {saveMsg}
                        </span>
                    )}
                    <a href="/" target="_blank" style={btnV} className="text-xs">
                        <Eye size={14} /> Ver Loja
                    </a>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 bg-slate-900 border border-white/10 rounded-xl">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {saveMsg && (
                <div className="sm:hidden bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold p-2.5 text-center">
                    {saveMsg}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* DESKTOP SIDEBAR */}
                <aside className="hidden md:flex flex-col w-64 bg-slate-950/60 backdrop-blur-xl border-r border-white/10 p-3 space-y-1 overflow-y-auto">
                    <div className="text-[10px] font-black text-gray-500 uppercase px-3 py-2">Navegação Principal</div>
                    {tabsList.map(([tab, icon, label]) => (
                        <button key={tab} onClick={() => setAba(tab)} style={aba === tab ? bAt : bIn}>
                            {icon} <span>{label}</span>
                        </button>
                    ))}
                </aside>

                {/* MOBILE DRAWER MENU */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex">
                        <div className="w-4/5 max-w-xs bg-slate-950 border-r border-white/10 p-4 space-y-2 overflow-y-auto">
                            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-2">
                                <span className="font-black text-sm text-purple-400">MENU ADMIN</span>
                                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 p-1"><X size={20} /></button>
                            </div>
                            {tabsList.map(([tab, icon, label]) => (
                                <button key={tab} onClick={() => { setAba(tab); setMobileMenuOpen(false); }} style={aba === tab ? bAt : bIn}>
                                    {icon} <span>{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* TOP ACTION HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                        <div>
                            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                {aba === 'dashboard' && '📊 Dashboard de Vendas'}
                                {aba === 'vitrine' && '🏪 Vitrine da Loja'}
                                {aba === 'novo' && (editingProdId ? '✏️ Editar Produto Existente' : '➕ Novo Produto')}
                                {aba === 'dinamicos' && '🔗 Produtos Dinâmicos'}
                                {aba === 'configuracoes' && '⚙️ Banners & Widgets'}
                                {aba === 'stories' && '📱 Stories Flutuantes'}
                                {aba === 'precos' && '💰 Preços & Cupons'}
                                {aba === 'imagens' && '🖼️ Banco de Imagens'}
                                {aba === 'calculadora' && '🧮 Calculadora ROI, Planilha & Escala'}
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

                    {/* 1. DASHBOARD */}
                    {aba === 'dashboard' && (
                        <div className="space-y-5">
                            {/* Reset Dashboard */}
                            <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 p-3 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-white">Contagem de estatísticas</p>
                                    <p className="text-[11px] text-gray-500">
                                        {dashResetTime ? `Zerado em: ${dashResetTime.toLocaleString('pt-BR')}` : 'Mostrando dados de todos os tempos'}
                                    </p>
                                </div>
                                <button onClick={handleResetDashboard} className="bg-red-900/60 hover:bg-red-800 text-red-300 font-bold px-3 py-2 rounded-xl text-xs border border-red-500/30 flex items-center gap-1.5">
                                    🔴 ZERAR DASHBOARD
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                {[
                                    ['💰 Faturamento Total', `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, 'text-green-400'],
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

                    {/* 2. VITRINE DA LOJA */}
                    {aba === 'vitrine' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400">Gerencie todos os produtos ativos na loja, edite preços ou remova produtos.</p>
                                <button onClick={() => { setEditingProdId(null); setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setAba('novo'); }} style={btnSave} className="w-auto px-4 py-2 text-xs">
                                    + ADICIONAR PRODUTO
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {allVitrineProducts.map(prod => (
                                    <div key={prod.id} className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                                        <div className="h-44 bg-slate-950 relative overflow-hidden">
                                            {prod.imagem ? (
                                                <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Sem foto</div>
                                            )}
                                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 uppercase">
                                                {prod.team}
                                            </span>
                                        </div>
                                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <h4 className="font-bold text-xs text-white line-clamp-2">{prod.nome}</h4>
                                                <p className="text-green-400 font-black text-sm mt-1">R$ {parseFloat(String(prod.preco)).toFixed(2).replace('.', ',')}</p>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                                <button onClick={() => handleStartEditProduct(prod)} className="flex-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                                                    <Edit2 size={12} /> Editar
                                                </button>
                                                <a href={`/produto/${prod.id}`} target="_blank" className="p-1.5 bg-slate-800 text-gray-300 hover:text-white rounded-lg flex items-center justify-center">
                                                    <ExternalLink size={14} />
                                                </a>
                                                <button
                                                    onClick={() => removerProdutoPermanente(prod)}
                                                    title="Remover permanentemente da loja"
                                                    className="p-1.5 bg-red-900/40 hover:bg-red-700 text-red-300 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. NOVO / EDITAR PRODUTO */}
                    {aba === 'novo' && (
                        <form onSubmit={salvarProduto} className="space-y-6 max-w-4xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Package size={16} /> {editingProdId ? 'Editar Produto Existente' : 'Cadastrar Novo Produto na Vitrine'}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Nome da Camiseta *</label>
                                        <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} required placeholder="Ex: Camiseta Flamengo Home 2026/27" style={input} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Preço Venda (R$) *</label>
                                        <input value={precoProd} onChange={e => setPrecoProd(e.target.value)} required placeholder="90.93" style={input} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Categoria principal</label>
                                        <select value={categoryProd} onChange={e => setCategoryProd(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="europeus">Europeus</option>
                                            <option value="brasileirão">Brasileirão</option>
                                            <option value="seleções">Seleções</option>
                                            <option value="retrô">Retrô</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Time Oficial</label>
                                        <select value={teamProd} onChange={e => setTeamProd(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="Personalizado">Personalizado / Geral</option>
                                            {getTeamsWithPlayers().map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Elenco de Jogadores se time selecionado */}
                                {teamProd !== 'Personalizado' && (
                                    <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl space-y-2">
                                        <label className="block text-xs text-purple-300 font-bold">⚽ Principais Jogadores Oficiais ({teamProd})</label>
                                        <select value={selectedPlayer} onChange={e => { setSelectedPlayer(e.target.value); if (e.target.value) setDescProd(prev => prev + `\n\nJogador Destaque: ${e.target.value}`); }} className="w-full bg-slate-900 text-white rounded-lg border border-white/10 p-2 text-xs">
                                            <option value="">Selecione um jogador do elenco oficial...</option>
                                            {getTeamPlayers(teamProd).map(jp => <option key={jp.nome} value={`${jp.nome} #${jp.numero} (${jp.posicao})`}>{jp.nome} - #{jp.numero} ({jp.posicao})</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Fotos (até 6 imagens) */}
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-2">Fotos do Produto (Upload de até 6 fotos)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                        {[0, 1, 2, 3, 4, 5].map(idx => (
                                            <div key={idx} className="space-y-1">
                                                <ImageUploader value={productImages[idx] || ''} onChange={url => { const updated = [...productImages]; updated[idx] = url; setProductImages(updated); }} />
                                                <span className="text-[9px] text-gray-500 text-center block">Foto {idx + 1} {idx === 0 ? '(Capa)' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Descrição com Inteligência Artificial */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs text-gray-400 font-bold">Descrição Completa do Produto</label>
                                        <button type="button" onClick={() => handleGenerateAiDescription(nomeProd, teamProd, setDescProd)} disabled={aiGenerating} className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1">
                                            <Sparkles size={12} /> {aiGenerating ? 'Gerando com IA...' : 'Gerar com IA'}
                                        </button>
                                    </div>
                                    <textarea value={descProd} onChange={e => setDescProd(e.target.value)} rows={4} placeholder="Escreva os detalhes ou clique em Gerar com IA..." className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-xs" />
                                </div>
                            </div>

                            {/* Configurações Específicas de Desconto / Promoção do Produto */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">🏷️ Promoção & Frete Específico para este Produto</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Desconto Específico (%)</label>
                                        <input type="number" value={prodDescontoPercent} onChange={e => setProdDescontoPercent(e.target.value)} placeholder="0" style={input} />
                                    </div>
                                    <div className="flex items-center gap-2 pt-4">
                                        <input type="checkbox" id="tempoLim" checked={prodTempoLimitado} onChange={e => setProdTempoLimitado(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                                        <label htmlFor="tempoLim" className="text-xs text-gray-300 font-bold cursor-pointer">Oferta por Tempo Limitado</label>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4">
                                        <input type="checkbox" id="freteGratisProd" checked={prodFreteGratis} onChange={e => setProdFreteGratis(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                                        <label htmlFor="freteGratisProd" className="text-xs text-gray-300 font-bold cursor-pointer">Frete Grátis Exclusivo</label>
                                    </div>
                                </div>
                                {prodFreteGratis && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">🚚 Frete Grátis exclusivo para Estado (ex: SC, SP)</label>
                                            <input value={prodEstadoFreteGratis} onChange={e => setProdEstadoFreteGratis(e.target.value)} placeholder="Ex: SC (deixe em branco para todos)" style={input} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">🏙️ Frete Grátis exclusivo para Cidade (opcional)</label>
                                            <input value={prodCidadeFreteGratis} onChange={e => setProdCidadeFreteGratis(e.target.value)} placeholder="Ex: Florianópolis (deixe em branco para todo o estado)" style={input} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" style={btnSave}>
                                {editingProdId ? '💾 ATUALIZAR PRODUTO NA LOJA' : '➕ CADASTRAR PRODUTO NA VITRINE'}
                            </button>
                        </form>
                    )}

                    {/* 4. PRODUTOS DINÂMICOS */}
                    {aba === 'dinamicos' && (
                        <div className="space-y-5 max-w-3xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm sm:text-md font-bold text-white">🔗 {editingDynId ? 'Editar Link Dinâmico' : 'Criar Link Dinâmico de Checkout'}</h3>
                                <p className="text-xs text-gray-400">Cria um link de pagamento personalizado para atacado ou pedidos sob encomenda. <strong className="text-purple-300">Não entra na vitrine pública.</strong></p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Pedido *</label><input value={dynNome} onChange={e => setDynNome(e.target.value)} placeholder="Ex: Kit 3 Camisetas Atacado" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Preço (R$) *</label><input value={dynPreco} onChange={e => setDynPreco(e.target.value)} placeholder="250.00" style={input} /></div>
                                </div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">URL da Imagem (opcional)</label><input value={dynImg} onChange={e => setDynImg(e.target.value)} placeholder="https://..." style={input} /></div>
                                <div><label className="block text-xs text-gray-400 font-bold mb-1">Descrição Interna</label><textarea value={dynDesc} onChange={e => setDynDesc(e.target.value)} rows={2} placeholder="Anotações sobre o pedido..." className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-xs" /></div>
                                <button onClick={gerarLinkDinamico} style={btnSave}>{editingDynId ? '💾 SALVAR ALTERAÇÕES NO LINK' : '🔗 GERAR LINK DINÂMICO'}</button>
                            </div>

                            {allDynLinks.length > 0 && (
                                <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                    <h3 className="text-xs sm:text-sm font-bold text-white">Links Gerados ({allDynLinks.length})</h3>
                                    {allDynLinks.map(link => (
                                        <div key={link.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950/40 border border-white/5 p-3.5 rounded-xl gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-xs sm:text-sm text-white">{link.nome}</div>
                                                <div className="text-green-400 font-black text-xs">R$ {parseFloat(link.preco).toFixed(2).replace('.', ',')}</div>
                                                <div className="text-[10px] text-gray-500 truncate mt-0.5">{link.url}</div>
                                                {link.desc && <div className="text-[10px] text-gray-400 mt-0.5 italic">{link.desc}</div>}
                                            </div>
                                            <div className="flex gap-1.5 w-full sm:w-auto">
                                                <button onClick={() => handleStartEditDynLink(link)} className="p-2 bg-purple-600/30 text-purple-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <Edit2 size={12} /> Editar
                                                </button>
                                                <button onClick={() => copiarLink(link.id, link.url)} style={{ ...btnV, background: copiedId === link.id ? '#10b981' : 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                                                    {copiedId === link.id ? <Check size={11} /> : <Copy size={11} />}
                                                </button>
                                                <a href={link.url} target="_blank" style={{ ...btnV, textDecoration: 'none' }}><ExternalLink size={11} /></a>
                                                <button onClick={() => deletarDynLink(link.id)} style={{ ...btnV, background: '#ef4444', boxShadow: 'none' }}><Trash2 size={11} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. CONFIGURAÇÕES BANNERS & WIDGETS */}
                    {aba === 'configuracoes' && localConfig && (
                        <div className="space-y-5 max-w-4xl">
                            {/* Selo Verificado */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                        ✅ Selo de Loja Verificada
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.verificadoLoja?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input
                                            type="checkbox"
                                            checked={!!localConfig.verificadoLoja?.ativo}
                                            onChange={async e => {
                                                const updated = { ...localConfig, verificadoLoja: { ...localConfig.verificadoLoja, ativo: e.target.checked } };
                                                setLocalConfig(updated);
                                                await handleSaveAll(updated);
                                            }}
                                            className="w-5 h-5 accent-purple-600"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Posição do Selo na Loja</label>
                                    <select
                                        value={localConfig.verificadoLoja?.posicao || 'todos'}
                                        onChange={async e => {
                                            const updated = { ...localConfig, verificadoLoja: { ...localConfig.verificadoLoja, posicao: e.target.value as any } };
                                            setLocalConfig(updated);
                                            await handleSaveAll(updated);
                                        }}
                                        className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs"
                                    >
                                        <option value="todos">Em todos os lugares (Topo + Rodapé + Produtos)</option>
                                        <option value="topo">Apenas no Topo (Header)</option>
                                        <option value="rodape">Apenas no Rodapé (Footer)</option>
                                        <option value="produtos">Apenas nas Páginas de Produto e Categorias</option>
                                    </select>
                                    <p className="text-[11px] text-gray-500 mt-1">A desativação é permanente até você ativar novamente.</p>
                                </div>
                            </div>

                            {/* Banner Rotativo (Marquee Topo) */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                        <Film size={16} /> 🔄 Banner Rotativo Topo (Marquee)
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.bannerTopo?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input type="checkbox" checked={!!localConfig.bannerTopo?.ativo} onChange={async e => { const updated = { ...localConfig, bannerTopo: { ...localConfig.bannerTopo, ativo: e.target.checked } }; setLocalConfig(updated); await handleSaveAll(updated); }} className="w-5 h-5 accent-purple-600" />
                                    </label>
                                </div>
                                {localConfig.bannerTopo?.ativo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor de Fundo</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerTopo.corFundo || '#0f172a'} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value } })} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerTopo.corFundo || '#0f172a'} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corFundo: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor do Texto</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={localConfig.bannerTopo.corTexto || '#ffffff'} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corTexto: e.target.value } })} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={localConfig.bannerTopo.corTexto || '#ffffff'} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, corTexto: e.target.value } })} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade da Animação (segundos)</label>
                                            <input type="number" value={localConfig.bannerTopo.velocidade || 30} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, velocidade: parseInt(e.target.value) || 30 } })} style={input} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">URL Imagem Banner (Substitui o texto)</label>
                                            <input value={localConfig.bannerTopo.imagem || ''} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, imagem: e.target.value } })} placeholder="https://..." style={input} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Letreiro (Marquee)</label>
                                            <textarea value={localConfig.bannerTopo.textoMarquee || ''} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, textoMarquee: e.target.value } })} rows={2} style={input} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Banner Geolocalizado */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white">📍 Banner Geolocalizado</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.bannerGeolocalizado?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input type="checkbox" checked={!!localConfig.bannerGeolocalizado?.ativo} onChange={async e => { const updated = { ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, ativo: e.target.checked } }; setLocalConfig(updated); await handleSaveAll(updated); }} className="w-5 h-5 accent-purple-600" />
                                    </label>
                                </div>
                                {localConfig.bannerGeolocalizado?.ativo && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Formato Visual p/ Posição</label>
                                            <select value={localConfig.bannerGeolocalizado.formatoBanner || 'barra_fina'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, formatoBanner: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="barra_fina">Barra Fina de Topo (48px)</option>
                                                <option value="banner_largo">Banner Largo Destacado (80px)</option>
                                                <option value="card_popup">Card Pop-up Flutuante</option>
                                                <option value="pilula_fixa">Pílula Arredondada Fixa</option>
                                                <option value="full_width">Banner Largura Total (Full Width)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Posição no Site</label>
                                            <select value={localConfig.bannerGeolocalizado.posicao || 'topo_vitrine'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, posicao: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="topo_vitrine">Topo da Vitrine</option>
                                                <option value="header_abaixo">Abaixo do Header</option>
                                                <option value="acima_botao_comprar">Acima do Botão Comprar</option>
                                                <option value="abaixo_botao_comprar">Abaixo do Botão Comprar</option>
                                                <option value="vitrine_categoria">Topo da Categoria</option>
                                                <option value="popup_modal">Popup Modal</option>
                                                <option value="rodape">Rodapé</option>
                                            </select>
                                        </div>
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
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Template de Texto (use {'{cidade}'} e {'{estado}'})</label>
                                            <input value={localConfig.bannerGeolocalizado.textoTemplate} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, textoTemplate: e.target.value } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp Mensagens Personalizadas por Produto */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <MessageSquare size={16} /> Mensagens Personalizadas de WhatsApp por Produto / Global
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Mensagem Padrão Global</label>
                                        <textarea
                                            value={localConfig.whatsapp?.mensagensPersonalizadas?.['padrao'] || ''}
                                            onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, mensagensPersonalizadas: { ...localConfig.whatsapp.mensagensPersonalizadas, padrao: e.target.value } } })}
                                            rows={2}
                                            placeholder="Olá! Vim pelo site Manto Sagrado..."
                                            className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-xs"
                                        />
                                    </div>

                                    <div className="border border-white/5 p-3.5 rounded-xl bg-slate-950/40 space-y-2">
                                        <h4 className="text-xs font-bold text-purple-300">Definir Mensagem Específica para um Produto</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 font-bold mb-1">Produto</label>
                                                <select value={wspSelectedProd} onChange={e => setWspSelectedProd(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs">
                                                    <option value="">Selecione o produto...</option>
                                                    {allVitrineProducts.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-400 font-bold mb-1">Mensagem WhatsApp Específica</label>
                                                <input value={wspProdMessage} onChange={e => setWspProdMessage(e.target.value)} placeholder="Ex: Olá, quero comprar a camisa X..." style={input} />
                                            </div>
                                        </div>
                                        <button onClick={handleSaveWspProdMessage} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg text-xs">
                                            Salvar Mensagem do Produto
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                {saving ? '⏳ Salvando no Banco...' : '💾 SALVAR TODAS AS CONFIGURAÇÕES NO BANCO'}
                            </button>
                        </div>
                    )}

                    {/* 6. STORIES FLUTUANTES */}
                    {aba === 'stories' && (
                        <div className="space-y-5 max-w-4xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Film size={16} /> 📱 Adicionar Story Flutuante (Vídeo Personalizado)
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Nome / Título do Story *</label>
                                        <input value={storyNome} onChange={e => setStoryNome(e.target.value)} placeholder="Ex: Promoção Camisa Brasil 2026" style={input} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Vínculo do Story</label>
                                        <select value={storyTipo} onChange={e => setStoryTipo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="produto">Linkar a Produto da Loja</option>
                                            <option value="texto">Exibir Mensagem Promocional</option>
                                        </select>
                                    </div>
                                </div>

                                {storyTipo === 'produto' ? (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Selecione o Produto Vinculado</label>
                                        <select value={storyProdId} onChange={e => setStoryProdId(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="">Selecione um produto...</option>
                                            {allVitrineProducts.map(p => <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Texto Promocional</label>
                                        <input value={storyText} onChange={e => setStoryText(e.target.value)} placeholder="Ex: 🔥 Frete Grátis na primeira compra!" style={input} />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Regra de Visibilidade</label>
                                        <select value={storyVisib} onChange={e => setStoryVisib(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="global">Global (Todas as Páginas)</option>
                                            <option value="inicial">Apenas Página Inicial</option>
                                            <option value="categoria">Por Categoria de Produto</option>
                                            <option value="produto">Página de Produto Específico</option>
                                        </select>
                                    </div>
                                    {storyVisib === 'categoria' && (
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Categoria de Visibilidade</label>
                                            <select value={storyCategoria} onChange={e => setStoryCategoria(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="europeus">Europeus</option>
                                                <option value="brasileirão">Brasileirão</option>
                                                <option value="seleções">Seleções</option>
                                                <option value="retrô">Retrô</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Vídeo do Story (Upload de Arquivo ou Cole a URL MP4/WebM)</label>
                                    <div className="flex gap-2">
                                        <input value={storyVideoUrl} onChange={e => setStoryVideoUrl(e.target.value)} placeholder="https://.../video.mp4" className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadStoryVideo(e.target.files[0])} />
                                        <button type="button" onClick={() => videoInputRef.current?.click()} disabled={storyUploadingVideo} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1">
                                            {storyUploadingVideo ? 'Uploading...' : '📁 Upload'}
                                        </button>
                                    </div>
                                </div>

                                <button onClick={handleAddStory} style={btnSave}>+ ADICIONAR STORY FLUTUANTE</button>
                            </div>

                            {/* Lista de Stories */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-xs sm:text-sm font-bold text-white">Stories Ativos no Site ({(localConfig.stories?.lista || []).length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {(localConfig.stories?.lista || []).map(st => (
                                        <div key={st.id} className="bg-slate-950 border border-white/10 p-3 rounded-xl space-y-2 relative">
                                            <button onClick={() => handleRemoveStory(st.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5">
                                                    <video src={st.videoUrl} className="w-full h-full rounded-full object-cover" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-bold text-white truncate">{st.nome}</h4>
                                                    <span className="text-[10px] text-purple-300 font-bold uppercase">{st.visibilidade}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(localConfig.stories?.lista || []).length === 0 && (
                                        <p className="text-xs text-gray-500 col-span-full text-center py-4">Nenhum story cadastrado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. PREÇOS & CUPONS */}
                    {aba === 'precos' && (
                        <div className="space-y-6 max-w-4xl">
                            {/* Regras de Ajuste Automático */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Tag size={16} /> Regras de Ajuste Automático de Preço (%)
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome da Regra *</label><input value={ruleNome} onChange={e => setRuleNome(e.target.value)} placeholder="Ex: Black Friday 15%" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                        <select value={ruleEscopo} onChange={e => setRuleEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="tudo">Todos os Produtos</option>
                                            <option value="categoria">Por Categoria</option>
                                            <option value="produto">Produto Específico</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Operação</label>
                                        <select value={ruleOp} onChange={e => setRuleOp(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="diminuir">Desconto (-%)</option>
                                            <option value="aumentar">Aumento (+%)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Percentual (%) *</label><input type="number" value={rulePercent} onChange={e => setRulePercent(e.target.value)} placeholder="10" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Descrição</label><input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} placeholder="Motivo do ajuste..." style={input} /></div>
                                </div>

                                <button onClick={handleAddPriceRule} style={btnSave}>+ CRIAR REGRA DE PREÇO</button>

                                {/* Regras Criadas */}
                                <div className="space-y-2 pt-2">
                                    {(localConfig.precoGestao?.regras || []).map(r => (
                                        <div key={r.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <span className="font-bold text-xs text-white">{r.nome}</span>
                                                <span className={`ml-2 text-xs font-black ${r.operacao === 'diminuir' ? 'text-green-400' : 'text-amber-400'}`}>
                                                    {r.operacao === 'diminuir' ? '-' : '+'}{r.percentual}% ({r.escopo})
                                                </span>
                                                {r.descricao && <p className="text-[11px] text-gray-500">{r.descricao}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleToggleRule(r.id)} className={`px-2.5 py-1 rounded text-[10px] font-bold ${r.ativa ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-slate-800 text-gray-500'}`}>
                                                    {r.ativa ? 'ATIVA' : 'INATIVA'}
                                                </button>
                                                <button onClick={() => handleRemoveRule(r.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cupons de Desconto */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Percent size={16} /> Cupons de Desconto do Checkout
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Código do Cupom *</label><input value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value)} placeholder="Ex: MANTO10" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Cupom *</label><input value={cupomNome} onChange={e => setCupomNome(e.target.value)} placeholder="Ex: Cupom de Boas-Vindas" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Desconto (%) *</label><input type="number" value={cupomDesconto} onChange={e => setCupomDesconto(e.target.value)} placeholder="10" style={input} /></div>
                                </div>

                                <button onClick={handleAddCoupon} style={btnSave}>+ CRIAR CUPOM DE DESCONTO</button>

                                <div className="space-y-2 pt-2">
                                    {(localConfig.precoGestao?.cupons || []).map(c => (
                                        <div key={c.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <span className="font-mono font-bold text-xs text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">{c.codigo}</span>
                                                <span className="ml-2 font-bold text-xs text-white">{c.nome} ({c.desconto}%)</span>
                                            </div>
                                            <button onClick={() => handleRemoveCoupon(c.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 8. BANCO DE IMAGENS */}
                    {aba === 'imagens' && (
                        <div className="space-y-5 max-w-5xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Camera size={16} /> Banco de Imagens & Gerenciador de Álbuns
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Selecione o Álbum Destino</label>
                                        <select value={bankAlbum} onChange={e => setBankAlbum(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            {(localConfig.imagensBanco?.albuns || ['Geral']).map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Upload ou URL da Imagem</label>
                                        <ImageUploader value={bankImageUrl} onChange={url => setBankImageUrl(url)} />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={handleAddBankImage} style={btnSave} className="flex-1">
                                        + SALVAR IMAGEM NO BANCO
                                    </button>
                                </div>

                                {/* Criar / Remover Álbum Personalizado */}
                                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center gap-2">
                                    <input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nome do Novo Álbum..." className="flex-1 bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs" />
                                    <button onClick={handleCreateAlbum} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap">
                                        + Criar Álbum
                                    </button>
                                    {bankAlbum !== 'Geral' && (
                                        <button onClick={() => handleRemoveAlbum(bankAlbum)} className="bg-red-900/40 hover:bg-red-800 text-red-300 font-bold px-3 py-2.5 rounded-xl text-xs">
                                            Excluir Álbum Atual
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Galeria em Grade */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-bold">Filtrar por Álbum:</span>
                                        <select value={selectedAlbumFilter} onChange={e => setSelectedAlbumFilter(e.target.value)} className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 text-xs">
                                            <option value="Todos">Todos os Álbuns</option>
                                            {(localConfig.imagensBanco?.albuns || []).map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>

                                    <input value={imageSearch} onChange={e => setImageSearch(e.target.value)} placeholder="Buscar imagens..." className="bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs w-full sm:w-48" />
                                </div>

                                <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-${imageCols}`}>
                                    {filteredBankImages.map(img => (
                                        <div key={img.id} className="bg-slate-950 border border-white/10 rounded-xl overflow-hidden group relative">
                                            <img src={img.url} alt={img.nome} className="w-full h-36 object-cover" />
                                            <div className="p-2 flex justify-between items-center bg-slate-900/90">
                                                <span className="text-[10px] text-gray-400 truncate">{img.album}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { navigator.clipboard.writeText(img.url); alert('URL copiada!'); }} className="p-1 text-gray-400 hover:text-white"><Copy size={12} /></button>
                                                    <button onClick={() => handleRemoveBankImage(img.id)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredBankImages.length === 0 && (
                                        <p className="text-xs text-gray-500 col-span-full text-center py-6">Nenhuma imagem neste álbum.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 9. CALCULADORA ROI & PLANILHA DE VENDAS */}
                    {aba === 'calculadora' && (
                        <div className="space-y-6 max-w-4xl">
                            {/* Calculadora ROI */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-sm font-bold text-white">🧮 Calculadora Rápida de ROI / ROAS</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Valor 1 (R$)</label><input type="number" value={calcVal1} onChange={e => setCalcVal1(e.target.value)} placeholder="5000" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Valor 2 (R$)</label><input type="number" value={calcVal2} onChange={e => setCalcVal2(e.target.value)} placeholder="1000" style={input} /></div>
                                </div>
                                <div className="flex gap-1.5">
                                    {(['+', '-', '*', '/'] as const).map(op => (
                                        <button key={op} type="button" onClick={() => setCalcOp(op)} className={`flex-1 py-2 rounded-lg font-bold border text-xs transition ${calcOp === op ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'}`}>
                                            {op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : '÷'}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleCalculator} style={{ ...btnSave, padding: '10px' }}>CALCULAR</button>
                                {calcResult !== null && (
                                    <div className="bg-slate-950/80 border border-white/5 p-3 rounded-xl">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Resultado:</p>
                                        <h3 className="text-xl font-black text-green-400 mt-0.5">R$ {calcResult.toFixed(2).replace('.', ',')}</h3>
                                    </div>
                                )}
                            </div>

                            {/* Planilha de Vendas Realizadas */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <DollarSign size={16} /> Planilha de Vendas Realizadas (Checkout / Links Externos)
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Cliente</label><input value={vendaCliente} onChange={e => setVendaCliente(e.target.value)} placeholder="Nome do cliente" style={input} /></div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Produto</label><input value={vendaProduto} onChange={e => setVendaProduto(e.target.value)} placeholder="Nome do produto" style={input} /></div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Valor (R$)</label><input type="number" value={vendaValor} onChange={e => setVendaValor(e.target.value)} placeholder="139.90" style={input} /></div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Origem</label>
                                        <select value={vendaOrigem} onChange={e => setVendaOrigem(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="checkout">Checkout do Site</option>
                                            <option value="link_externo">Link Externo / WhatsApp</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleAddVendaPlanilha} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs w-full">
                                    + REGISTRAR VENDA NA PLANILHA
                                </button>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                        <thead><tr><th style={th}>DATA</th><th style={th}>CLIENTE</th><th style={th}>PRODUTO</th><th style={th}>VALOR</th><th style={th}>ORIGEM</th><th style={th}>AÇÃO</th></tr></thead>
                                        <tbody>
                                            {(localConfig.calculadoraAds?.vendasPlanilha || []).map(v => (
                                                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={td}>{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                                                    <td style={td}><strong>{v.cliente}</strong></td>
                                                    <td style={td}>{v.produto}</td>
                                                    <td style={{ ...td, color: '#34d399', fontWeight: 900 }}>R$ {v.valor.toFixed(2).replace('.', ',')}</td>
                                                    <td style={td}><span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded uppercase font-bold">{v.origem}</span></td>
                                                    <td style={td}><button onClick={() => handleRemoveVendaPlanilha(v.id)} className="p-1 bg-red-900/30 text-red-400 rounded"><Trash2 size={13} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 10. INTEGRAÇÕES */}
                    {aba === 'integracoes' && (
                        <div className="space-y-5 max-w-4xl">
                            {/* Gateway IronPay */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        💳 Gateway de Pagamento IronPay (Pix & Cartão)
                                    </h3>
                                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} /> CONECTADO
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Processamento de pagamentos em tempo real via PIX instantâneo e Cartão de Crédito.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">API Key (Produção)</span>
                                        <span className="text-xs font-mono text-purple-300 font-bold">iron_live_••••••••••••3a8b</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Endpoint do Webhook</span>
                                        <span className="text-xs font-mono text-blue-300 font-bold truncate block">/api/ironpay/webhook</span>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Conversions API (CAPI) */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        🎯 Meta Conversions API (CAPI & Pixel)
                                    </h3>
                                    <span className="bg-blue-950 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Activity size={12} /> RASTREAMENTO ATIVO
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Meta Pixel ID</span>
                                        <span className="text-xs font-mono text-white font-bold">1590849999312410</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Eventos Rastreados</span>
                                        <span className="text-xs text-gray-300 font-bold">PageView, ViewContent, AddToCart, InitiateCheckout</span>
                                    </div>
                                </div>
                            </div>

                            {/* Supabase Database */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        🗄️ Supabase PostgreSQL Database & Realtime
                                    </h3>
                                    <span className="bg-purple-950 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} /> BANCO ONLINE
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Instância ativa: <code className="text-purple-300">kffjkhyhhjpkwzfrcvzh.supabase.co</code></p>
                            </div>
                        </div>
                    )}

                    {/* 11. FRONTEND EDITOR */}
                    {aba === 'frontend' && localConfig && (
                        <div className="space-y-5 max-w-3xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white">🎨 Personalizar Visual Completo do Site</h3>

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

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Imagem do Banner Principal (Hero)</label>
                                    <ImageUploader value={localConfig.frontend?.heroImage || ''} onChange={url => setLocalConfig({ ...localConfig, frontend: { ...localConfig.frontend, heroImage: url } })} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        ['Título Hero', 'heroTitle', 'MANTO SAGRADO'],
                                        ['Subtítulo Hero', 'heroSubtitle', 'Camisetas Oficiais dos Maiores Times do Mundo'],
                                        ['Texto CTA', 'heroCta', 'Ver Camisetas'],
                                        ['Copyright Rodapé', 'footerCopyright', '© 2025 Camisa 10. Todos os direitos reservados.'],
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

// STYLES
const bIn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '10px 12px', border: 'none', background: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', borderRadius: '9px', fontWeight: 800, textAlign: 'left', transition: 'all 0.2s', fontSize: '12px' };
const bAt: React.CSSProperties = { ...bIn, background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.15))', color: '#fff', border: '1px solid rgba(124,58,237,0.3)' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.08em' };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' };
const btnV: React.CSSProperties = { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 900, display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)', fontSize: '11px', textDecoration: 'none', whiteSpace: 'nowrap' };
const btnRef: React.CSSProperties = { padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 900, borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '6px', transition: 'all 0.2s', fontSize: '11px', alignItems: 'center' };
const tabCard: React.CSSProperties = { background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', marginBottom: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontWeight: 700, outline: 'none', transition: 'all 0.2s', fontSize: '13px', boxSizing: 'border-box' };
const btnSave: React.CSSProperties = { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.35)', fontSize: '13px', transition: 'opacity 0.2s' };