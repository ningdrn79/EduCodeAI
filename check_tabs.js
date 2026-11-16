const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('tab-petualangan6:', html.includes('id="tab-petualangan6"'));
console.log('tab-antarteman:', html.includes('id="tab-antarteman"'));
console.log('tab-kuis:', html.includes('id="tab-kuis"'));
