const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('function renderDasborGuru');
if (sIdx !== -1) {
  console.log(app.substring(sIdx + 1200, sIdx + 2600));
}
