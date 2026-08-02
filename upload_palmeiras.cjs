const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://xnadtzeyynoblrbncltt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM'
);

const MEDIA_DIR = 'C:/Users/Usuário Pc/.gemini/antigravity/brain/f9624370-c2f1-44a9-a6c0-50adf6fc688d';

const filesToUpload = [
  { media: 'media__1784137342929.jpg', target: 'palmeiras-reserva-verso.jpg' },
  { media: 'media__1784137342953.jpg', target: 'palmeiras-reserva-detalhe.jpg' },
  { media: 'media__1784137342997.jpg', target: 'palmeiras-reserva-frente.jpg' }
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
