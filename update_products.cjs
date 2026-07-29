const fs = require('fs');
let content = fs.readFileSync('src/data/products.ts', 'utf8');

const missing = [
  'caboverde-frente.jpg', 'caboverde-verso.jpg', 'caboverde-detalhe.jpg',
  'caboverde-goleiro-frente.jpg', 'caboverde-goleiro-verso.jpg',
  'suica-verso.jpg', 'suica-frente.jpg', 'suica-detalhe.jpg',
  'palmeiras-reserva-verso.jpg', 'palmeiras-reserva-detalhe.jpg', 'palmeiras-reserva-frente.jpg',
  'inglaterra-reserva-frente.jpg',
  'paraguai-reserva-verso.jpg', 'paraguai-reserva-detalhe.jpg', 'paraguai-reserva-frente.jpg'
];

// Replace ${BASE_URL}/ with /produtos/ for missing images
missing.forEach(m => {
  content = content.replace(new RegExp(`\\\$\\\{BASE_URL\\\}/${m}`, 'g'), `/produtos/${m}`);
  // Also check if paraguai-reserva-frente-novo.jpg is used and replace it
  if(m.includes('paraguai')) {
    content = content.replace(new RegExp(`\\\$\\\{BASE_URL\\\}/${m.replace('.jpg', '-novo.jpg')}`, 'g'), `/produtos/${m}`);
  }
});

// Japao Azul
const productRegex = /\{\s*id:\s*"c9d0e1f2-0000-0000-0000-japao0000000"[\s\S]*?\}/gs;
content = content.replace(productRegex, (match) => {
    let newBlock = match;
    // ensure image is japao-frente
    newBlock = newBlock.replace(/image:\s*`\$\{BASE_URL\}\/japao-[^`]+`,/, 'image: `${BASE_URL}/japao-frente.jpg`,');
    // ensure images array has japao-frente first
    newBlock = newBlock.replace(/images:\s*\[[^\]]+\],/, 'images: [`${BASE_URL}/japao-frente.jpg`, `${BASE_URL}/japao-verso.jpg`, `${BASE_URL}/japao-detalhe.jpg`],');
    return newBlock;
});

fs.writeFileSync('src/data/products.ts', content, 'utf8');
console.log('Updated products.ts');
