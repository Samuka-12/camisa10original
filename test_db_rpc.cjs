const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Fetching products to inspect image URLs...');
  const { data: products, error } = await supabase
    .from('produtos')
    .select('id, nome, imagem_url, image, images')
    .limit(50);
  
  if (error) {
    console.error('Error fetching products:', error.message);
    return;
  }

  console.log(`Fetched ${products.length} products.\n`);
  products.forEach(p => {
    console.log(`Product: ${p.nome} (${p.id})`);
    console.log(`  - image:      ${p.image}`);
    console.log(`  - imagem_url: ${p.imagem_url}`);
    if (p.images) {
      console.log(`  - images:     ${p.images}`);
    }
    console.log('');
  });
}

main().catch(console.error);
