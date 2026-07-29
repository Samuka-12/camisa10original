const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'products.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace "R$ 90,93" with "R$ 109,93"
content = content.replace(/R\$ 90,93/g, 'R$ 109,93');
// Replace priceNum: 90.93 with priceNum: 109.93
content = content.replace(/priceNum: 90\.93/g, 'priceNum: 109.93');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Updated all product prices in src/data/products.ts to R$ 109,93 / 109.93');
