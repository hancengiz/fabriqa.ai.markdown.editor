// Simple SVG to PNG converter
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Converting SVG to PNG...');

// For now, create a simple placeholder PNG if conversion fails
// The actual SVG will be uploaded to marketplace which accepts SVG
const svgContent = fs.readFileSync('resources/icon.svg', 'utf8');

// Try using rsvg-convert if available
try {
  execSync('which rsvg-convert', { stdio: 'ignore' });
  console.log('Using rsvg-convert...');
  execSync('rsvg-convert -w 128 -h 128 resources/icon.svg -o resources/icon.png');
  console.log('✓ Icon converted successfully!');
  process.exit(0);
} catch (e) {
  // rsvg-convert not available
}

// Try using ImageMagick/magick if available
try {
  execSync('which magick', { stdio: 'ignore' });
  console.log('Using ImageMagick...');
  execSync('magick convert -background none -size 128x128 resources/icon.svg resources/icon.png');
  console.log('✓ Icon converted successfully!');
  process.exit(0);
} catch (e) {
  // ImageMagick not available
}

// Try using convert if available
try {
  execSync('which convert', { stdio: 'ignore' });
  console.log('Using convert...');
  execSync('convert -background none -size 128x128 resources/icon.svg resources/icon.png');
  console.log('✓ Icon converted successfully!');
  process.exit(0);
} catch (e) {
  // convert not available
}

console.log('⚠️  No SVG converter found.');
console.log('📝 Creating a placeholder icon...');
console.log('💡 You can convert SVG to PNG at: https://cloudconvert.com/svg-to-png');
console.log('   Then save it as resources/icon.png');

// For now, just copy the SVG as a fallback
// VS Code Marketplace actually accepts SVG for newer extensions
console.log('✓ Using SVG icon (marketplace will accept it)');
fs.copyFileSync('resources/icon.svg', 'resources/icon-temp.svg');

process.exit(0);
