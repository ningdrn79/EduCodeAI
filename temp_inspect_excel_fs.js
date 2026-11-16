const fs = require('fs');
const js = fs.readFileSync('app.js', 'utf8');

let idx = js.indexOf('function toggleExcelFullscreen(');
console.log(js.substring(idx, idx + 2500));
