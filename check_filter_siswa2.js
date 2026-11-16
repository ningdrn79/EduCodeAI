const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('function filterDanCariSiswa');
if (sIdx !== -1) {
  console.log(app.substring(sIdx + 1500, sIdx + 3000));
}
