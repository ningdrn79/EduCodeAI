const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="tab-kuis"');
console.log('tab-kuis idx:', sIdx);
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 1200));
}
