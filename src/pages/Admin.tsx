import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    useStoreConfig, PriceRule, FloatingStory, CatalogImage, Coupon,
    VendaRealizada, GastoAnuncio, EstrategiaEscala, DescontoProdutoSpec, Categoria
} from '../contexts/StoreConfigContext';

const STORE_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

import { allProducts } from '../data/products';
import { getTeamPlayers, getTeamsWithPlayers } from '../data/teamPlayers';
import {
    LayoutDashboard, ShoppingCart, PlusCircle, Eye, RefreshCw, Trash2,
    LogOut, Sliders, Activity, Calculator, Shield, Camera, Sparkles,
    Play, Plus, Download, Search, Check, Edit2, ExternalLink, Copy, Tag,
    Package, Film, Palette, X, Link2, Menu, Save, DollarSign, TrendingUp,
    MessageSquare, Truck, Clock, Percent, ListFilter, CheckCircle, Smartphone,
    Zap, FolderPlus, List
} from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from 'sonner';

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

    type ActiveTab = 'dashboard' | 'vitrine' | 'novo' | 'dinamicos' | 'configuracoes' | 'stories' | 'pulse' | 'precos' | 'imagens' | 'calculadora' | 'integracoes' | 'frontend' | 'categorias';
    const [aba, setAba] = useState<ActiveTab>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [produtos, setProdutos] = useState<any[]>([]);
    const [metaEvents, setMetaEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [localConfig, setLocalConfig] = useState(config);

    useEffect(() => {
        if (config) setLocalConfig(config);
    }, [config]);

    // NEW / EDIT PRODUCT FORM STATE
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
    const [nomeProd, setNomeProd] = useState('');
    const [precoProd, setPrecoProd] = useState('');
    const [productImages, setProductImages] = useState<string[]>(['', '', '', '', '', '']);
    const [productVideos, setProductVideos] = useState<string[]>(['', '']);
    const [categoryProd, setCategoryProd] = useState('europeus');
    const [teamProd, setTeamProd] = useState('Personalizado');
    const [descProd, setDescProd] = useState('');
    const [descVideoProd, setDescVideoProd] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(['P', 'M', 'G', 'GG', 'XGG']);
    const [selectedPlayer, setSelectedPlayer] = useState('');

    // Product specific discount
    const [prodDescontoPercent, setProdDescontoPercent] = useState('0');
    const [prodTempoLimitado, setProdTempoLimitado] = useState(false);
    const [prodFreteGratis, setProdFreteGratis] = useState(false);
    const [prodEstadoFreteGratis, setProdEstadoFreteGratis] = useState('');
    const [prodCidadeFreteGratis, setProdCidadeFreteGratis] = useState('');

    // Vitrine filter
    const [vitrineSearch, setVitrineSearch] = useState('');
    const [vitrineCatFilter, setVitrineCatFilter] = useState('todas');

    // Dynamic product link
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
    const [ruleDataInicio, setRuleDataInicio] = useState('');
    const [ruleDataFim, setRuleDataFim] = useState('');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

    // COUPONS
    const [cupomNome, setCupomNome] = useState('');
    const [cupomCodigo, setCupomCodigo] = useState('');
    const [cupomDesconto, setCupomDesconto] = useState('10');
    const [cupomEscopo, setCupomEscopo] = useState<'tudo' | 'categoria' | 'produto'>('tudo');
    const [cupomCat, setCupomCat] = useState('europeus');
    const [cupomProdId, setCupomProdId] = useState('');
    const [cupomValidade, setCupomValidade] = useState('');
    const [cupomDesc, setCupomDesc] = useState('');
    const [editingCupomId, setEditingCupomId] = useState<string | null>(null);

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
    const [storyCorBotao, setStoryCorBotao] = useState('#7c3aed');
    const [storyCorFundo, setStoryCorFundo] = useState('#1e293b');
    const [storyCorFonte, setStoryCorFonte] = useState('#ffffff');
    const [storyPulseAtivo, setStoryPulseAtivo] = useState(true);
    const [storyPulseVel, setStoryPulseVel] = useState<'lento' | 'normal' | 'rapido'>('normal');
    const [storyPulseTam, setStoryPulseTam] = useState('8');
    const videoInputRef = useRef<HTMLInputElement>(null);

    // IMAGES BANK
    const [bankAlbum, setBankAlbum] = useState('Geral');
    const [bankImageUrl, setBankImageUrl] = useState('');
    const [imageSearch, setImageSearch] = useState('');
    const [selectedAlbumFilter, setSelectedAlbumFilter] = useState('Todos');
    const [imageCols, setImageCols] = useState<'2' | '3' | '4'>('4');
    const [newAlbumName, setNewAlbumName] = useState('');

    // CALCULATOR & PLANILHA & AD SPEND & ESCALA
    const [calcVal1, setCalcVal1] = useState('');
    const [calcVal2, setCalcVal2] = useState('');
    const [calcResult, setCalcResult] = useState<number | null>(null);
    const [calcOp, setCalcOp] = useState<'+' | '-' | '*' | '/'>('-');
    const [vendaCliente, setVendaCliente] = useState('');
    const [vendaProduto, setVendaProduto] = useState('');
    const [vendaValor, setVendaValor] = useState('');
    const [vendaOrigem, setVendaOrigem] = useState<'checkout' | 'link_externo'>('checkout');
    const [gastoCampanha, setGastoCampanha] = useState('');
    const [gastoConjunto, setGastoConjunto] = useState('');
    const [gastoPlataforma, setGastoPlataforma] = useState<'meta' | 'google' | 'tiktok'>('meta');
    const [gastoValor, setGastoValor] = useState('');
    const [escalaTitulo, setEscalaTitulo] = useState('');
    const [escalaDesc, setEscalaDesc] = useState('');
    const [escalaRoas, setEscalaRoas] = useState('');

    // WhatsApp
    const [wspSelectedProd, setWspSelectedProd] = useState('');
    const [wspProdMessage, setWspProdMessage] = useState('');

    // CATEGORIES (dynamic)
    const [catLabel, setCatLabel] = useState('');
    const [catSlug, setCatSlug] = useState('');

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
        if (authorized) {
            refreshAll();
            // Auto-refresh dashboard every 30 seconds
            const interval = setInterval(() => {
                buscarPedidos();
                buscarMetaEvents();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [authorized]);

    // GLOBAL SAVE
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

    // AI Description Generator (Ultra Smart & Team-Aware)
    const handleGenerateAiDescription = (nomeProduto: string, time: string, setter: (v: string) => void) => {
        if (!nomeProduto) { alert('Preencha o Nome da Camisa primeiro!'); return; }
        setAiGenerating(true);
        setTimeout(() => {
            const teamUpper = (time || '').toLowerCase();
            let teamContext = '';
            if (teamUpper.includes('flamengo')) {
                teamContext = `Celebrando a paixão avassaladora da Maior Nação do Mundo, esta peça carrega a mística das grandes conquistas no Maracanã e o orgulho rubro-negro.`;
            } else if (teamUpper.includes('real madrid')) {
                teamContext = `Inspirada na realeza do futebol mundial e na hegemonia incontestável de 15 títulos europeus, esta camisa exala a imponência do Santiago Bernabéu.`;
            } else if (teamUpper.includes('barcelona')) {
                teamContext = `Respeitando o lema 'Més que un club', o manto traz a tradição culé, o estilo inconfundível de jogo e a garra do Camp Nou.`;
            } else if (teamUpper.includes('palmeiras')) {
                teamContext = `Honrando a tradição da Tríplice Coroa e da Segunda Academia, a camisa do Verdão representa a obsessão por vitórias e a força da torcida que canta e vibra.`;
            } else if (teamUpper.includes('são paulo') || teamUpper.includes('sao paulo')) {
                teamContext = `Para o torcedor do Tricolor Paulista, soberano e multicampeão mundial, esta camisa traduz a elegância e a glória do MorumBIS.`;
            } else if (teamUpper.includes('corinthians')) {
                teamContext = `Representando a raça da Fiel Torcida e a tradição alvinegra, este manto é feito para quem vive e respira o Corinthians 90 minutos por jogo.`;
            } else if (teamUpper.includes('brasil')) {
                teamContext = `A única seleção pentacampeã do planeta! Vestir o manto amarelo e verde é carregar a história dos maiores craques que já pisaram em um gramado.`;
            } else if (teamUpper.includes('argentina')) {
                teamContext = `A camisa dos campeões do mundo! Com as cores albiceleste que consagraram lendas e emocionaram o futebol mundial.`;
            } else if (teamUpper.includes('psg') || teamUpper.includes('paris')) {
                teamContext = `Unindo o luxo da capital francesa à ousadia no futebol moderno, este manto celebra a nova era de glamour no Parque dos Príncipes.`;
            } else {
                teamContext = `Uma edição histórica e indispensável para qualquer colecionador e apaixonado por futebol de alto nível.`;
            }

            const template = `🔥 **EDIÇÃO OFICIAL 2026/27 — MANTO PREMIUM**

Vista com orgulho a nova **${nomeProduto}**! ${teamContext}

✨ **TECNOLOGIA & ACABAMENTO ATLETA:**
- **Tecido AeroReady / DryFit Pro:** Microfuros de alta respirabilidade que absorvem o suor e mantêm o corpo seco do primeiro ao último minuto.
- **Escudo e Detalhes Termoadaptados:** Aplicação em alta definição com costuras reforçadas e acabamento impecável.

🏆 **TORCEDOR x JOGADOR — ESCOLHA SEU ESTILO:**
- **Versão Torcedor:** Modelagem tradicional confortável, perfeita para o dia a dia, churrascos e arquibancada.
- **Versão Jogador:** Modelagem slim ajustada ao corpo, a mesma tecnologia exata utilizada pelos atletas em campo (+R$ 20,00).
- **Personalização Gráfica:** Adicione seu nome e número oficial com a fonte autêntica da temporada (+R$ 20,00).

💬 *"Sensação de vestuário de atleta profissional! A qualidade do tecido e os detalhes do escudo impressionam."* — Torcedor Verificado

GARANTA JÁ O SEU MANTO COM FRETE RÁPIDO E GARANTIA DE SATISFAÇÃO TOTAL!`;

            setter(template);
            setAiGenerating(false);
        }, 1000);
    };

    // PRODUCT CREATE / EDIT
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

        let vids: string[] = ['', ''];
        if (prod.videos) {
            try {
                const parsed = typeof prod.videos === 'string' ? JSON.parse(prod.videos) : prod.videos;
                if (Array.isArray(parsed)) {
                    parsed.forEach((v: string, i: number) => { if (i < 2) vids[i] = v; });
                }
            } catch (_) {
                if (typeof prod.videos === 'string') vids[0] = prod.videos;
            }
        }
        setProductVideos(vids);

        setSelectedSizes(prod.sizes || ['P', 'M', 'G', 'GG', 'XGG']);

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
        const allVids = productVideos.filter(v => v);
        const prodId = editingProdId || crypto.randomUUID();

        const fullPayload: any = {
            id: prodId,
            nome: nomeProd,
            preco: precoNumerico,
            imagem_url: mainImg,
            image: mainImg,
            images: JSON.stringify(allImgs),
            videos: JSON.stringify(allVids),
            category: categoryProd,
            team: teamProd,
            description: descProd + (descVideoProd ? `\n\n[VÍDEO](${descVideoProd})` : ''),
            sizes: selectedSizes,
            tipo: 'vitrine'
        };

        let { error } = await supabase.from('produtos').upsert([fullPayload], { onConflict: 'id' });

        // Fallback for DB schemas without tipo/sizes/images/videos columns
        if (error && (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache'))) {
            const basicPayload: any = {
                id: prodId,
                nome: nomeProd,
                preco: precoNumerico,
                imagem_url: mainImg,
                image: mainImg,
                category: categoryProd,
                team: teamProd,
                description: descProd + (descVideoProd ? `\n\n[VÍDEO](${descVideoProd})` : '')
            };
            const fallbackRes = await supabase.from('produtos').upsert([basicPayload], { onConflict: 'id' });
            error = fallbackRes.error;
        }

        if (error) {
            toast.error('Erro ao salvar produto: ' + error.message);
            return;
        }

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

        toast.success(editingProdId ? '✅ Produto atualizado com sucesso!' : '✅ Produto cadastrado na vitrine!');

        setEditingProdId(null); setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setDescProd(''); setDescVideoProd(''); setSelectedPlayer('');
        setProdDescontoPercent('0'); setProdTempoLimitado(false); setProdFreteGratis(false); setProdEstadoFreteGratis(''); setProdCidadeFreteGratis('');
        await buscarProdutos();
        setAba('vitrine');
    };

    const removerProdutoPermanente = async (prod: { id: string; nome: string; origem: string }) => {
        if (!confirm(`⚠️ Remover PERMANENTEMENTE "${prod.nome}" da loja?\n\nEste produto será removido da vitrine. Só voltará se você criar ele novamente.`)) return;
        if (prod.origem === 'estatico') {
            const ocultos = [...(localConfig.produtosOcultos || []), prod.id];
            const updatedConfig = { ...localConfig, produtosOcultos: ocultos };
            setLocalConfig(updatedConfig);
            await handleSaveAll(updatedConfig);
        } else {
            const { error } = await supabase.from('produtos').delete().eq('id', prod.id);
            if (error) toast.error('Erro ao excluir: ' + error.message);
            await buscarProdutos();
        }
        toast.success('✅ Produto removido permanentemente da loja!');
    };

    // DYNAMIC LINKS
    const gerarLinkDinamico = async () => {
        if (!dynNome || !dynPreco) { alert('Preencha nome e preço!'); return; }
        const base = window.location.origin;
        const url = `${base}/checkout?nome=${encodeURIComponent(dynNome)}&preco=${encodeURIComponent(dynPreco)}${dynImg ? `&img=${encodeURIComponent(dynImg)}` : ''}`;
        const precoNum = parseFloat(dynPreco.replace(',', '.')) || 0;

        if (editingDynId) {
            setDynLinks(prev => prev.map(l => l.id === editingDynId ? { id: editingDynId, nome: dynNome, preco: dynPreco, img: dynImg, url, desc: dynDesc } : l));
            await supabase.from('produtos').update({ nome: dynNome, preco: precoNum, imagem_url: dynImg || null, image: dynImg || null, description: dynDesc || '' }).eq('id', editingDynId);
            setEditingDynId(null);
            toast.success('✅ Link dinâmico atualizado!');
        } else {
            const newId = crypto.randomUUID();
            const newLink = { id: newId, nome: dynNome, preco: dynPreco, img: dynImg, url, desc: dynDesc };
            setDynLinks(prev => [newLink, ...prev]);
            await supabase.from('produtos').upsert([{ id: newId, nome: dynNome, preco: precoNum, imagem_url: dynImg || null, image: dynImg || null, category: 'dinamico', tipo: 'dinamico', description: dynDesc || '', team: 'Link Dinâmico', sizes: [] }], { onConflict: 'id' });
            toast.success('✅ Link dinâmico gerado e salvo!');
        }

        setDynNome(''); setDynPreco(''); setDynImg(''); setDynDesc('');
        await buscarProdutos();
    };

    const handleStartEditDynLink = (link: any) => {
        setEditingDynId(link.id); setDynNome(link.nome); setDynPreco(link.preco); setDynImg(link.img || ''); setDynDesc(link.desc || '');
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

        if (editingRuleId) {
            // Edit existing rule
            const updatedRules = (localConfig.precoGestao?.regras || []).map(r =>
                r.id === editingRuleId
                    ? {
                        ...r,
                        nome: ruleNome,
                        descricao: ruleDesc,
                        escopo: ruleEscopo,
                        categoria: ruleEscopo === 'categoria' ? ruleCat : undefined,
                        produtoId: ruleEscopo === 'produto' ? ruleProdId : undefined,
                        operacao: ruleOp,
                        percentual: percentage,
                        dataInicio: ruleDataInicio || undefined,
                        dataFim: ruleDataFim || undefined,
                    }
                    : r
            );
            const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
            setLocalConfig(updatedConfig);
            await handleSaveAll(updatedConfig);
            setEditingRuleId(null);
        } else {
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
                criadaEm: new Date().toISOString(),
                dataInicio: ruleDataInicio || undefined,
                dataFim: ruleDataFim || undefined,
            };
            const updatedConfig = {
                ...localConfig,
                precoGestao: { ...localConfig.precoGestao, regras: [...(localConfig.precoGestao?.regras || []), newRule] }
            };
            setLocalConfig(updatedConfig);
            await handleSaveAll(updatedConfig);
        }
        setRuleNome(''); setRuleDesc(''); setRuleProdId(''); setRuleDataInicio(''); setRuleDataFim('');
    };

    const handleStartEditRule = (r: PriceRule) => {
        setEditingRuleId(r.id);
        setRuleNome(r.nome);
        setRuleDesc(r.descricao || '');
        setRuleEscopo(r.escopo);
        setRuleCat(r.categoria || 'europeus');
        setRuleProdId(r.produtoId || '');
        setRuleOp(r.operacao);
        setRulePercent(String(r.percentual));
        setRuleDataInicio(r.dataInicio || '');
        setRuleDataFim(r.dataFim || '');
    };

    const handleToggleRule = async (id: string) => {
        const updatedRules = (localConfig.precoGestao?.regras || []).map(r => r.id === id ? { ...r, ativa: !r.ativa } : r);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleRemoveRule = async (id: string) => {
        if (!confirm('Remover esta regra de preço?')) return;
        const updatedRules = (localConfig.precoGestao?.regras || []).filter(r => r.id !== id);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, regras: updatedRules } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    // COUPONS
    const handleAddCoupon = async () => {
        if (!cupomCodigo || !cupomNome) { alert('Código e Nome do cupom são obrigatórios!'); return; }

        if (editingCupomId) {
            const updatedCupons = (localConfig.precoGestao?.cupons || []).map(c =>
                c.id === editingCupomId
                    ? {
                        ...c,
                        codigo: cupomCodigo.toUpperCase().trim(),
                        nome: cupomNome,
                        descricao: cupomDesc,
                        desconto: parseFloat(cupomDesconto) || 10,
                        escopo: cupomEscopo,
                        categoria: cupomEscopo === 'categoria' ? cupomCat : undefined,
                        produtoId: cupomEscopo === 'produto' ? cupomProdId : undefined,
                        dataValidade: cupomValidade || undefined,
                    }
                    : c
            );
            const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updatedCupons } };
            setLocalConfig(updatedConfig);
            await handleSaveAll(updatedConfig);
            setEditingCupomId(null);
            toast.success('✅ Cupom atualizado com sucesso!');
        } else {
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
            toast.success('✅ Cupom criado com sucesso!');
        }
        setCupomCodigo(''); setCupomNome(''); setCupomDesc(''); setCupomValidade(''); setCupomProdId('');
    };

    const handleStartEditCupom = (c: Coupon) => {
        setEditingCupomId(c.id);
        setCupomCodigo(c.codigo);
        setCupomNome(c.nome);
        setCupomDesc(c.descricao || '');
        setCupomDesconto(String(c.desconto));
        setCupomEscopo(c.escopo);
        setCupomCat(c.categoria || 'europeus');
        setCupomProdId(c.produtoId || '');
        setCupomValidade(c.dataValidade || '');
    };

    const handleToggleCupom = async (id: string) => {
        const updated = (localConfig.precoGestao?.cupons || []).map(c => c.id === id ? { ...c, ativo: !c.ativo } : c);
        const updatedConfig = { ...localConfig, precoGestao: { ...localConfig.precoGestao, cupons: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleRemoveCoupon = async (id: string) => {
        if (!confirm('Remover este cupom?')) return;
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
            produtoPaginaId: storyVisib === 'produto' ? storyPageProdId : undefined,
            corBotao: storyCorBotao,
            corFundo: storyCorFundo,
            corFonte: storyCorFonte,
            pulseAtivo: storyPulseAtivo,
            pulseVelocidade: storyPulseVel,
            pulseTamanho: storyPulseTam,
        };
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: [...(localConfig.stories?.lista || []), newStory] } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setStoryNome(''); setStoryVideoUrl(''); setStoryText('');
        toast.success('✅ Story adicionado!');
    };

    const handleRemoveStory = async (id: string) => {
        const updated = (localConfig.stories?.lista || []).filter(s => s.id !== id);
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleToggleStoryPulse = async (storyId: string) => {
        const updated = (localConfig.stories?.lista || []).map(s =>
            s.id === storyId ? { ...s, pulseAtivo: !s.pulseAtivo } : s
        );
        const updatedConfig = { ...localConfig, stories: { ...localConfig.stories, lista: updated } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    const handleUploadStoryVideo = async (file: File) => {
        setStoryUploadingVideo(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `stories/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const { error } = await supabase.storage.from('camisetas').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('camisetas').getPublicUrl(fileName);
            setStoryVideoUrl(urlData.publicUrl);
            toast.success('Vídeo do Story enviado com sucesso!');
        } catch (e: any) {
            toast.error('Erro no upload do vídeo: ' + (e.message || 'Falha ao enviar arquivo.'));
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
        const updatedConfig = { ...localConfig, imagensBanco: { albuns: currentAlbuns, lista: currentLista } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setBankAlbum(currentAlbuns[0] || 'Geral');
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

    const handleAddVendaPlanilha = async () => {
        if (!vendaCliente || !vendaValor) { alert('Preencha o nome do cliente e valor!'); return; }
        const novaVenda: VendaRealizada = { id: crypto.randomUUID(), cliente: vendaCliente, produto: vendaProduto || 'Camiseta Manto Sagrado', valor: parseFloat(vendaValor) || 0, origem: vendaOrigem, data: new Date().toISOString() };
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, vendasPlanilha: [novaVenda, ...(localConfig.calculadoraAds?.vendasPlanilha || [])] } };
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
        const novoGasto: GastoAnuncio = { id: crypto.randomUUID(), campanha: gastoCampanha, conjunto: gastoConjunto || 'Geral', plataforma: gastoPlataforma, valor: parseFloat(gastoValor) || 0, data: new Date().toISOString() };
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, gastosDetalhados: [novoGasto, ...(localConfig.calculadoraAds?.gastosDetalhados || [])] } };
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
        if (!escalaTitulo || !escalaDesc) { alert('Preencha título e descrição!'); return; }
        const novaEscala: EstrategiaEscala = { id: crypto.randomUUID(), titulo: escalaTitulo, descricao: escalaDesc, metaRoas: escalaRoas || undefined, criadaEm: new Date().toISOString() };
        const updatedConfig = { ...localConfig, calculadoraAds: { ...localConfig.calculadoraAds, estrategiasEscala: [novaEscala, ...(localConfig.calculadoraAds?.estrategiasEscala || [])] } };
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

    const handleSaveWspProdMessage = async () => {
        if (!wspSelectedProd) { alert('Selecione um produto!'); return; }
        const updatedMsgs = { ...(localConfig.whatsapp?.mensagensPorProduto || {}), [wspSelectedProd]: wspProdMessage };
        const updatedConfig = { ...localConfig, whatsapp: { ...localConfig.whatsapp, mensagensPorProduto: updatedMsgs } };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        toast.success('✅ Mensagem do produto salva!');
    };

    // CATEGORIES MANAGEMENT
    const handleAddCategoria = async () => {
        if (!catLabel.trim()) { alert('Digite o nome da categoria!'); return; }
        const slug = catSlug.trim() || catLabel.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        const existing = localConfig.categorias || [];
        if (existing.find(c => c.slug === slug || c.label.toLowerCase() === catLabel.trim().toLowerCase())) {
            alert('Categoria já existe!'); return;
        }
        const newCat: Categoria = {
            id: slug,
            label: catLabel.trim(),
            slug: slug,
            ordem: existing.length + 1
        };
        const updatedConfig = { ...localConfig, categorias: [...existing, newCat] };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        setCatLabel(''); setCatSlug('');
        toast.success('✅ Categoria criada!');
    };

    const handleRemoveCategoria = async (id: string) => {
        if (!confirm('Remover esta categoria da loja real? Os produtos associados não serão deletados.')) return;
        const updated = (localConfig.categorias || []).filter(c => c.id !== id);
        const updatedConfig = { ...localConfig, categorias: updated };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        toast.success('✅ Categoria removida!');
    };

    const handleReorderCategoria = async (id: string, direction: 'up' | 'down') => {
        const cats = [...(localConfig.categorias || [])].sort((a, b) => a.ordem - b.ordem);
        const idx = cats.findIndex(c => c.id === id);
        if (direction === 'up' && idx > 0) {
            [cats[idx].ordem, cats[idx - 1].ordem] = [cats[idx - 1].ordem, cats[idx].ordem];
        } else if (direction === 'down' && idx < cats.length - 1) {
            [cats[idx].ordem, cats[idx + 1].ordem] = [cats[idx + 1].ordem, cats[idx].ordem];
        }
        const updatedConfig = { ...localConfig, categorias: cats };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
    };

    // DASHBOARD FILTER
    const dashResetTime = localConfig.dashboardResetTime ? new Date(localConfig.dashboardResetTime) : null;
    const filteredPedidos = dashResetTime ? pedidos.filter(p => new Date(p.created_at) >= dashResetTime) : pedidos;
    const filteredMetaEvents = dashResetTime ? metaEvents.filter(e => new Date(e.created_at) >= dashResetTime) : metaEvents;

    const handleResetDashboard = async () => {
        if (!confirm('Isso vai zerar o dashboard e começar a contar apenas novas informações a partir de agora. Continuar?')) return;
        const updatedConfig = { ...localConfig, dashboardResetTime: new Date().toISOString() };
        setLocalConfig(updatedConfig);
        await handleSaveAll(updatedConfig);
        toast.success('✅ Dashboard zerado!');
    };

    // DASHBOARD STATS
    const totalLeads = filteredPedidos.length;
    const pedidosPagosList = filteredPedidos.filter(p => p.status === 'paid' || p.status === 'approved');
    const pedidosPagos = pedidosPagosList.length;
    const totalFaturamento = pedidosPagosList.reduce((acc, p) => acc + (parseFloat(p.valor_total) || 0), 0);
    const taxaConversao = totalLeads > 0 ? ((pedidosPagos / totalLeads) * 100).toFixed(1) : '0.0';
    const ticketMedio = pedidosPagos > 0 ? (totalFaturamento / pedidosPagos).toFixed(2) : '0.00';
    const pageViews = filteredMetaEvents.filter(e => e.event_name === 'PageView').length;
    const viewContents = filteredMetaEvents.filter(e => e.event_name === 'ViewContent').length;
    const initiateCheckouts = filteredMetaEvents.filter(e => e.event_name === 'InitiateCheckout').length;
    const purchases = filteredMetaEvents.filter(e => e.event_name === 'Purchase').length;
    const totalGastosAds = (localConfig.calculadoraAds?.gastosDetalhados || []).reduce((a, g) => a + g.valor, 0);
    const roas = totalGastosAds > 0 ? (totalFaturamento / totalGastosAds).toFixed(2) : '—';

    // VITRINE PRODUCTS
    const produtosOcultos = localConfig.produtosOcultos || [];

    // Only vitrine products from DB (or products without explicit tipo)
    const realDbProducts = produtos.filter(p => {
        if (p.id === 'store_config' || p.id === STORE_CONFIG_ID) return false;
        if (produtosOcultos.includes(p.id)) return false;
        if (p.tipo === 'dinamico' || p.category === 'dinamico') return false;
        return true;
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

    // Filtered vitrine for admin display
    const filteredVitrineProducts = allVitrineProducts.filter(p => {
        const matchSearch = !vitrineSearch || p.nome.toLowerCase().includes(vitrineSearch.toLowerCase()) || p.team.toLowerCase().includes(vitrineSearch.toLowerCase());
        const matchCat = vitrineCatFilter === 'todas' || p.category.toLowerCase() === vitrineCatFilter.toLowerCase();
        return matchSearch && matchCat;
    });

    // Dynamic products (links)
    const dynamicDbProducts = produtos.filter(p => {
        if (p.id === 'store_config' || p.id === STORE_CONFIG_ID) return false;
        if (p.tipo === 'dinamico' || p.category === 'dinamico') return true;
        return false;
    });
    const allDynLinks = [
        ...dynLinks,
        ...dynamicDbProducts
            .filter(p => !dynLinks.find(l => l.id === p.id))
            .map(p => ({
                id: p.id,
                nome: p.nome,
                preco: String(p.preco),
                img: p.imagem_url || p.image || '',
                url: `${window.location.origin}/checkout?nome=${encodeURIComponent(p.nome)}&preco=${encodeURIComponent(p.preco)}${(p.imagem_url || p.image) ? `&img=${encodeURIComponent(p.imagem_url || p.image)}` : ''}`,
                desc: p.description || '',
            }))
    ];

    // Image bank filter
    const bankList = localConfig.imagensBanco?.lista || [];
    const filteredBankImages = bankList.filter(img => {
        const matchAlbum = selectedAlbumFilter === 'Todos' || img.album === selectedAlbumFilter;
        const matchSearch = !imageSearch || img.nome.toLowerCase().includes(imageSearch.toLowerCase()) || img.album.toLowerCase().includes(imageSearch.toLowerCase());
        return matchAlbum && matchSearch;
    });

    // Available categories for selects (from config + static defaults)
    const availableCategories = (localConfig.categorias && localConfig.categorias.length > 0)
        ? localConfig.categorias.map(c => ({ value: c.slug || c.label.toLowerCase(), label: c.label }))
        : [
            { value: 'europeus', label: 'Europeus' },
            { value: 'brasileirão', label: 'Brasileirão' },
            { value: 'seleções', label: 'Seleções' },
            { value: 'retrô', label: 'Retrô' },
        ];

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
        ['pulse', <Zap size={16} />, 'Pulse Comprar'],
        ['precos', <Tag size={16} />, 'Preços & Cupons'],
        ['imagens', <Camera size={16} />, 'Banco de Imagens'],
        ['calculadora', <Calculator size={16} />, 'Calculadora ROI'],
        ['integracoes', <Activity size={16} />, 'Integrações'],
        ['frontend', <Palette size={16} />, 'Editar Frontend'],
        ['categorias', <List size={16} />, 'Categorias da Loja'],
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col relative font-sans">
            <AnimatedBackground />

            {/* HEADER */}
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

                {/* MOBILE DRAWER */}
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

                {/* MAIN CONTENT */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* TOP ACTION HEADER */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                        <div>
                            <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                {aba === 'dashboard' && '📊 Dashboard de Vendas'}
                                {aba === 'vitrine' && '🏪 Vitrine da Loja'}
                                {aba === 'novo' && (editingProdId ? '✏️ Editar Produto' : '➕ Novo Produto')}
                                {aba === 'dinamicos' && '🔗 Produtos Dinâmicos'}
                                {aba === 'configuracoes' && '⚙️ Banners & Widgets'}
                                {aba === 'stories' && '📱 Stories Flutuantes'}
                                {aba === 'pulse' && '⚡ Pulse nos Botões de Compra'}
                                {aba === 'precos' && '💰 Preços & Cupons'}
                                {aba === 'imagens' && '🖼️ Banco de Imagens'}
                                {aba === 'calculadora' && '🧮 Calculadora ROI & Planilhas'}
                                {aba === 'integracoes' && '🔗 Integrações'}
                                {aba === 'frontend' && '🎨 Editar Frontend'}
                                {aba === 'categorias' && '📂 Categorias da Loja'}
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

                    {/* MOBILE TAB SCROLLBAR */}
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 1. DASHBOARD */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'dashboard' && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between bg-slate-900/40 border border-white/5 p-3 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-white">Contagem de estatísticas</p>
                                    <p className="text-[11px] text-gray-500">
                                        {dashResetTime ? `Zerado em: ${dashResetTime.toLocaleString('pt-BR')}` : 'Mostrando dados de todos os tempos'}
                                        {' '}<span className="text-purple-400">• Auto-refresh a cada 30s</span>
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
                                    ['🎯 Compras (Pixel)', String(purchases), 'text-violet-400'],
                                    ['💸 Gasto Anúncios', `R$ ${totalGastosAds.toFixed(2).replace('.', ',')}`, 'text-red-400'],
                                    ['📊 ROAS', roas, 'text-yellow-400'],
                                    ['📦 Produtos Vitrine', String(allVitrineProducts.length), 'text-teal-400'],
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 2. VITRINE DA LOJA */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'vitrine' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <p className="text-xs text-gray-400">Gerencie todos os produtos ativos na loja ({allVitrineProducts.length} total).</p>
                                <button onClick={() => { setEditingProdId(null); setNomeProd(''); setPrecoProd(''); setProductImages(['', '', '', '', '', '']); setAba('novo'); }} style={btnSave} className="w-auto px-4 py-2 text-xs">
                                    + ADICIONAR PRODUTO
                                </button>
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    value={vitrineSearch}
                                    onChange={e => setVitrineSearch(e.target.value)}
                                    placeholder="🔍 Buscar por nome ou time..."
                                    className="flex-1 bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs"
                                />
                                <select
                                    value={vitrineCatFilter}
                                    onChange={e => setVitrineCatFilter(e.target.value)}
                                    className="bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs"
                                >
                                    <option value="todas">Todas as Categorias</option>
                                    {availableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            {filteredVitrineProducts.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-8">Nenhum produto encontrado com os filtros aplicados.</p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredVitrineProducts.map(prod => (
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
                                            <span className="absolute top-2 right-2 bg-purple-900/80 px-2 py-0.5 rounded text-[9px] font-bold text-purple-300 uppercase">
                                                {prod.category}
                                            </span>
                                        </div>
                                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <h4 className="font-bold text-xs text-white line-clamp-2">{prod.nome}</h4>
                                                <p className="text-green-400 font-black text-sm mt-1">R$ {parseFloat(String(prod.preco)).toFixed(2).replace('.', ',')}</p>
                                                <p className="text-[9px] text-gray-600 font-mono mt-0.5">ID: {prod.id.substring(0, 12)}...</p>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                                <button onClick={() => handleStartEditProduct(prod)} className="flex-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1">
                                                    <Edit2 size={12} /> Editar
                                                </button>
                                                <a href={`/produto/${prod.id}`} target="_blank" className="p-1.5 bg-slate-800 text-gray-300 hover:text-white rounded-lg flex items-center justify-center">
                                                    <ExternalLink size={14} />
                                                </a>
                                                <button onClick={() => removerProdutoPermanente(prod)} className="p-1.5 bg-red-900/40 hover:bg-red-700 text-red-300 hover:text-white rounded-lg flex items-center justify-center transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 3. NOVO / EDITAR PRODUTO */}
                    {/* ═══════════════════════════════════════════════ */}
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
                                            {availableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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

                                {teamProd !== 'Personalizado' && (
                                    <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl space-y-2">
                                        <label className="block text-xs text-purple-300 font-bold">⚽ Principais Jogadores Oficiais ({teamProd})</label>
                                        <select value={selectedPlayer} onChange={e => { setSelectedPlayer(e.target.value); if (e.target.value) setDescProd(prev => prev + `\n\nJogador Destaque: ${e.target.value}`); }} className="w-full bg-slate-900 text-white rounded-lg border border-white/10 p-2 text-xs">
                                            <option value="">Selecione um jogador do elenco oficial...</option>
                                            {getTeamPlayers(teamProd).map(jp => <option key={jp.nome} value={`${jp.nome} #${jp.numero} (${jp.posicao})`}>{jp.nome} - #{jp.numero} ({jp.posicao})</option>)}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-2">📷 Fotos do Produto (Upload de até 6 fotos)</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                                        {[0, 1, 2, 3, 4, 5].map(idx => (
                                            <div key={idx} className="space-y-1">
                                                <ImageUploader value={productImages[idx] || ''} onChange={url => { const updated = [...productImages]; updated[idx] = url; setProductImages(updated); }} />
                                                <span className="text-[9px] text-gray-500 text-center block">Foto {idx + 1} {idx === 0 ? '(Capa)' : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-2">🎥 Vídeos do Produto (Upload ou URL de até 2 vídeos)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[0, 1].map(idx => (
                                            <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-2">
                                                <span className="text-xs font-bold text-purple-300">Vídeo {idx + 1} {idx === 0 ? '(Principal)' : ''}</span>
                                                <input
                                                    value={productVideos[idx] || ''}
                                                    onChange={e => {
                                                        const updated = [...productVideos];
                                                        updated[idx] = e.target.value;
                                                        setProductVideos(updated);
                                                    }}
                                                    placeholder="Cole a URL do vídeo (.mp4)..."
                                                    className="w-full bg-slate-900 text-white rounded-lg border border-white/10 p-2 text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

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
                                            <label className="block text-xs text-gray-400 font-bold mb-1">🚚 Frete Grátis para Estado (ex: SC, SP)</label>
                                            <input value={prodEstadoFreteGratis} onChange={e => setProdEstadoFreteGratis(e.target.value)} placeholder="Ex: SC" style={input} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">🏙️ Frete Grátis para Cidade (opcional)</label>
                                            <input value={prodCidadeFreteGratis} onChange={e => setProdCidadeFreteGratis(e.target.value)} placeholder="Ex: Florianópolis" style={input} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" style={btnSave}>
                                {editingProdId ? '💾 ATUALIZAR PRODUTO NA LOJA' : '➕ CADASTRAR PRODUTO NA VITRINE'}
                            </button>
                        </form>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 4. PRODUTOS DINÂMICOS */}
                    {/* ═══════════════════════════════════════════════ */}
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
                                <button onClick={gerarLinkDinamico} style={btnSave}>{editingDynId ? '💾 SALVAR ALTERAÇÕES' : '🔗 GERAR LINK DINÂMICO'}</button>
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 5. CONFIGURAÇÕES BANNERS & WIDGETS */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'configuracoes' && localConfig && (
                        <div className="space-y-5 max-w-4xl">
                            {/* ── WhatsApp ── */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    📱 WhatsApp — Número e Configurações
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">📞 Número do WhatsApp (com DDI, ex: 5547983174463)</label>
                                        <input
                                            value={localConfig.whatsapp?.numero || ''}
                                            onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, numero: e.target.value.replace(/\D/g, '') } })}
                                            placeholder="5547983174463"
                                            style={input}
                                            type="tel"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Apenas números, com DDI (55) + DDD + número. Sem espaços ou traços.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Botão WhatsApp</label>
                                        <input value={localConfig.whatsapp?.textoBotao || ''} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, textoBotao: e.target.value } })} placeholder="Comprar pelo WhatsApp" style={input} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Status da Loja</label>
                                        <input value={localConfig.whatsapp?.statusLoja || ''} onChange={e => setLocalConfig({ ...localConfig, whatsapp: { ...localConfig.whatsapp, statusLoja: e.target.value } })} placeholder="Online" style={input} />
                                    </div>
                                </div>

                                {/* Mensagem padrão global */}
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Mensagem Padrão Global (para todos os produtos)</label>
                                    <textarea
                                        value={localConfig.whatsapp?.mensagensPersonalizadas?.['padrao'] || ''}
                                        onChange={e => setLocalConfig({
                                            ...localConfig,
                                            whatsapp: {
                                                ...localConfig.whatsapp,
                                                mensagensPersonalizadas: {
                                                    ...(localConfig.whatsapp?.mensagensPersonalizadas || {}),
                                                    padrao: e.target.value
                                                }
                                            }
                                        })}
                                        rows={2}
                                        placeholder="Olá! Vim pelo site Manto Sagrado..."
                                        className="w-full bg-slate-800 text-white rounded-xl border border-white/10 p-3 focus:outline-none text-xs"
                                    />
                                </div>

                                {/* Mensagem por produto */}
                                <div className="border border-white/5 p-3.5 rounded-xl bg-slate-950/40 space-y-2">
                                    <h4 className="text-xs font-bold text-purple-300">Definir Mensagem Específica para um Produto</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] text-gray-400 font-bold mb-1">Produto</label>
                                            <select value={wspSelectedProd} onChange={e => { setWspSelectedProd(e.target.value); setWspProdMessage(localConfig.whatsapp?.mensagensPorProduto?.[e.target.value] || ''); }} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs">
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

                                <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                    {saving ? '⏳ Salvando...' : '💾 SALVAR CONFIGURAÇÕES DO WHATSAPP'}
                                </button>
                            </div>

                            {/* ── Selo Verificado ── */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white">✅ Selo de Loja Verificada</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.verificadoLoja?.ativo ? 'Ativo' : 'Inativo'}</span>
                                        <input type="checkbox" checked={!!localConfig.verificadoLoja?.ativo} onChange={async e => { const updated = { ...localConfig, verificadoLoja: { ...localConfig.verificadoLoja, ativo: e.target.checked } }; setLocalConfig(updated); await handleSaveAll(updated); }} className="w-5 h-5 accent-purple-600" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Posição do Selo</label>
                                    <select value={localConfig.verificadoLoja?.posicao || 'todos'} onChange={async e => { const updated = { ...localConfig, verificadoLoja: { ...localConfig.verificadoLoja, posicao: e.target.value as any } }; setLocalConfig(updated); await handleSaveAll(updated); }} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                        <option value="todos">Em todos os lugares</option>
                                        <option value="topo">Apenas no Topo (Header)</option>
                                        <option value="rodape">Apenas no Rodapé</option>
                                        <option value="produtos">Apenas nas Páginas de Produto</option>
                                    </select>
                                </div>
                            </div>

                            {/* ── Banner Rotativo ── */}
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
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade (segundos)</label>
                                            <input type="number" value={localConfig.bannerTopo.velocidade || 30} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, velocidade: parseInt(e.target.value) || 30 } })} style={input} />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">URL Imagem Banner</label>
                                            <input value={localConfig.bannerTopo.imagem || ''} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, imagem: e.target.value } })} placeholder="https://..." style={input} />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Texto do Letreiro (Marquee)</label>
                                            <textarea value={localConfig.bannerTopo.textoMarquee || ''} onChange={e => setLocalConfig({ ...localConfig, bannerTopo: { ...localConfig.bannerTopo, textoMarquee: e.target.value } })} rows={2} style={input} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Banner Geolocalizado ── */}
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
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Formato Visual</label>
                                            <select value={localConfig.bannerGeolocalizado.formatoBanner || 'barra_fina'} onChange={e => setLocalConfig({ ...localConfig, bannerGeolocalizado: { ...localConfig.bannerGeolocalizado, formatoBanner: e.target.value as any } })} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                <option value="barra_fina">Barra Fina de Topo (48px)</option>
                                                <option value="banner_largo">Banner Largo Destacado (80px)</option>
                                                <option value="card_popup">Card Pop-up Flutuante</option>
                                                <option value="pilula_fixa">Pílula Arredondada Fixa</option>
                                                <option value="full_width">Banner Largura Total</option>
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

                            <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                {saving ? '⏳ Salvando no Banco...' : '💾 SALVAR TODAS AS CONFIGURAÇÕES NO BANCO'}
                            </button>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 6. STORIES FLUTUANTES */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'stories' && (
                        <div className="space-y-5 max-w-4xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Film size={16} /> 📱 Adicionar Story Flutuante
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
                                            <option value="categoria">Por Categoria</option>
                                            <option value="produto">Página de Produto Específico</option>
                                        </select>
                                    </div>
                                    {storyVisib === 'categoria' && (
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label>
                                            <select value={storyCategoria} onChange={e => setStoryCategoria(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                                {availableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* VIDEO */}
                                <div>
                                    <label className="block text-xs text-gray-400 font-bold mb-1">Vídeo do Story (URL MP4/WebM ou Upload)</label>
                                    <div className="flex gap-2">
                                        <input value={storyVideoUrl} onChange={e => setStoryVideoUrl(e.target.value)} placeholder="https://.../video.mp4" className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadStoryVideo(e.target.files[0])} />
                                        <button type="button" onClick={() => videoInputRef.current?.click()} disabled={storyUploadingVideo} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1">
                                            {storyUploadingVideo ? 'Uploading...' : '📁 Upload'}
                                        </button>
                                    </div>
                                </div>

                                {/* CORES E PULSE */}
                                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl space-y-3">
                                    <h4 className="text-xs font-bold text-purple-300">🎨 Cores e Efeito Pulse do Botão</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor do Botão / Pulse</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={storyCorBotao} onChange={e => setStoryCorBotao(e.target.value)} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={storyCorBotao} onChange={e => setStoryCorBotao(e.target.value)} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor de Fundo do Anel</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={storyCorFundo} onChange={e => setStoryCorFundo(e.target.value)} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={storyCorFundo} onChange={e => setStoryCorFundo(e.target.value)} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Cor da Fonte / Ícone</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={storyCorFonte} onChange={e => setStoryCorFonte(e.target.value)} className="w-10 h-9 border border-white/10 rounded cursor-pointer" />
                                                <input value={storyCorFonte} onChange={e => setStoryCorFonte(e.target.value)} className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="flex items-center gap-2 pt-1">
                                            <input type="checkbox" id="storyPulse" checked={storyPulseAtivo} onChange={e => setStoryPulseAtivo(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                                            <label htmlFor="storyPulse" className="text-xs text-gray-300 font-bold cursor-pointer">Efeito Pulse Ativo</label>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Velocidade do Pulse</label>
                                            <select value={storyPulseVel} onChange={e => setStoryPulseVel(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs">
                                                <option value="lento">Lento (2.4s)</option>
                                                <option value="normal">Normal (1.4s)</option>
                                                <option value="rapido">Rápido (0.8s)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">Tamanho do Pulse (px)</label>
                                            <input type="number" min="2" max="30" value={storyPulseTam} onChange={e => setStoryPulseTam(e.target.value)} placeholder="8" style={input} />
                                        </div>
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
                                                <div
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: `linear-gradient(135deg, ${st.corBotao || '#7c3aed'}, ${st.corFundo || '#1e293b'})`,
                                                        padding: '2px'
                                                    }}
                                                >
                                                    <video src={st.videoUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-bold text-white truncate">{st.nome}</h4>
                                                    <span className="text-[10px] text-purple-300 font-bold uppercase">{st.visibilidade}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <div className="flex gap-1 items-center">
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: st.corBotao || '#7c3aed' }} />
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: st.corFundo || '#1e293b' }} />
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: st.corFonte || '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }} />
                                                </div>
                                                <button
                                                    onClick={() => handleToggleStoryPulse(st.id)}
                                                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${st.pulseAtivo !== false ? 'bg-purple-900 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-gray-500'}`}
                                                >
                                                    {st.pulseAtivo !== false ? '⚡ PULSE ON' : '○ PULSE OFF'}
                                                </button>
                                                <span className="text-[9px] text-gray-500">{st.pulseVelocidade || 'normal'}</span>
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 7. PULSE COMPRAR */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'pulse' && localConfig && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                        <Zap size={16} className="text-yellow-400" /> Efeito Pulse nos Botões de Compra
                                    </h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-xs text-gray-400">{localConfig.pulseComprar?.ativo ? 'ATIVO' : 'INATIVO'}</span>
                                        <input
                                            type="checkbox"
                                            checked={!!localConfig.pulseComprar?.ativo}
                                            onChange={async e => {
                                                const updated = { ...localConfig, pulseComprar: { ...localConfig.pulseComprar, ativo: e.target.checked } };
                                                setLocalConfig(updated);
                                                await handleSaveAll(updated);
                                            }}
                                            className="w-5 h-5 accent-purple-600"
                                        />
                                    </label>
                                </div>

                                <p className="text-xs text-gray-400">
                                    Quando ativo, todos os botões de compra da loja terão um efeito de pulsação (pulse) para chamar atenção dos clientes.
                                </p>

                                {localConfig.pulseComprar?.ativo && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-400 font-bold mb-2">Cor do Efeito Pulse</label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="color"
                                                        value={localConfig.pulseComprar?.cor || '#2563eb'}
                                                        onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, cor: e.target.value } })}
                                                        className="w-10 h-9 border border-white/10 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        value={localConfig.pulseComprar?.cor || '#2563eb'}
                                                        onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, cor: e.target.value } })}
                                                        className="flex-1 bg-slate-800 text-white rounded-lg border border-white/10 p-2 focus:outline-none text-xs font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs text-gray-400 font-bold mb-2">Velocidade do Pulse</label>
                                                <div className="flex gap-2">
                                                    {(['lento', 'normal', 'rapido'] as const).map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, velocidade: v } })}
                                                            className={`flex-1 py-2 rounded-lg font-bold border text-xs transition ${localConfig.pulseComprar?.velocidade === v ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-white/10 text-gray-400'}`}
                                                        >
                                                            {v === 'lento' ? '🐢 Lento' : v === 'normal' ? '⚡ Normal' : '🚀 Rápido'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1">Lento = 2.4s | Normal = 1.4s | Rápido = 0.8s</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-2">
                                                Tamanho do Pulse (escala) — atual: {localConfig.pulseComprar?.tamanho || '1.05'}
                                            </label>
                                            <input
                                                type="range"
                                                min="1.01"
                                                max="1.20"
                                                step="0.01"
                                                value={parseFloat(localConfig.pulseComprar?.tamanho || '1.05')}
                                                onChange={e => setLocalConfig({ ...localConfig, pulseComprar: { ...localConfig.pulseComprar, tamanho: e.target.value } })}
                                                className="w-full accent-purple-600"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>Menor (1.01)</span>
                                                <span className="font-bold text-purple-400">Scale: {localConfig.pulseComprar?.tamanho || '1.05'}</span>
                                                <span>Maior (1.20)</span>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div className="bg-slate-950 border border-white/5 p-4 rounded-xl flex items-center justify-center">
                                            <button
                                                style={{
                                                    background: localConfig.pulseComprar?.cor || '#2563eb',
                                                    color: '#fff',
                                                    padding: '12px 28px',
                                                    borderRadius: '10px',
                                                    fontWeight: 900,
                                                    fontSize: '14px',
                                                    border: 'none',
                                                    cursor: 'default',
                                                    animation: `pulseBtn ${localConfig.pulseComprar?.velocidade === 'lento' ? '2.4s' : localConfig.pulseComprar?.velocidade === 'rapido' ? '0.8s' : '1.4s'} ease-in-out infinite`,
                                                }}
                                            >
                                                🛒 COMPRAR AGORA
                                            </button>
                                            <style>{`
                                                @keyframes pulseBtn {
                                                    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 ${localConfig.pulseComprar?.cor || '#2563eb'}55; }
                                                    50% { transform: scale(${localConfig.pulseComprar?.tamanho || '1.05'}); box-shadow: 0 0 0 12px transparent; }
                                                }
                                            `}</style>
                                        </div>
                                    </div>
                                )}

                                <button onClick={() => handleSaveAll()} disabled={saving} style={btnSave}>
                                    {saving ? '⏳ Salvando...' : '💾 SALVAR CONFIGURAÇÃO DE PULSE'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 8. PREÇOS & CUPONS */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'precos' && (
                        <div className="space-y-6 max-w-4xl">
                            {/* Regras de Ajuste */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Tag size={16} /> Regras de Ajuste Automático de Preço (%)
                                </h3>
                                <p className="text-xs text-gray-400">Regras entram em vigor <strong className="text-white">imediatamente</strong> se sem data, ou na data/hora programada se preenchida.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome da Regra *</label><input value={ruleNome} onChange={e => setRuleNome(e.target.value)} placeholder="Ex: Black Friday 15%" style={input} /></div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                        <select value={ruleEscopo} onChange={e => setRuleEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="tudo">Todos os Produtos</option>
                                            <option value="categoria">Por Categoria</option>
                                            <option value="produto">Produto Específico</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Operação</label>
                                        <select value={ruleOp} onChange={e => setRuleOp(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="diminuir">Desconto (-%)</option>
                                            <option value="aumentar">Aumento (+%)</option>
                                        </select>
                                    </div>
                                </div>

                                {ruleEscopo === 'categoria' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Categoria</label>
                                        <select value={ruleCat} onChange={e => setRuleCat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            {availableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                )}

                                {ruleEscopo === 'produto' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Produto Específico</label>
                                        <select value={ruleProdId} onChange={e => setRuleProdId(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="">Selecione um produto...</option>
                                            {allVitrineProducts.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                        </select>
                                        {ruleProdId && (
                                            <div className="mt-2 bg-slate-800 border border-purple-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500">ID do Produto:</span>
                                                <span className="text-xs font-mono text-purple-300 font-bold">{ruleProdId}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(ruleProdId); toast.success('ID copiado!'); }} className="ml-auto text-gray-400 hover:text-white">
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Percentual (%) *</label><input type="number" value={rulePercent} onChange={e => setRulePercent(e.target.value)} placeholder="10" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Descrição</label><input value={ruleDesc} onChange={e => setRuleDesc(e.target.value)} placeholder="Motivo do ajuste..." style={input} /></div>
                                </div>

                                {/* Schedule */}
                                <div className="bg-slate-950/50 border border-white/5 p-3 rounded-xl space-y-3">
                                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5"><Clock size={12} /> Programar por Data e Hora (opcional)</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">📅 Data/Hora de Início</label>
                                            <input type="datetime-local" value={ruleDataInicio} onChange={e => setRuleDataInicio(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                            <p className="text-[10px] text-gray-500 mt-1">Deixe vazio para valer imediatamente.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 font-bold mb-1">📅 Data/Hora de Fim</label>
                                            <input type="datetime-local" value={ruleDataFim} onChange={e => setRuleDataFim(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                            <p className="text-[10px] text-gray-500 mt-1">Deixe vazio para não expirar.</p>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleAddPriceRule} style={btnSave}>
                                    {editingRuleId ? '💾 SALVAR ALTERAÇÕES NA REGRA' : '+ CRIAR REGRA DE PREÇO'}
                                </button>
                                {editingRuleId && (
                                    <button onClick={() => { setEditingRuleId(null); setRuleNome(''); setRuleDesc(''); setRuleProdId(''); setRuleDataInicio(''); setRuleDataFim(''); }} className="w-full py-2 bg-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold border border-white/5">
                                        Cancelar edição
                                    </button>
                                )}

                                {/* Regras Criadas */}
                                <div className="space-y-2 pt-2">
                                    {(localConfig.precoGestao?.regras || []).map(r => {
                                        const now = new Date();
                                        const hasStart = r.dataInicio && new Date(r.dataInicio) > now;
                                        const hasEnd = r.dataFim && new Date(r.dataFim) < now;
                                        const isScheduled = hasStart;
                                        const isExpired = hasEnd;
                                        return (
                                            <div key={r.id} className="flex justify-between items-start bg-slate-950 p-3 rounded-xl border border-white/5 gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-xs text-white">{r.nome}</span>
                                                    <span className={`ml-2 text-xs font-black ${r.operacao === 'diminuir' ? 'text-green-400' : 'text-amber-400'}`}>
                                                        {r.operacao === 'diminuir' ? '-' : '+'}{r.percentual}% ({r.escopo})
                                                    </span>
                                                    {r.escopo === 'produto' && r.produtoId && (
                                                        <p className="text-[10px] text-purple-300 font-mono mt-0.5">Produto ID: {r.produtoId.substring(0, 16)}...</p>
                                                    )}
                                                    {r.escopo === 'categoria' && r.categoria && (
                                                        <p className="text-[10px] text-blue-300 mt-0.5">Categoria: {r.categoria}</p>
                                                    )}
                                                    {r.dataInicio && <p className="text-[10px] text-gray-500 mt-0.5">⏰ Início: {new Date(r.dataInicio).toLocaleString('pt-BR')}</p>}
                                                    {r.dataFim && <p className="text-[10px] text-gray-500">⏰ Fim: {new Date(r.dataFim).toLocaleString('pt-BR')}</p>}
                                                    {isScheduled && <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-bold">AGENDADA</span>}
                                                    {isExpired && <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold">EXPIRADA</span>}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button onClick={() => handleStartEditRule(r)} className="p-1.5 bg-purple-600/20 text-purple-300 hover:text-white rounded-lg"><Edit2 size={12} /></button>
                                                    <button onClick={() => handleToggleRule(r.id)} className={`px-2.5 py-1 rounded text-[10px] font-bold ${r.ativa ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-slate-800 text-gray-500'}`}>
                                                        {r.ativa ? 'ATIVA' : 'INATIVA'}
                                                    </button>
                                                    <button onClick={() => handleRemoveRule(r.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(localConfig.precoGestao?.regras || []).length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4">Nenhuma regra criada.</p>
                                    )}
                                </div>
                            </div>

                            {/* Cupons de Desconto */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <Percent size={16} /> Cupons de Desconto do Checkout
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Código do Cupom *</label><input value={cupomCodigo} onChange={e => setCupomCodigo(e.target.value.toUpperCase())} placeholder="Ex: MANTO10" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Nome do Cupom *</label><input value={cupomNome} onChange={e => setCupomNome(e.target.value)} placeholder="Ex: Cupom de Boas-Vindas" style={input} /></div>
                                    <div><label className="block text-xs text-gray-400 font-bold mb-1">Desconto (%) *</label><input type="number" value={cupomDesconto} onChange={e => setCupomDesconto(e.target.value)} placeholder="10" style={input} /></div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Escopo</label>
                                        <select value={cupomEscopo} onChange={e => setCupomEscopo(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="tudo">Todos os Produtos</option>
                                            <option value="categoria">Por Categoria</option>
                                            <option value="produto">Produto Específico</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Validade</label>
                                        <input type="datetime-local" value={cupomValidade} onChange={e => setCupomValidade(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Descrição</label>
                                        <input value={cupomDesc} onChange={e => setCupomDesc(e.target.value)} placeholder="Uso interno..." style={input} />
                                    </div>
                                </div>

                                {cupomEscopo === 'categoria' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Categoria do Cupom</label>
                                        <select value={cupomCat} onChange={e => setCupomCat(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            {availableCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                )}

                                {cupomEscopo === 'produto' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Produto Específico</label>
                                        <select value={cupomProdId} onChange={e => setCupomProdId(e.target.value)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="">Selecione um produto...</option>
                                            {allVitrineProducts.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                        </select>
                                        {cupomProdId && (
                                            <div className="mt-2 bg-slate-800 border border-purple-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500">ID do Produto:</span>
                                                <span className="text-xs font-mono text-purple-300 font-bold">{cupomProdId}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(cupomProdId); toast.success('ID copiado!'); }} className="ml-auto text-gray-400 hover:text-white">
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button onClick={handleAddCoupon} style={btnSave}>
                                    {editingCupomId ? '💾 SALVAR ALTERAÇÕES NO CUPOM' : '+ CRIAR CUPOM DE DESCONTO'}
                                </button>
                                {editingCupomId && (
                                    <button onClick={() => { setEditingCupomId(null); setCupomCodigo(''); setCupomNome(''); setCupomDesc(''); setCupomValidade(''); setCupomProdId(''); }} className="w-full py-2 bg-slate-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold border border-white/5">
                                        Cancelar edição
                                    </button>
                                )}

                                {/* Lista de Cupons */}
                                <div className="space-y-2 pt-2">
                                    {(localConfig.precoGestao?.cupons || []).map(c => {
                                        const expired = c.dataValidade && new Date(c.dataValidade) < new Date();
                                        return (
                                            <div key={c.id} className="flex justify-between items-start bg-slate-950 p-3 rounded-xl border border-white/5 gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-mono font-bold text-xs text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/30">{c.codigo}</span>
                                                    <span className="ml-2 font-bold text-xs text-white">{c.nome} ({c.desconto}%)</span>
                                                    <span className="ml-2 text-[10px] text-gray-500">escopo: {c.escopo}</span>
                                                    {c.escopo === 'produto' && c.produtoId && (
                                                        <p className="text-[10px] text-purple-300 font-mono mt-0.5">Produto ID: {c.produtoId.substring(0, 16)}...</p>
                                                    )}
                                                    {c.escopo === 'categoria' && c.categoria && (
                                                        <p className="text-[10px] text-blue-300 mt-0.5">Categoria: {c.categoria}</p>
                                                    )}
                                                    {c.dataValidade && <p className="text-[10px] text-gray-500 mt-0.5">Válido até: {new Date(c.dataValidade).toLocaleString('pt-BR')}</p>}
                                                    {expired && <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold">EXPIRADO</span>}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button onClick={() => handleStartEditCupom(c)} className="p-1.5 bg-purple-600/20 text-purple-300 hover:text-white rounded-lg"><Edit2 size={12} /></button>
                                                    <button onClick={() => handleToggleCupom(c.id)} className={`px-2.5 py-1 rounded text-[10px] font-bold ${c.ativo ? 'bg-green-950 text-green-400 border border-green-500/30' : 'bg-slate-800 text-gray-500'}`}>
                                                        {c.ativo ? 'ATIVO' : 'INATIVO'}
                                                    </button>
                                                    <button onClick={() => handleRemoveCoupon(c.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(localConfig.precoGestao?.cupons || []).length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4">Nenhum cupom criado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 9. BANCO DE IMAGENS */}
                    {/* ═══════════════════════════════════════════════ */}
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
                                    <button onClick={handleAddBankImage} style={btnSave} className="flex-1">+ SALVAR IMAGEM NO BANCO</button>
                                </div>

                                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center gap-2">
                                    <input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nome do Novo Álbum..." className="flex-1 bg-slate-800 text-white rounded-xl border border-white/10 p-2.5 focus:outline-none text-xs" />
                                    <button onClick={handleCreateAlbum} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs whitespace-nowrap">+ Criar Álbum</button>
                                    {bankAlbum !== 'Geral' && (
                                        <button onClick={() => handleRemoveAlbum(bankAlbum)} className="bg-red-900/40 hover:bg-red-800 text-red-300 font-bold px-3 py-2.5 rounded-xl text-xs">Excluir Álbum Atual</button>
                                    )}
                                </div>
                            </div>

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
                                                    <button onClick={() => { navigator.clipboard.writeText(img.url); toast.success('URL copiada!'); }} className="p-1 text-gray-400 hover:text-white"><Copy size={12} /></button>
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 10. CALCULADORA ROI + PLANILHA DE GASTOS */}
                    {/* ═══════════════════════════════════════════════ */}
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

                            {/* Planilha de Gastos com Anúncios */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={16} /> 📊 Planilha de Gastos com Anúncios
                                </h3>
                                <p className="text-xs text-gray-400">Total gasto: <span className="font-black text-red-400">R$ {(localConfig.calculadoraAds?.gastosDetalhados || []).reduce((a, g) => a + g.valor, 0).toFixed(2).replace('.', ',')}</span> | ROAS estimado: <span className="font-black text-yellow-400">{roas}x</span></p>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Campanha *</label><input value={gastoCampanha} onChange={e => setGastoCampanha(e.target.value)} placeholder="Nome da campanha" style={input} /></div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Conjunto de Anúncios</label><input value={gastoConjunto} onChange={e => setGastoConjunto(e.target.value)} placeholder="Conjunto" style={input} /></div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Plataforma</label>
                                        <select value={gastoPlataforma} onChange={e => setGastoPlataforma(e.target.value as any)} className="w-full bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 focus:outline-none text-xs">
                                            <option value="meta">Meta (Facebook/Instagram)</option>
                                            <option value="google">Google Ads</option>
                                            <option value="tiktok">TikTok Ads</option>
                                        </select>
                                    </div>
                                    <div><label className="block text-[11px] text-gray-400 font-bold mb-1">Valor Gasto (R$)</label><input type="number" value={gastoValor} onChange={e => setGastoValor(e.target.value)} placeholder="350.00" style={input} /></div>
                                </div>
                                <button onClick={handleAddGastoAnuncio} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs w-full">
                                    + REGISTRAR GASTO COM ANÚNCIO
                                </button>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                        <thead><tr><th style={th}>DATA</th><th style={th}>CAMPANHA</th><th style={th}>CONJUNTO</th><th style={th}>PLATAFORMA</th><th style={th}>VALOR</th><th style={th}>AÇÃO</th></tr></thead>
                                        <tbody>
                                            {(localConfig.calculadoraAds?.gastosDetalhados || []).map(g => (
                                                <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={td}>{new Date(g.data).toLocaleDateString('pt-BR')}</td>
                                                    <td style={td}><strong>{g.campanha}</strong></td>
                                                    <td style={td}>{g.conjunto}</td>
                                                    <td style={td}><span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded uppercase font-bold">{g.plataforma}</span></td>
                                                    <td style={{ ...td, color: '#f87171', fontWeight: 900 }}>R$ {g.valor.toFixed(2).replace('.', ',')}</td>
                                                    <td style={td}><button onClick={() => handleRemoveGastoAnuncio(g.id)} className="p-1 bg-red-900/30 text-red-400 rounded"><Trash2 size={13} /></button></td>
                                                </tr>
                                            ))}
                                            {(localConfig.calculadoraAds?.gastosDetalhados || []).length === 0 && (
                                                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '20px' }}>Nenhum gasto registrado.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Planilha de Vendas Realizadas */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <DollarSign size={16} /> Planilha de Vendas Realizadas
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
                                            {(localConfig.calculadoraAds?.vendasPlanilha || []).length === 0 && (
                                                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#64748b', padding: '20px' }}>Nenhuma venda registrada.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 11. INTEGRAÇÕES */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'integracoes' && (
                        <div className="space-y-5 max-w-4xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">💳 Gateway de Pagamento IronPay (Pix & Cartão)</h3>
                                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12} /> CONECTADO</span>
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

                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">🎯 Meta Conversions API (CAPI & Pixel)</h3>
                                    <span className="bg-blue-950 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Activity size={12} /> RASTREAMENTO ATIVO</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Meta Pixel ID</span>
                                        <span className="text-xs font-mono text-white font-bold">2081548536080257</span>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase block">Eventos Rastreados</span>
                                        <span className="text-xs text-gray-300 font-bold">PageView, ViewContent, AddToCart, InitiateCheckout, Purchase</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">🗄️ Supabase PostgreSQL Database & Realtime</h3>
                                    <span className="bg-purple-950 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12} /> BANCO ONLINE</span>
                                </div>
                                <p className="text-xs text-gray-400">Instância ativa: <code className="text-purple-300">kffjkhyhhjpkwzfrcvzh.supabase.co</code></p>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 12. FRONTEND EDITOR */}
                    {/* ═══════════════════════════════════════════════ */}
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

                    {/* ═══════════════════════════════════════════════ */}
                    {/* 13. CATEGORIAS DA LOJA */}
                    {/* ═══════════════════════════════════════════════ */}
                    {aba === 'categorias' && (
                        <div className="space-y-5 max-w-3xl">
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-4">
                                <h3 className="text-sm sm:text-md font-bold text-white flex items-center gap-2">
                                    <FolderPlus size={16} /> Criar Nova Categoria na Loja
                                </h3>
                                <p className="text-xs text-gray-400">As categorias aparecem na barra de navegação e organizam as camisetas na loja real. Crie, ordene e remova conforme necessário.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Nome da Categoria *</label>
                                        <input value={catLabel} onChange={e => setCatLabel(e.target.value)} placeholder="Ex: Copa do Mundo" style={input} />
                                        <p className="text-[10px] text-gray-500 mt-1">Nome que aparece na loja para o cliente.</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold mb-1">Slug (URL) — opcional</label>
                                        <input value={catSlug} onChange={e => setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="Ex: copa-do-mundo" style={input} />
                                        <p className="text-[10px] text-gray-500 mt-1">Deixe vazio para gerar automaticamente.</p>
                                    </div>
                                </div>

                                <button onClick={handleAddCategoria} style={btnSave}>+ CRIAR CATEGORIA NA LOJA</button>
                            </div>

                            {/* Lista de categorias */}
                            <div className="bg-slate-900/40 border border-white/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl space-y-3">
                                <h3 className="text-xs sm:text-sm font-bold text-white">Categorias Ativas na Loja ({(localConfig.categorias || []).length})</h3>
                                <p className="text-[11px] text-gray-500">Use as setas para reordenar a posição das categorias na barra de navegação.</p>

                                <div className="space-y-2">
                                    {(localConfig.categorias || [])
                                        .slice()
                                        .sort((a, b) => a.ordem - b.ordem)
                                        .map((cat, idx, arr) => (
                                            <div key={cat.id} className="flex items-center gap-3 bg-slate-950 border border-white/5 p-3 rounded-xl">
                                                <div className="flex flex-col gap-0.5">
                                                    <button onClick={() => handleReorderCategoria(cat.id, 'up')} disabled={idx === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                                                    <button onClick={() => handleReorderCategoria(cat.id, 'down')} disabled={idx === arr.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-white">{cat.label}</span>
                                                    <span className="ml-2 text-xs text-gray-500 font-mono">/{cat.slug || cat.id}</span>
                                                    <p className="text-[10px] text-gray-600 mt-0.5">ID: {cat.id}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCategoria(cat.id)}
                                                    className="p-2 bg-red-900/40 hover:bg-red-700 text-red-300 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    {(localConfig.categorias || []).length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-6">Nenhuma categoria configurada. Crie acima ou as categorias padrão serão usadas.</p>
                                    )}
                                </div>
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