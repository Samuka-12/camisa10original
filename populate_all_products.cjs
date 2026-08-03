const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ler o arquivo products.ts e extrair os produtos
const productsFilePath = path.join(__dirname, 'src', 'data', 'products.ts');
const fileContent = fs.readFileSync(productsFilePath, 'utf-8');

function toValidUuid(str) {
  // Se já for um UUID de 36 caracteres com hífens válidos
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  // Se tiver hífens mas partes inválidas, converte para hex preenchido
  const cleanHex = str.replace(/[^0-9a-f]/gi, '').padEnd(32, '0').slice(0, 32);
  return `${cleanHex.slice(0,8)}-${cleanHex.slice(8,12)}-${cleanHex.slice(12,16)}-${cleanHex.slice(16,20)}-${cleanHex.slice(20,32)}`;
}

function extractProducts() {
  const products = [];
  const itemRegex = /{\s*id:\s*"([^"]+)",\s*image:\s*`([^`]+)`,\s*images:\s*\[([\s\S]*?)\],\s*name:\s*"([^"]+)",\s*team:\s*"([^"]+)",\s*price:\s*"([^"]+)",\s*priceNum:\s*([\d.]+),\s*category:\s*\[([\s\S]*?)\],\s*sizes:\s*\[([\s\S]*?)\],\s*description:\s*"([^"]+)"/g;

  let m;
  while ((m = itemRegex.exec(fileContent)) !== null) {
    const rawId = m[1];
    const id = toValidUuid(rawId);
    const image = m[2];
    const rawImages = m[3];
    const name = m[4];
    const team = m[5];
    const priceNum = parseFloat(m[7]) || 109.93;
    const rawCategory = m[8];
    const rawSizes = m[9];
    const description = m[10];

    // Extrai links de imagens
    const images = rawImages.split(',').map(s => s.trim().replace(/`/g, '').replace(/"/g, '').replace(/'/g, '')).filter(s => s.startsWith('http'));
    // Extrai categorias
    const categories = rawCategory.split(',').map(s => s.trim().replace(/"/g, '').replace(/'/g, '')).filter(Boolean);
    // Extrai tamanhos
    const sizes = rawSizes.split(',').map(s => s.trim().replace(/"/g, '').replace(/'/g, '')).filter(Boolean);

    products.push({
      id,
      nome: name,
      preco: priceNum,
      imagem_url: image,
      image: image,
      images: JSON.stringify(images),
      description: description + `\n\n<!-- GALLERY:${JSON.stringify({ images, videos: [], sizes })} -->`,
      category: categories[0] || 'europeus',
      team: team,
      sizes: sizes,
      tipo: 'vitrine'
    });
  }

  return products;
}

async function runPopulation() {
  console.log("🚀 Iniciando povoamento da tabela 'produtos' no Supabase...");
  const products = extractProducts();
  console.log(`📦 Encontrados ${products.length} produtos em src/data/products.ts`);

  let successCount = 0;
  let failCount = 0;

  for (const prod of products) {
    const { error } = await supabase.from('produtos').upsert([prod], { onConflict: 'id' });
    if (error) {
      console.warn(`⚠️ Erro ao povoar ${prod.nome}:`, error.message);
      // Fallback para campos básicos
      const basic = {
        id: prod.id,
        nome: prod.nome,
        preco: prod.preco,
        imagem_url: prod.imagem_url,
        image: prod.image,
        category: prod.category,
        team: prod.team,
        description: prod.description
      };
      const { error: fbErr } = await supabase.from('produtos').upsert([basic], { onConflict: 'id' });
      if (fbErr) {
        console.error(`❌ Falha total em ${prod.nome}:`, fbErr.message);
        failCount++;
      } else {
        console.log(`✅ [Fallback OK] ${prod.nome}`);
        successCount++;
      }
    } else {
      console.log(`✅ ${prod.nome}`);
      successCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`✨ POVOAMENTO CONCLUÍDO: ${successCount} salvos no Supabase, ${failCount} falhas.`);
  console.log(`========================================\n`);
}

runPopulation().catch(console.error);
