const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://kffjkhyhhjpkwzfrcvzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs'
);

const MEDIA_DIR = 'C:/Users/Usuário Pc/.gemini/antigravity/brain/f9624370-c2f1-44a9-a6c0-50adf6fc688d';

const mapping = [
  { media: 'media__1784136973302.jpg', target: 'caboverde-frente.jpg' },
  { media: 'media__1784136985510.jpg', target: 'caboverde-verso.jpg' },
  { media: 'media__1784136995564.jpg', target: 'caboverde-detalhe.jpg' },
  
  { media: 'media__1784137082680.jpg', target: 'caboverde-goleiro-frente.jpg' },
  { media: 'media__1784137082725.jpg', target: 'caboverde-goleiro-verso.jpg' },
  
  { media: 'media__1784137220713.jpg', target: 'suica-verso.jpg' },
  { media: 'media__1784137220723.jpg', target: 'suica-frente.jpg' },
  { media: 'media__1784137220804.jpg', target: 'suica-detalhe.jpg' },
  
  { media: 'media__1784137342929.jpg', target: 'palmeiras-reserva-verso.jpg' },
  { media: 'media__1784137342953.jpg', target: 'palmeiras-reserva-detalhe.jpg' },
  { media: 'media__1784137342997.jpg', target: 'palmeiras-reserva-frente.jpg' },
  
  { media: 'media__1784137380431.jpg', target: 'inglaterra-reserva-frente.jpg' },
  
  { media: 'media__1784138183905.jpg', target: 'paraguai-reserva-verso.jpg' },
  { media: 'media__1784138183920.jpg', target: 'paraguai-reserva-detalhe.jpg' },
  { media: 'media__1784138183955.jpg', target: 'paraguai-reserva-frente.jpg' }
];

async function uploadAll() {
  for (const item of mapping) {
    const filePath = path.join(MEDIA_DIR, item.media);
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('camisetas')
      .upload(item.target, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    if (error) console.log(`FAIL: ${item.target} - ${error.message}`);
    else console.log(`OK: ${item.target}`);
  }
}
uploadAll();
