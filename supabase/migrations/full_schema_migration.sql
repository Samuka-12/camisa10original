-- ==============================================================================
-- MIGRAÇÃO CONSOLIDADA COMPLETA — CAMISA 10 ORIGINAL
-- Banco de dados: Supabase (PostgreSQL)
-- Projeto: https://xnadtzeyynoblrbncltt.supabase.co
-- Instruções: Copie todo este conteúdo e cole no SQL Editor do Supabase, depois clique em RUN
-- ==============================================================================

-- 1. TABELA DE PRODUTOS & CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  preco NUMERIC(10, 2),
  imagem_url TEXT,
  image TEXT,
  images TEXT,
  description TEXT,
  category TEXT,
  team TEXT,
  sizes JSONB DEFAULT '[]'::jsonb,
  tipo TEXT DEFAULT 'vitrine',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Adiciona colunas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'tipo') THEN
    ALTER TABLE public.produtos ADD COLUMN tipo TEXT DEFAULT 'vitrine';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'sizes') THEN
    ALTER TABLE public.produtos ADD COLUMN sizes JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'images') THEN
    ALTER TABLE public.produtos ADD COLUMN images TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'team') THEN
    ALTER TABLE public.produtos ADD COLUMN team TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'image') THEN
    ALTER TABLE public.produtos ADD COLUMN image TEXT;
  END IF;
END $$;

-- Habilita RLS na tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "anon_read_produtos" ON public.produtos;
DROP POLICY IF EXISTS "authenticated_full_produtos" ON public.produtos;

-- Permite leitura anônima para a vitrine
CREATE POLICY "anon_read_produtos" ON public.produtos
  FOR SELECT TO anon USING (true);

-- Permite acesso completo para usuários autenticados (Admin)
CREATE POLICY "authenticated_full_produtos" ON public.produtos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insere o registro padrão de configurações da loja (store_config)
INSERT INTO public.produtos (id, nome, preco, description, tipo)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'store_config',
  0,
  '{}',
  'config'
)
ON CONFLICT (id) DO NOTHING;

-- Índices de otimização
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON public.produtos (tipo);
CREATE INDEX IF NOT EXISTS idx_produtos_category ON public.produtos (category);
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON public.produtos (created_at DESC);


-- 2. TABELA DE CHECKOUTS (LEADS E PEDIDOS)
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkouts_created_at ON public.checkouts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON public.checkouts (status);
CREATE INDEX IF NOT EXISTS idx_checkouts_email ON public.checkouts (email) WHERE email IS NOT NULL;

-- Habilita RLS na tabela checkouts
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "service_role_full_access_checkouts" ON public.checkouts;
DROP POLICY IF EXISTS "authenticated_read_checkouts" ON public.checkouts;

-- Permite que a anon key (visitante no checkout) insira pedidos
CREATE POLICY "anon_insert_checkouts" ON public.checkouts
  FOR INSERT TO anon WITH CHECK (true);

-- Permite leitura de checkouts para usuários autenticados (Admin)
CREATE POLICY "authenticated_read_checkouts" ON public.checkouts
  FOR SELECT TO authenticated USING (true);

-- Permite acesso total para service_role
CREATE POLICY "service_role_full_access_checkouts" ON public.checkouts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- 3. TABELA DE META EVENTS (API DE CONVERSÕES DO META ADS)
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

CREATE INDEX IF NOT EXISTS idx_meta_events_name ON public.meta_events (event_name);
CREATE INDEX IF NOT EXISTS idx_meta_events_created_at ON public.meta_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_events_fbc ON public.meta_events (fbc) WHERE fbc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meta_events_fbp ON public.meta_events (fbp) WHERE fbp IS NOT NULL;

-- Habilita RLS na tabela meta_events
ALTER TABLE public.meta_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access" ON public.meta_events;

CREATE POLICY "service_role_full_access" ON public.meta_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- 4. CRIAÇÃO DO BUCKET PÚBLICO DE STORAGE (CAMISETAS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('camisetas', 'camisetas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de acesso público e upload para o bucket camisetas
DROP POLICY IF EXISTS "Public Access Camisetas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Camisetas" ON storage.objects;

CREATE POLICY "Public Access Camisetas" ON storage.objects
  FOR SELECT USING (bucket_id = 'camisetas');

CREATE POLICY "Authenticated Upload Camisetas" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'camisetas');
