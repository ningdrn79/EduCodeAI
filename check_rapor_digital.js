const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('function isiDataRaporDigital');
console.log('isiDataRaporDigital idx:', sIdx);
if (sIdx !== -1) {
  console.log(app.substring(sIdx, sIdx + 1200));
}
