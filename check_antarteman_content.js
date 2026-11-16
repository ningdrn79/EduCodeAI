const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="tab-antarteman"');
console.log('tab-antarteman idx:', sIdx);
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 1200));
}
