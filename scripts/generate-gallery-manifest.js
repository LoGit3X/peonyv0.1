const fs = require('fs');
const path = require('path');

const galleryDir = path.join(__dirname, '../user/static/gallery');
const manifestPath = path.join(galleryDir, 'manifest.json');

const images = fs.readdirSync(galleryDir)
  .filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file))
  .map(file => `/gallery/${file}`);

fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2));
console.log('Gallery manifest generated:', manifestPath); 