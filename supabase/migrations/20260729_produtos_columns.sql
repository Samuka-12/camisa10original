-- ═══════════════════════════════════════════════════════════════════════════
-- Migração: Garantir colunas necessárias na tabela produtos
-- Banco de dados: Supabase (PostgreSQL)
-- Finalidade: Adicionar colunas tipo, sizes, images, team se não existirem
-- ═══════════════════════════════════════════════════════════════════════════

-- Cria tabela se não existir (com todas as colunas necessárias)
CREATE TABLE IF NOT EXISTS public.produtos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT,
  preco       NUMERIC(10, 2),
  imagem_url  TEXT,
  image       TEXT,
  images      TEXT,
  description TEXT,
  category    TEXT,
  team        TEXT,
  sizes       JSONB DEFAULT '[]'::JSONB,
  tipo        TEXT DEFAULT 'vitrine',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Adiciona colunas que podem estar faltando (ALTER TABLE é seguro, ignora se já existe)
DO $$
BEGIN
  -- Coluna tipo (diferencia vitrine / dinamico / config)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN tipo TEXT DEFAULT 'vitrine';
  END IF;

  -- Coluna sizes (tamanhos disponíveis do produto)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'sizes'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN sizes JSONB DEFAULT '[]'::JSONB;
  END IF;

  -- Coluna images (galeria de múltiplas fotos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN images TEXT;
  END IF;

  -- Coluna team (time da camiseta)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'team'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN team TEXT;
  END IF;

  -- Coluna image (alias para imagem_url - compatibilidade)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'produtos' AND column_name = 'image'
  ) THEN
    ALTER TABLE public.produtos ADD COLUMN image TEXT;
  END IF;

END $$;

-- Atualizar produtos existentes sem tipo para 'vitrine' (exceto store_config)
UPDATE public.produtos
SET tipo = 'vitrine'
WHERE tipo IS NULL AND id != '00000000-0000-0000-0000-000000000000' AND nome != 'store_config';

-- Marcar store_config explicitamente
UPDATE public.produtos
SET tipo = 'config'
WHERE id = '00000000-0000-0000-0000-000000000000' OR nome = 'store_config';

-- RLS: Garantir que usuário autenticado pode fazer CRUD completo
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para recriar limpas
DROP POLICY IF EXISTS "authenticated_full_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_read_produtos" ON public.produtos;
DROP POLICY IF EXISTS "authenticated_rw_produtos" ON public.produtos;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.produtos;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.produtos;

-- Leitura pública (vitrine visível para todos)
CREATE POLICY "anon_read_produtos" ON public.produtos
  FOR SELECT TO anon USING (true);

-- CRUD completo para admin logado
CREATE POLICY "authenticated_full_produtos" ON public.produtos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Índice por tipo para queries rápidas
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON public.produtos (tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_category ON public.produtos (category);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON public.produtos (created_at DESC);
