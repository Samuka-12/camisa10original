/**
 * Vercel Serverless Function: api/init-storage
 * Verifica e cria o bucket 'camisetas' no Supabase Storage se não existir,
 * e configura as políticas de acesso público (RLS) para uploads e leitura.
 * 
 * POST /api/init-storage
 * No body required (or body: { force: true } to re-apply policies)
 */
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const ADMIN_AUTH_HEADER = process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY não configurada' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  const results = { bucketCreated: false, bucketAlreadyExists: false, policiesApplied: [] };

  try {
    // 1. Verificar se o bucket já existe
    const checkRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/camisetas`, {
      method: 'GET',
      headers
    });

    if (checkRes.status === 200) {
      results.bucketAlreadyExists = true;
      console.log('[init-storage] Bucket camisetas já existe');
    } else if (checkRes.status === 404) {
      // 2. Criar o bucket
      const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: 'camisetas',
          name: 'camisetas',
          public: true,
          file_size_limit: 5242880, // 5MB
          allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
        })
      });

      if (createRes.ok) {
        results.bucketCreated = true;
        console.log('[init-storage] Bucket camisetas criado com sucesso');
      } else {
        const errText = await createRes.text();
        console.error('[init-storage] Erro ao criar bucket:', errText);
        return res.status(500).json({ error: 'Falha ao criar bucket', details: errText });
      }
    } else {
      const errText = await checkRes.text();
      return res.status(500).json({ error: 'Erro ao verificar bucket', status: checkRes.status, details: errText });
    }

    // 3. Aplicar políticas de acesso (RLS)
    const policies = [
      {
        name: 'Public Access Camisetas',
        definition: {
          command: 'SELECT',
          using: { expression: 'bucket_id = \'camisetas\'' }
        }
      },
      {
        name: 'Anon Upload Camisetas',
        definition: {
          command: 'INSERT',
          using: { expression: 'bucket_id = \'camisetas\'' },
          with_check: { expression: 'bucket_id = \'camisetas\'' }
        }
      },
      {
        name: 'Anon Update Camisetas',
        definition: {
          command: 'UPDATE',
          using: { expression: 'bucket_id = \'camisetas\'' },
          with_check: { expression: 'bucket_id = \'camisetas\'' }
        }
      },
      {
        name: 'Anon Delete Camisetas',
        definition: {
          command: 'DELETE',
          using: { expression: 'bucket_id = \'camisetas\'' }
        }
      }
    ];

    // Habilitar RLS no schema de storage (se não estiver)
    await fetch(`${SUPABASE_URL}/storage/v1/bucket/camisetas`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ public: true })
    });

    for (const policy of policies) {
      // Remover política existente se houver
      await fetch(`${SUPABASE_URL}/storage/v1/policy/camisetas/${encodeURIComponent(policy.name)}`, {
        method: 'DELETE',
        headers
      });

      // Criar nova política
      const polRes = await fetch(`${SUPABASE_URL}/storage/v1/policy/camisetas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: policy.name,
          definition: policy.definition
        })
      });

      if (polRes.ok) {
        results.policiesApplied.push(policy.name);
        console.log(`[init-storage] Política aplicada: ${policy.name}`);
      } else {
        const polErr = await polRes.text();
        console.warn(`[init-storage] Aviso ao aplicar política ${policy.name}:`, polErr);
        results.policiesApplied.push(`${policy.name} (aviso: ${polRes.status})`);
      }
    }

    return res.status(200).json({
      success: true,
      message: results.bucketCreated
        ? 'Bucket camisetas criado e políticas aplicadas com sucesso'
        : 'Bucket camisetas já existia. Políticas verificadas/aplicadas.',
      ...results
    });

  } catch (err) {
    console.error('[init-storage] Erro fatal:', err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
}
