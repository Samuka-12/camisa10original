const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://kffjkhyhhjpkwzfrcvzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs'
);

const MEDIA_DIR = 'C:/Users/Usuário Pc/.gemini/antigravity/brain/984859df-3554-4988-a8d2-6efe5d9633df';

// VERIFIED mapping: media files -> product image names
// Based on visual verification and chronological order of conversation
const mapping = [
  // ===== 15:08:28 - Noruega Titular (3 imgs) =====
  // Verified: media__1784128108213 = Noruega frente (red with Norwegian cross)
  { media: 'media__1784128108213.jpg', target: 'noruega-frente.jpg' },
  { media: 'media__1784128108222.jpg', target: 'noruega-verso.jpg' },
  { media: 'media__1784128108421.jpg', target: 'noruega-detalhe.jpg' },

  // ===== 15:11:02 - Argentina Reserva (3 imgs) =====
  { media: 'media__1784128262971.jpg', target: 'argentina-reserva-frente.jpg' },
  { media: 'media__1784128262976.jpg', target: 'argentina-reserva-verso.jpg' },
  { media: 'media__1784128263008.jpg', target: 'argentina-reserva-detalhe.jpg' },

  // ===== 15:12:39-15:13:09 - Paraguai Reserva (3 imgs) =====
  // Note: same file sizes as Argentina group (user may have resent same images)
  // But product was created as Paraguai, so uploading with Paraguai names
  { media: 'media__1784128359289.jpg', target: 'paraguai-reserva-frente.jpg' },
  { media: 'media__1784128379326.jpg', target: 'paraguai-reserva-verso.jpg' },
  { media: 'media__1784128389265.jpg', target: 'paraguai-reserva-detalhe.jpg' },

  // ===== 15:14:24 - Cabo Verde (2 imgs - 0 BYTES, SKIPPED) =====
  // MISSING: caboverde-frente.jpg, caboverde-verso.jpg, caboverde-detalhe.jpg
  // MISSING: caboverde-reserva-frente.jpg, caboverde-reserva-verso.jpg

  // ===== 15:19:31 - Inglaterra Reserva (2 imgs, 1st is 0 bytes) =====
  // Verified: media__1784128771705 = Inglaterra Reserva verso (red with ENG pattern)
  // media__1784128771662 is 0 bytes - SKIP
  { media: 'media__1784128771705.jpg', target: 'inglaterra-reserva-verso.jpg' },
  // MISSING: inglaterra-reserva-frente.jpg

  // ===== MISSING: Suíça images (no media files found) =====
  // MISSING: suica-frente.jpg, suica-verso.jpg, suica-detalhe.jpg

  // ===== MISSING: Palmeiras Reserva images (no media files found) =====
  // MISSING: palmeiras-reserva-frente.jpg, palmeiras-reserva-verso.jpg, palmeiras-reserva-detalhe.jpg

  // ===== 15:36:21 - Japão (3 imgs) =====
  { media: 'media__1784129781697.jpg', target: 'japao-frente.jpg' },
  { media: 'media__1784129781718.jpg', target: 'japao-verso.jpg' },
  { media: 'media__1784129781727.jpg', target: 'japao-detalhe.jpg' },

  // ===== 15:41:30 - Flamengo Reserva (3 imgs) =====
  // Verified: 1st = verso (white back), 2nd = frente (white CRF front), 3rd = detalhe
  { media: 'media__1784130090971.jpg', target: 'flamengo-reserva-verso.jpg' },
  { media: 'media__1784130090978.jpg', target: 'flamengo-reserva-frente.jpg' },
  { media: 'media__1784130090993.jpg', target: 'flamengo-reserva-detalhe.jpg' },

  // ===== 15:43:27 - Corinthians Reserva (3 imgs) =====
  { media: 'media__1784130207496.jpg', target: 'corinthians-reserva-frente.jpg' },
  { media: 'media__1784130207501.jpg', target: 'corinthians-reserva-verso.jpg' },
  { media: 'media__1784130207523.jpg', target: 'corinthians-reserva-detalhe.jpg' },

  // ===== 15:45:44 - São Paulo Reserva (3 imgs) =====
  { media: 'media__1784130344152.jpg', target: 'saopaulo-reserva-frente.jpg' },
  { media: 'media__1784130344155.jpg', target: 'saopaulo-reserva-verso.jpg' },
  { media: 'media__1784130344159.jpg', target: 'saopaulo-reserva-detalhe.jpg' },

  // ===== 15:47 - DUPLICATE of São Paulo (same sizes, SKIP) =====

  // ===== 15:49:44 - Botafogo Reserva (3 imgs) =====
  { media: 'media__1784130584069.jpg', target: 'botafogo-reserva-frente.jpg' },
  { media: 'media__1784130584065.jpg', target: 'botafogo-reserva-verso.jpg' },
  { media: 'media__1784130584150.jpg', target: 'botafogo-reserva-detalhe.jpg' },

  // ===== 15:51:34 - Vasco Reserva (2 imgs) =====
  { media: 'media__1784130694528.jpg', target: 'vasco-reserva-frente.jpg' },
  { media: 'media__1784130694521.jpg', target: 'vasco-reserva-verso.jpg' },

  // ===== 15:53:35 - Atlético MG Reserva (2 imgs) =====
  { media: 'media__1784130815407.jpg', target: 'atleticomg-reserva-frente.jpg' },
  { media: 'media__1784130815399.jpg', target: 'atleticomg-reserva-verso.jpg' },

  // ===== 15:55:32 - Internacional (2 imgs) =====
  { media: 'media__1784130932405.jpg', target: 'inter-frente.jpg' },
  { media: 'media__1784130932401.jpg', target: 'inter-verso.jpg' },

  // ===== 15:57:19 - Grêmio (3 imgs) =====
  { media: 'media__1784131039100.jpg', target: 'gremio-frente.jpg' },
  { media: 'media__1784131039095.jpg', target: 'gremio-verso.jpg' },
  { media: 'media__1784131039161.jpg', target: 'gremio-detalhe.jpg' },

  // ===== 15:59:12 - Espanha Reserva (2 imgs) =====
  { media: 'media__1784131152091.jpg', target: 'espanha-reserva-frente.jpg' },
  { media: 'media__1784131152086.jpg', target: 'espanha-reserva-verso.jpg' },

  // ===== 16:01:23 - Alemanha Reserva (2 imgs) =====
  { media: 'media__1784131283037.jpg', target: 'alemanha-reserva-frente.jpg' },
  { media: 'media__1784131282996.jpg', target: 'alemanha-reserva-verso.jpg' },

  // ===== 16:13:11 - Noruega Reserva (3 imgs) =====
  { media: 'media__1784131991645.jpg', target: 'noruega-reserva-frente.jpg' },
  { media: 'media__1784131991816.jpg', target: 'noruega-reserva-verso.jpg' },
  { media: 'media__1784131991802.jpg', target: 'noruega-reserva-detalhe.jpg' },

  // ===== 16:16:01 - Vasco Titular (2 imgs) =====
  { media: 'media__1784132161249.jpg', target: 'vasco-frente.jpg' },
  { media: 'media__1784132161257.jpg', target: 'vasco-verso.jpg' },
];

async function uploadAll() {
  let success = 0;
  let fail = 0;
  const missing = [];

  for (const item of mapping) {
    const filePath = path.join(MEDIA_DIR, item.media);
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP (not found): ${item.media} -> ${item.target}`);
      missing.push(item.target);
      fail++;
      continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.log(`SKIP (0 bytes): ${item.media} -> ${item.target}`);
      missing.push(item.target);
      fail++;
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('camisetas')
      .upload(item.target, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.log(`FAIL: ${item.media} -> ${item.target}: ${error.message}`);
      fail++;
    } else {
      console.log(`OK: ${item.media} -> ${item.target}`);
      success++;
    }
  }

  console.log(`\n========================================`);
  console.log(`DONE! ${success} uploaded, ${fail} failed/skipped.`);
  
  // List all missing images
  const allMissing = [
    'caboverde-frente.jpg', 'caboverde-verso.jpg', 'caboverde-detalhe.jpg',
    'caboverde-reserva-frente.jpg', 'caboverde-reserva-verso.jpg',
    'inglaterra-reserva-frente.jpg',
    'suica-frente.jpg', 'suica-verso.jpg', 'suica-detalhe.jpg',
    'palmeiras-reserva-frente.jpg', 'palmeiras-reserva-verso.jpg', 'palmeiras-reserva-detalhe.jpg',
    ...missing
  ];
  const uniqueMissing = [...new Set(allMissing)];
  console.log(`\nMISSING IMAGES (need manual upload):`);
  uniqueMissing.forEach(m => console.log(`  - ${m}`));
}

uploadAll();
