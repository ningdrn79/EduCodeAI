const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('4 KARTU MENU NAVIGASI DOCK PILAR');
console.log('4 kartu idx:', sIdx);
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 1200));
}
