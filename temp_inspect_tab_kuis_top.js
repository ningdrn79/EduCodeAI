const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let idx = html.indexOf('id="tab-kuis"');
console.log(html.substring(idx, idx + 1200));
