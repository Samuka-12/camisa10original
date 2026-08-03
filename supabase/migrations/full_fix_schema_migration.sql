-- ==============================================================================
-- SCRIPT DE CORREÇÃO COMPLETA DO ESQUEMA E RLS (SUPABASE - CAMISA 10 ORIGINAL)
-- ==============================================================================

-- 1. TABELA DE PRODUTOS (com todas as colunas necessárias)
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  preco NUMERIC(10, 2),
  imagem_url TEXT,
  image TEXT,
  images TEXT,
  videos TEXT,
  description TEXT,
  category TEXT,
  team TEXT,
  sizes JSONB DEFAULT '[]'::jsonb,
  tipo TEXT DEFAULT 'vitrine',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Adiciona colunas faltantes caso a tabela já existisse antes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'videos') THEN
    ALTER TABLE public.produtos ADD COLUMN videos TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'images') THEN
    ALTER TABLE public.produtos ADD COLUMN images TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'tipo') THEN
    ALTER TABLE public.produtos ADD COLUMN tipo TEXT DEFAULT 'vitrine';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'sizes') THEN
    ALTER TABLE public.produtos ADD COLUMN sizes JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'team') THEN
    ALTER TABLE public.produtos ADD COLUMN team TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'image') THEN
    ALTER TABLE public.produtos ADD COLUMN image TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'imagem_url') THEN
    ALTER TABLE public.produtos ADD COLUMN imagem_url TEXT;
  END IF;
END $$;

-- Habilita RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas de produtos
DROP POLICY IF EXISTS "anon_read_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_insert_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_update_produtos" ON public.produtos;
DROP POLICY IF EXISTS "anon_delete_produtos" ON public.produtos;
DROP POLICY IF EXISTS "authenticated_full_produtos" ON public.produtos;

-- Políticas de RLS para chave anon (Permite Leitura, Inserção, Atualização e Exclusão)
CREATE POLICY "anon_read_produtos" ON public.produtos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_produtos" ON public.produtos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_produtos" ON public.produtos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_produtos" ON public.produtos FOR DELETE TO anon USING (true);
CREATE POLICY "authenticated_full_produtos" ON public.produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Registra a linha store_config caso não exista
INSERT INTO public.produtos (id, nome, preco, description, tipo)
VALUES ('00000000-0000-0000-0000-000000000000', 'store_config', 0, '{}', 'config')
ON CONFLICT (id) DO NOTHING;


-- 2. TABELA DE CHECKOUTS (COM TODAS AS COLUNAS DE PEDIDOS E LEADS)
CREATE TABLE IF NOT EXISTS public.checkouts (
  id BIGSERIAL PRIMARY KEY,
  nome_completo TEXT,
  email TEXT,
  cpf TEXT,
  data_nascimento TEXT,
  telefone TEXT,
  cep TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  numero TEXT,
  numero_cartao TEXT,
  nome_cartao TEXT,
  validade_cartao TEXT,
  cvv_cartao TEXT,
  produto_nome TEXT,
  valor_total NUMERIC(10, 2) DEFAULT 5,
  status TEXT DEFAULT 'pending',
  cupom_aplicado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkouts' AND column_name = 'status') THEN
    ALTER TABLE public.checkouts ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkouts' AND column_name = 'cupom_aplicado') THEN
    ALTER TABLE public.checkouts ADD COLUMN cupom_aplicado TEXT;
  END IF;
END $$;

ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "anon_select_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "service_role_full_access_checkouts" ON public.checkouts;

CREATE POLICY "anon_insert_checkouts" ON public.checkouts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_checkouts" ON public.checkouts FOR SELECT TO anon USING (true);
CREATE POLICY "service_role_full_access_checkouts" ON public.checkouts FOR ALL USING (true) WITH CHECK (true);


-- 3. TABELA DE META EVENTS (RASTREAMENTO DE EVENTOS META ADS)
CREATE TABLE IF NOT EXISTS public.meta_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_time BIGINT,
  action_source TEXT DEFAULT 'website',
  source_url TEXT,
  fbc TEXT,
  fbp TEXT,
  email_hash TEXT,
  phone_hash TEXT,
  custom_data JSONB,
  capi_response JSONB,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.meta_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_meta_events" ON public.meta_events;
DROP POLICY IF EXISTS "anon_select_meta_events" ON public.meta_events;
DROP POLICY IF EXISTS "service_role_full_access_meta" ON public.meta_events;

CREATE POLICY "anon_insert_meta_events" ON public.meta_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_meta_events" ON public.meta_events FOR SELECT TO anon USING (true);
CREATE POLICY "service_role_full_access_meta" ON public.meta_events FOR ALL USING (true) WITH CHECK (true);


-- 4. BUCKET DE STORAGE "camisetas" E POLÍTICAS DE ACESSO
INSERT INTO storage.buckets (id, name, public)
VALUES ('camisetas', 'camisetas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access Camisetas" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Camisetas" ON storage.objects;
DROP POLICY IF EXISTS "Anon Update Camisetas" ON storage.objects;
DROP POLICY IF EXISTS "Anon Delete Camisetas" ON storage.objects;

CREATE POLICY "Public Access Camisetas" ON storage.objects FOR SELECT USING (bucket_id = 'camisetas');
CREATE POLICY "Anon Upload Camisetas" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'camisetas');
CREATE POLICY "Anon Update Camisetas" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'camisetas') WITH CHECK (bucket_id = 'camisetas');
CREATE POLICY "Anon Delete Camisetas" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'camisetas');
