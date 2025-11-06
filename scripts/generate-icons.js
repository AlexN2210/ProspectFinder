// Script pour créer des icônes PNG à partir du SVG
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'pwa-icon.svg');

// Vérifier si sharp est disponible
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('⚠️  Sharp n\'est pas installé. Installation...');
  console.log('   Exécutez: yarn add -D sharp');
  process.exit(1);
}

if (!fs.existsSync(svgPath)) {
  console.error('❌ Fichier SVG introuvable:', svgPath);
  process.exit(1);
}

const sizes = [192, 512];

console.log('🖼️  Génération des icônes PNG...\n');

for (const size of sizes) {
  const filename = `pwa-${size}x${size}.png`;
  const filepath = path.join(publicDir, filename);
  
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(filepath);
    
    console.log(`✓ Créé ${filename} (${size}x${size}px)`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${filename}:`, error.message);
  }
}

console.log('\n✅ Icônes générées avec succès!');

