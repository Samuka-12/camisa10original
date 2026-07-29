// Script para aplicar o SQL de migration no Supabase usando credenciais de admin
// Execute com: node apply_migration.cjs <email_do_admin> <senha_do_admin>

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const SQL = `
-- Adiciona politica RLS que permite usuarios autenticados fazer CRUD em produtos
DO $$ 
BEGIN
  -- Remove politicas antigas se existirem
  DROP POLICY IF EXISTS "authenticated_rw_produtos" ON public.produtos;
  DROP POLICY IF EXISTS "anon_read_produtos" ON public.produtos;
  DROP POLICY IF EXISTS "authenticated_full_produtos" ON public.produtos;
  
  -- Cria politica de leitura para anon (vitrine publica)
  CREATE POLICY "anon_read_produtos" ON public.produtos
    FOR SELECT TO anon USING (true);
  
  -- Cria politica de CRUD para authenticated (admin logado)
  CREATE POLICY "authenticated_full_produtos" ON public.produtos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
    
  -- Insere store_config se nao existir
  INSERT INTO public.produtos (id, nome, preco, description)
  VALUES ('00000000-0000-0000-0000-000000000000', 'store_config', 0, '{}')
  ON CONFLICT (id) DO NOTHING;
END $$;
`;

async function applyMigration(email, password) {
  console.log('Fazendo login como admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (authError) {
    console.error('Erro de login:', authError.message);
    process.exit(1);
  }
  
  const accessToken = authData.session.access_token;
  console.log('Login realizado com sucesso! Role:', authData.session.user?.role || 'authenticated');
  
  // Tentar executar SQL via RPC (funcao exec_sql precisa existir)
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { sql: SQL });
  if (rpcError) {
    console.log('RPC exec_sql nao disponivel:', rpcError.message);
    console.log('');
    console.log('Por favor, execute o seguinte SQL manualmente no Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/kffjkhyhhjpkwzfrcvzh/sql/new');
    console.log('');
    console.log(SQL);
  } else {
    console.log('SQL executado com sucesso!', rpcData);
  }
  
  // Independente do SQL, tentar inserir store_config como usuario autenticado
  console.log('\nTentando inserir store_config como usuario autenticado...');
  const { error: upsertError } = await supabase
    .from('produtos')
    .upsert([{
      id: '00000000-0000-0000-0000-000000000000',
      nome: 'store_config',
      preco: 0,
      description: '{}'
    }], { onConflict: 'id' });
    
  if (upsertError) {
    console.log('Upsert falhou:', upsertError.message, '(code:', upsertError.code + ')');
    console.log('Isso confirma que o RLS precisa ser atualizado via SQL no dashboard do Supabase.');
  } else {
    console.log('store_config inserido com sucesso!');
    console.log('O sistema de persistencia esta funcionando!');
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Uso: node apply_migration.cjs <email> <senha>');
  console.log('Exemplo: node apply_migration.cjs samuelcab444@gmail.com SUASENHA');
  process.exit(1);
}

applyMigration(email, password);
