const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="tab-antarteman"');
if (sIdx !== -1) {
  console.log(html.substring(sIdx + 2000, sIdx + 3500));
}
