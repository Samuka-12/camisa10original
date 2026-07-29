const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'products.ts');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/price:\s*"R\$\s*[\d,]+"/g, 'price: "R$ 90,93"');
content = content.replace(/priceNum:\s*[\d.]+/g, 'priceNum: 90.93');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Prices updated successfully.');
