const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'products.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Update Paraguay images
content = content.replace(/paraguai-reserva-frente\.jpg/g, 'paraguai-reserva-frente-novo.jpg');
content = content.replace(/paraguai-reserva-verso\.jpg/g, 'paraguai-reserva-verso-novo.jpg');
content = content.replace(/paraguai-reserva-detalhe\.jpg/g, 'paraguai-reserva-detalhe-novo.jpg');

// Fix Years
content = content.replace(/name:\s*"([^"]+)"/g, (match, nameStr) => {
    // Replace any year like 2024, 2025, 2024/26, 2026, 2026/27 with 2026/27
    let newName = nameStr.replace(/\b202\d(\/\d{2})?\b/g, '2026/27');
    // If there was no year in the name, add it at the end
    if (!newName.includes('2026/27')) {
        newName = newName + ' 2026/27';
    }
    return `name: "${newName}"`;
});

// Fix image arrays
// The format is:
// image: `${BASE_URL}/some-image.jpg`,
// images: [`${BASE_URL}/some-image.jpg`, ...],

// We will parse out each product block and reorder the images array.
// This regex matches a whole product object.
const productRegex = /\{\s*id:\s*"[^"]+",\s*image:\s*`\$\{BASE_URL\}\/([^`]+)`,\s*images:\s*\[([^\]]+)\].*?\}/gs;

content = content.replace(productRegex, (match, singleImage, imagesStr) => {
    // extract all images
    const imgRegex = /`\$\{BASE_URL\}\/([^`]+)`/g;
    let imgs = [];
    let imgMatch;
    while ((imgMatch = imgRegex.exec(imagesStr)) !== null) {
        imgs.push(imgMatch[1]);
    }

    // find the one with 'frente'
    let frenteIndex = imgs.findIndex(img => img.includes('frente'));
    if (frenteIndex > 0) {
        // move to front
        const frenteImg = imgs.splice(frenteIndex, 1)[0];
        imgs.unshift(frenteImg);
    } else if (frenteIndex === -1) {
        // no frente found, just use the first one
    }

    const firstImg = imgs[0];

    // reconstruct image and images lines
    const newImageLine = `image: \`\$\{BASE_URL\}/${firstImg}\`,`;
    const newImagesLine = `images: [${imgs.map(img => `\`\$\{BASE_URL\}/${img}\``).join(', ')}],`;

    // replace in the matched block
    let newBlock = match.replace(/image:\s*`\$\{BASE_URL\}\/[^`]+`,/, newImageLine);
    newBlock = newBlock.replace(/images:\s*\[[^\]]+\],/, newImagesLine);
    
    return newBlock;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('products.ts updated successfully.');
