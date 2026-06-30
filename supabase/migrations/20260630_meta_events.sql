-- ═══════════════════════════════════════════════════════════════════════════
-- Migração: Tabela meta_events
-- Banco de dados: Supabase (PostgreSQL)
-- Finalidade: Persistir todos os eventos da API de Conversões do Meta
--             para análise estratégica do funil:
--             Meta Ads → Site → WhatsApp X1
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.meta_events (
  id             BIGSERIAL PRIMARY KEY,

  -- Identificação do evento
  event_name     TEXT        NOT NULL,                  -- PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Contact, Lead
  event_time     BIGINT,                                -- Unix timestamp do evento
  action_source  TEXT        DEFAULT 'website',         -- website | app | phone_call
  source_url     TEXT,                                  -- URL onde o evento ocorreu

  -- Dados de atribuição Meta Ads
  fbc            TEXT,                                  -- fbclid cookie (atribuição de clique)
  fbp            TEXT,                                  -- _fbp cookie (identificador do navegador)

  -- Dados do usuário (hashed SHA-256 — LGPD compliant)
  email_hash     TEXT,
  phone_hash     TEXT,

  -- Dados customizados do evento (JSON livre)
  custom_data    JSONB,                                 -- value, currency, content_ids, order_id, etc.

  -- Resposta da CAPI do Meta
  capi_response  JSONB,                                 -- resposta bruta da Graph API

  -- UTM / rastreamento de origem
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,

  -- Auditoria
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para consultas de funil e relatórios
CREATE INDEX IF NOT EXISTS idx_meta_events_name       ON public.meta_events (event_name);
CREATE INDEX IF NOT EXISTS idx_meta_events_created_at ON public.meta_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_events_fbc        ON public.meta_events (fbc) WHERE fbc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meta_events_fbp        ON public.meta_events (fbp) WHERE fbp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meta_events_utm_source ON public.meta_events (utm_source) WHERE utm_source IS NOT NULL;

-- Comentários descritivos
COMMENT ON TABLE  public.meta_events                IS 'Eventos da API de Conversões do Meta — funil Meta Ads → Site → WhatsApp X1';
COMMENT ON COLUMN public.meta_events.event_name     IS 'Nome do evento padrão Meta: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Contact, Lead';
COMMENT ON COLUMN public.meta_events.fbc            IS 'Cookie _fbc gerado a partir do parâmetro fbclid (atribuição de clique no anúncio)';
COMMENT ON COLUMN public.meta_events.fbp            IS 'Cookie _fbp gerado pelo Pixel do Meta (identificador único do navegador)';
COMMENT ON COLUMN public.meta_events.custom_data    IS 'Dados customizados do evento: value, currency, content_ids, order_id, source (whatsapp_x1), etc.';
COMMENT ON COLUMN public.meta_events.capi_response  IS 'Resposta bruta retornada pela Graph API após envio do evento';

-- RLS: apenas o service_role pode inserir/ler (a anon key não tem acesso)
ALTER TABLE public.meta_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.meta_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
