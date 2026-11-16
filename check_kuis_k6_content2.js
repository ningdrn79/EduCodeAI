const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="kuis-kelas6-container"');
if (sIdx !== -1) {
  console.log(html.substring(sIdx + 1200, sIdx + 2800));
}
