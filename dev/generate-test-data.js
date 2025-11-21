const fs = require('fs');
const path = require('path');

// Path to sample markdown showcase files
const testMdsDir = path.join(__dirname, '..', 'specs', 'sample-markdowns-showcase');
const files = fs.readdirSync(testMdsDir).filter(f => f.endsWith('.md'));

const testData = {};
files.forEach(file => {
  const content = fs.readFileSync(path.join(testMdsDir, file), 'utf-8');
  testData[file] = content;
});

console.log('// Auto-generated test file data');
console.log('const TEST_FILES = ' + JSON.stringify(testData, null, 2) + ';');
