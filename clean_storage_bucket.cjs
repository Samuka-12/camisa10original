const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanBucket() {
  console.log("🧹 Iniciando verificação de fotos ativas x órfãs no bucket 'camisetas'...");

  // 1. Obter todas as imagens de produtos cadastrados na tabela produtos
  const { data: dbProducts } = await supabase.from('produtos').select('imagem_url, image, images, description');
  
  const activeImageNames = new Set();

  (dbProducts || []).forEach(p => {
    if (p.imagem_url) {
      const name = p.imagem_url.split('/').pop();
      if (name) activeImageNames.add(name);
    }
    if (p.image) {
      const name = p.image.split('/').pop();
      if (name) activeImageNames.add(name);
    }
    if (p.images) {
      try {
        const arr = JSON.parse(p.images);
        if (Array.isArray(arr)) {
          arr.forEach(url => {
            const name = url.split('/').pop();
            if (name) activeImageNames.add(name);
          });
        }
      } catch (_) {}
    }
    // Extrair da tag gallery meta da descrição
    if (p.description) {
      const match = p.description.match(/<!-- GALLERY:(.*?) -->/);
      if (match && match[1]) {
        try {
          const meta = JSON.parse(match[1]);
          if (Array.isArray(meta.images)) {
            meta.images.forEach(url => {
              const name = url.split('/').pop();
              if (name) activeImageNames.add(name);
            });
          }
        } catch (_) {}
      }
    }
  });

  console.log(`🖼️ Total de imagens referenciadas por produtos ativos: ${activeImageNames.size}`);

  // 2. Listar arquivos presentes no bucket
  const { data: files, error: listErr } = await supabase.storage.from('camisetas').list('', { limit: 1000 });
  if (listErr) {
    console.error("❌ Erro ao listar arquivos do bucket:", listErr.message);
    return;
  }

  const allBucketFiles = (files || []).map(f => f.name);
  console.log(`📁 Total de arquivos no bucket 'camisetas': ${allBucketFiles.length}`);

  const orphanFiles = allBucketFiles.filter(name => !activeImageNames.has(name) && name !== '.emptyFolderPlaceholder');
  console.log(`⚠️ Arquivos não associados a nenhum produto ativo (órfãos): ${orphanFiles.length}`);

  if (orphanFiles.length > 0) {
    console.log("Removendo arquivos órfãos não utilizados...");
    const { data: deleted, error: delErr } = await supabase.storage.from('camisetas').remove(orphanFiles);
    if (delErr) {
      console.error("Erro ao deletar arquivos órfãos:", delErr.message);
    } else {
      console.log(`✅ Deletados com sucesso ${deleted ? deleted.length : orphanFiles.length} arquivos não utilizados.`);
    }
  } else {
    console.log("✨ O bucket 'camisetas' já está 100% limpo! Somente fotos de produtos ativos permanecem.");
  }
}

cleanBucket().catch(console.error);
