const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="tab-petualangan6"');
const eIdx = html.indexOf('</section>', sIdx);
console.log('tab-petualangan6 start:', sIdx, 'end:', eIdx);
console.log('Length:', eIdx - sIdx);
