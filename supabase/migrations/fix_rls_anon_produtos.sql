-- ================================================================
-- FIX RLS: Permitir anon fazer INSERT/UPDATE/DELETE em produtos
-- Necessário porque o Admin usa autenticação própria (senha local)
-- e não está logado via Supabase Auth, então age como "anon".
-- ================================================================

-- PRODUTOS: permitir anon fazer todas as operações
DROP POLICY IF EXISTS "anon_insert_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_update_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_delete_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_upsert_produtos" ON public.produtos;

-- INSERT para anon (criação de produtos via Admin)
CREATE POLICY "anon_insert_produtos" ON public.produtos
  FOR INSERT TO anon WITH CHECK (true);

-- UPDATE para anon (edição de produtos via Admin)
CREATE POLICY "anon_update_produtos" ON public.produtos
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- DELETE para anon (remoção de produtos via Admin)
CREATE POLICY "anon_delete_produtos" ON public.produtos
  FOR DELETE TO anon USING (true);

-- ================================================================
-- STORAGE: garantir que anon pode fazer upload no bucket camisetas
-- ================================================================
DROP POLICY IF EXISTS "anon_upload_camisetas" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_camisetas" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_camisetas" ON storage.objects;

CREATE POLICY "anon_upload_camisetas" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'camisetas');

CREATE POLICY "anon_update_camisetas" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'camisetas') WITH CHECK (bucket_id = 'camisetas');

CREATE POLICY "anon_delete_camisetas" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'camisetas');

-- ================================================================
-- Adicionar coluna "videos" se não existir (para carrossel completo)
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'produtos' AND column_name = 'videos'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN videos TEXT;
  END IF;
END $$;
