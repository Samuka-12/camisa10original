const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Extract product items directly from products.ts
const productsFilePath = path.join(__dirname, 'src', 'data', 'products.ts');
const fileContent = fs.readFileSync(productsFilePath, 'utf-8');

// Parse items manually or via RegExp from allProducts
async function seed() {
  console.log("🌱 Sincronizando produtos do catálogo para a tabela 'produtos' no Supabase...");
  
  // Extrair blocos de objetos
  const match = fileContent.match(/export const allProducts: Product\[\] = \[([\s\S]*?)\];/);
  if (!match) {
    console.error("❌ Não foi possível ler allProducts de products.ts");
    return;
  }

  // Obter a lista parsed chamando node via require temporário ou regex
  // Vamos criar um arquivo JS temporário no scratch para exportar os produtos
  const tempScript = `
    const { allProducts } = require('./src/data/products.ts');
  `;
}

// Vamos implementar a inserção limpa usando o Supabase JS client
async function main() {
  // Ler produtos existentes no Supabase
  const { data: existing, error: readErr } = await supabase.from('produtos').select('id');
  if (readErr) {
    console.error("❌ Erro ao ler produtos do Supabase:", readErr.message);
    return;
  }

  const existingIds = new Set((existing || []).map(p => p.id));
  console.log(`📦 Produtos atualmente cadastrados no Supabase: ${existingIds.size}`);

  // Testar conexão gravando produto teste válido UUID
  const testId = '00000000-0000-0000-0000-000000000001';
  const { error: insertErr } = await supabase.from('produtos').upsert([{
    id: testId,
    nome: 'PRODUTO_TESTE_SYNC',
    preco: 109.93,
    tipo: 'vitrine',
    category: 'europeus',
    team: 'Teste'
  }], { onConflict: 'id' });

  if (insertErr) {
    console.error("⚠️ Erro no teste de inserção (Execute o SQL full_fix_schema_migration.sql no Supabase):", insertErr.message);
  } else {
    console.log("✅ Conexão com a tabela 'produtos' no Supabase está 100% OK!");
    await supabase.from('produtos').delete().eq('id', testId);
  }
}

main().catch(console.error);
