const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://kffjkhyhhjpkwzfrcvzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZmpraHloaGpwa3d6ZnJjdnpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0ODgyNDcsImV4cCI6MjA5MjA2NDI0N30.AObuo3zHyMe_ffM78FOWIiUcDrU8W3JyvZMa5h-rBCs'
);

const MEDIA_DIR = 'C:/Users/Usuário Pc/.gemini/antigravity/brain/f9624370-c2f1-44a9-a6c0-50adf6fc688d';

const filesToUpload = [
  { media: 'media__1784138183905.jpg', target: 'paraguai-reserva-verso-novo.jpg' },
  { media: 'media__1784138183920.jpg', target: 'paraguai-reserva-detalhe-novo.jpg' },
  { media: 'media__1784138183955.jpg', target: 'paraguai-reserva-frente-novo.jpg' }
];

async function upload() {
  for (const item of filesToUpload) {
    const filePath = path.join(MEDIA_DIR, item.media);
    const fileBuffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
      .from('camisetas')
      .upload(item.target, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.log(`FAIL: ${item.target} - ${error.message}`);
    } else {
      console.log(`OK: ${item.target}`);
    }
  }
}

upload();
