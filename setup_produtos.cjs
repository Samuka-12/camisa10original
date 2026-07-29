// Script para garantir que a tabela produtos tem todas as colunas necessárias
// Execute com: node setup_produtos.cjs
// Não precisa de argumento - usa a service role key do .env

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lê o .env
const envPath = path.join(__dirname, '.env');
let SUPABASE_URL = '';
let SERVICE_ROLE_KEY = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_KEY=(.+)|SUPABASE_SERVICE_ROLE_KEY=(.+)|VITE_SUPABASE_ANON_KEY=(.+)/);
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SERVICE_ROLE_KEY = (keyMatch[1] || keyMatch[2] || keyMatch[3] || '').trim();
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  SUPABASE_URL = 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
  // Anon key - funciona para RLS que já liberamos
  SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs';
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('🔧 Verificando estrutura da tabela produtos no Supabase...\n');

  // Tentar ler um produto existente para ver quais colunas existem
  const { data: sample, error: sampleErr } = await supabase
    .from('produtos')
    .select('*')
    .limit(1);

  if (sampleErr) {
    console.error('❌ Erro ao acessar tabela produtos:', sampleErr.message);
    return;
  }

  if (sample && sample.length > 0) {
    const cols = Object.keys(sample[0]);
    console.log('✅ Colunas existentes na tabela produtos:');
    console.log('  ', cols.join(', '));

    const required = ['tipo', 'sizes', 'images', 'team', 'imagem_url'];
    const missing = required.filter(c => !cols.includes(c));
    if (missing.length === 0) {
      console.log('\n✅ Todas as colunas necessárias já existem!');
    } else {
      console.log('\n⚠️  Colunas faltando:', missing.join(', '));
      console.log('\nExecute o seguinte SQL no Dashboard do Supabase:');
      console.log('https://supabase.com/dashboard/project/kffjkhyhhjpkwzfrcvzh/sql/new');
      const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260729_produtos_columns.sql');
      if (fs.existsSync(sqlPath)) {
        console.log('\n--- SQL A EXECUTAR ---');
        console.log(fs.readFileSync(sqlPath, 'utf-8'));
        console.log('--- FIM DO SQL ---');
      }
    }
  } else {
    console.log('⚠️  Tabela vazia ou sem acesso. Verifique o RLS.');
  }

  // Testar inserção de produto de teste
  console.log('\n🧪 Testando inserção de produto de teste...');
  const testId = 'test-' + Date.now();
  const { error: insertErr } = await supabase.from('produtos').upsert([{
    id: testId,
    nome: 'PRODUTO_TESTE_DELETE_ME',
    preco: 1.00,
    tipo: 'vitrine',
    category: 'europeus',
    team: 'Teste',
  }], { onConflict: 'id' });

  if (insertErr) {
    console.error('❌ Erro ao inserir produto de teste:', insertErr.message);
    console.error('   Code:', insertErr.code);
    if (insertErr.code === 'PGRST204') {
      console.log('\n⚠️  A coluna "tipo" provavelmente não existe. Execute o SQL de migration.');
    }
  } else {
    console.log('✅ Produto de teste inserido com sucesso!');
    // Limpar
    await supabase.from('produtos').delete().eq('id', testId);
    console.log('✅ Produto de teste removido.');
    console.log('\n✅ Tudo OK! O sistema de criação de produtos está funcionando corretamente.');
  }
}

main().catch(console.error);
