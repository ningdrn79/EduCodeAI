const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const zAlgoStart = html.indexOf('id="p6-zona-algoritma"');
console.log('zAlgoStart idx:', zAlgoStart);
if (zAlgoStart !== -1) {
  console.log(html.substring(zAlgoStart - 100, zAlgoStart + 300));
}
