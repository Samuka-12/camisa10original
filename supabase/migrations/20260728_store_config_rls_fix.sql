-- ═══════════════════════════════════════════════════════════════════════════
-- Migração: Store Config Persistence Fix
-- Banco de dados: Supabase (PostgreSQL)
-- Finalidade: 
--   1. Permite que usuários autenticados (admin) façam INSERT/UPDATE na tabela produtos
--   2. Insere a linha store_config com UUID fixo para persistência das configurações da loja
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Garante que RLS está ativo na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas que possam conflitar
DROP POLICY IF EXISTS "authenticated_rw_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_read_produtos" ON public.produtos;
DROP POLICY IF EXISTS "authenticated_full_produtos" ON public.produtos;

-- 3. Permite leitura pública dos produtos (vitrine)
CREATE POLICY "anon_read_produtos" ON public.produtos
  FOR SELECT
  TO anon
  USING (true);

-- 4. Permite CRUD completo para usuários autenticados (admin logado)
CREATE POLICY "authenticated_full_produtos" ON public.produtos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Insere a linha store_config se não existir (UUID fixo para configurações da loja)
INSERT INTO public.produtos (id, nome, preco, description)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'store_config',
  0,
  '{}'
)
ON CONFLICT (id) DO NOTHING;
