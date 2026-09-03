/**
 * fix_image_urls.cjs
 * Corrige URLs de imagens com ${BASE_URL}/... literal no banco de dados do Supabase.
 * Substitui pelo URL real: https://xnadtzeyynoblrbncltt.supabase.co/storage/v1/object/public/camisetas/...
 *
 * Execute: node fix_image_urls.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const REAL_BASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co/storage/v1/object/public/camisetas';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fixUrl(url) {
  if (!url) return url;
  // Substituir "${BASE_URL}/xxx" → "https://real/xxx"
  if (typeof url === 'string' && url.includes('${BASE_URL}')) {
    return url.replace(/\${BASE_URL}\//g, REAL_BASE_URL + '/').replace(/\${BASE_URL}/g, REAL_BASE_URL);
  }
  return url;
}

function fixImagesArray(images) {
  if (!images) return images;
  try {
    let arr = images;
    if (typeof arr === 'string') {
      arr = JSON.parse(arr);
    }
    if (!Array.isArray(arr)) return images;
    const fixed = arr.map(fixUrl);
    return JSON.stringify(fixed);
  } catch (_) {
    return images;
  }
}

async function main() {
  console.log('🔍 Buscando produtos com URLs quebradas...');
  
  const { data: products, error } = await supabase
    .from('produtos')
    .select('id, nome, image, imagem_url, images, description');
  
  if (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    return;
  }

  console.log(`📦 ${products.length} produtos encontrados\n`);

  let fixed = 0;
  let skipped = 0;

  for (const p of products) {
    if (p.id === '00000000-0000-0000-0000-000000000000') {
      skipped++;
      continue;
    }

    const needsFix =
      (p.image && p.image.includes('${BASE_URL}')) ||
      (p.imagem_url && p.imagem_url.includes('${BASE_URL}')) ||
      (p.images && JSON.stringify(p.images).includes('${BASE_URL}')) ||
      (p.description && p.description.includes('${BASE_URL}'));

    if (!needsFix) {
      skipped++;
      continue;
    }

    const fixedImage = fixUrl(p.image);
    const fixedImagemUrl = fixUrl(p.imagem_url);
    const fixedImages = fixImagesArray(p.images);

    // Fix description/GALLERY meta too
    let fixedDescription = p.description;
    if (fixedDescription && fixedDescription.includes('${BASE_URL}')) {
      fixedDescription = fixedDescription.replace(/\${BASE_URL}\//g, REAL_BASE_URL + '/').replace(/\${BASE_URL}/g, REAL_BASE_URL);
    }

    console.log(`🔧 Corrigindo: ${p.nome} (${p.id})`);
    console.log(`   image: ${p.image} → ${fixedImage}`);

    const { error: updateErr } = await supabase
      .from('produtos')
      .update({
        image: fixedImage,
        imagem_url: fixedImagemUrl,
        images: fixedImages,
        description: fixedDescription,
      })
      .eq('id', p.id);

    if (updateErr) {
      console.error(`   ❌ Erro ao atualizar:`, updateErr.message);
    } else {
      console.log(`   ✅ Corrigido!`);
      fixed++;
    }
  }

  console.log(`\n✅ Concluído: ${fixed} produtos corrigidos | ${skipped} ignorados`);
}

main().catch(console.error);
