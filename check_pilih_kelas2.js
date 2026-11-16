const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('function pilihKelasGuruNav');
if (sIdx !== -1) {
  console.log(app.substring(sIdx + 800, sIdx + 2000));
}
