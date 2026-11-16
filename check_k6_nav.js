const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="navbar-tampilan-kelas6"');
console.log('navbar-tampilan-kelas6 idx:', sIdx);
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 1600));
}
