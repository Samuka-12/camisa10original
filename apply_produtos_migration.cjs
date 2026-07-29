// Script para aplicar migration de colunas via Supabase REST API
// Execute com: node apply_produtos_migration.cjs <email> <senha>

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.log('Uso: node apply_produtos_migration.cjs <email> <senha>');
    console.log('Ex:  node apply_produtos_migration.cjs samuelcab444@gmail.com SUASENHA');
    process.exit(1);
  }

  console.log('🔐 Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) { console.error('❌ Login falhou:', authError.message); process.exit(1); }
  console.log('✅ Login realizado!\n');

  // Executar SQL via Supabase SQL API (autenticado)
  const SQL = `
-- Adiciona colunas necessárias (ignora se já existem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='tipo') THEN
    ALTER TABLE public.produtos ADD COLUMN tipo TEXT DEFAULT 'vitrine';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='sizes') THEN
    ALTER TABLE public.produtos ADD COLUMN sizes JSONB DEFAULT '[]'::JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='produtos' AND column_name='images') THEN
    ALTER TABLE public.produtos ADD COLUMN images TEXT;
  END IF;
END $$;

-- Marca todos produtos existentes como vitrine
UPDATE public.produtos SET tipo = 'vitrine' WHERE tipo IS NULL AND nome != 'store_config';
UPDATE public.produtos SET tipo = 'config' WHERE id = '00000000-0000-0000-0000-000000000000' OR nome = 'store_config';
`;

  console.log('📋 SQL a executar:');
  console.log(SQL);

  // Tentar via RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: SQL });
  if (rpcError) {
    console.log('\n⚠️  RPC exec_sql não disponível:', rpcError.message);
    console.log('\n🚨 AÇÃO NECESSÁRIA: Execute manualmente no Supabase Dashboard SQL Editor:');
    console.log('https://supabase.com/dashboard/project/kffjkhyhhjpkwzfrcvzh/sql/new');
    console.log('\nCole e execute o SQL acima.');
  } else {
    console.log('✅ SQL aplicado com sucesso!');
  }

  // Testar agora
  console.log('\n🧪 Testando inserção com coluna tipo...');
  const testId = 'test-col-' + Date.now();
  const { error: testErr } = await supabase.from('produtos').upsert([{
    id: testId,
    nome: 'TESTE_COLUNAS',
    preco: 1.00,
    tipo: 'vitrine',
    category: 'europeus',
    team: 'Teste',
    sizes: ['P', 'M', 'G'],
    images: '[]',
  }], { onConflict: 'id' });

  if (testErr) {
    console.error('❌ Ainda com erro:', testErr.message, '(code:', testErr.code + ')');
    if (testErr.code === 'PGRST204') {
      console.log('\n🚨 As colunas ainda não foram adicionadas. Execute o SQL manualmente no Dashboard do Supabase.');
    }
  } else {
    console.log('✅ Produto de teste inserido com sucesso!');
    await supabase.from('produtos').delete().eq('id', testId);
    console.log('✅ Produto de teste removido.');
    console.log('\n🎉 TUDO FUNCIONANDO! Novos produtos serão criados corretamente na vitrine.');
  }
}

main().catch(console.error);
