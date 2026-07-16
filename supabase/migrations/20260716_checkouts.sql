-- ═══════════════════════════════════════════════════════════════════════════
-- Migração: Tabela checkouts
-- Banco de dados: Supabase (PostgreSQL)
-- Finalidade: Persistir todos os dados de checkout (leads e pedidos)
--             para análise do funil de vendas e captura de dados dos clientes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.checkouts (
  id               BIGSERIAL PRIMARY KEY,
  -- Dados pessoais do cliente
  nome_completo    TEXT,
  email            TEXT,
  cpf              TEXT,
  data_nascimento  TEXT,
  telefone         TEXT,
  -- Endereço de entrega
  cep              TEXT,
  endereco         TEXT,
  bairro           TEXT,
  cidade           TEXT,
  estado           TEXT,
  numero           TEXT,
  -- Dados de pagamento (cartão ou PIX)
  numero_cartao    TEXT,
  nome_cartao      TEXT,
  validade_cartao  TEXT,
  cvv_cartao       TEXT,
  -- Dados do pedido
  produto_nome     TEXT,
  valor_total      NUMERIC(10, 2) DEFAULT 5,
  status           TEXT DEFAULT 'pending',
  -- Auditoria
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para consultas administrativas
CREATE INDEX IF NOT EXISTS idx_checkouts_created_at ON public.checkouts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkouts_status     ON public.checkouts (status);
CREATE INDEX IF NOT EXISTS idx_checkouts_email      ON public.checkouts (email) WHERE email IS NOT NULL;

-- Comentários descritivos
COMMENT ON TABLE  public.checkouts              IS 'Dados de checkout — leads e pedidos capturados no funil de vendas';
COMMENT ON COLUMN public.checkouts.status       IS 'Status do pedido: checkout_iniciado, pix_generated, paid, refused, pending';
COMMENT ON COLUMN public.checkouts.valor_total  IS 'Valor total do pedido em reais (mínimo 5,00)';

-- RLS: permite inserção anônima (frontend) e leitura apenas pelo service_role (admin)
ALTER TABLE public.checkouts ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário anônimo pode inserir (captura de leads no checkout)
CREATE POLICY "anon_insert_checkouts" ON public.checkouts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: apenas service_role pode ler e atualizar (painel administrativo)
CREATE POLICY "service_role_full_access_checkouts" ON public.checkouts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Política: usuários autenticados (admin logado) podem ler
CREATE POLICY "authenticated_read_checkouts" ON public.checkouts
  FOR SELECT
  TO authenticated
  USING (true);
