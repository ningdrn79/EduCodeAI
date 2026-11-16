const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const sIdx = app.indexOf('tbody.innerHTML');
console.log('tbody.innerHTML idx:', sIdx);
if (sIdx !== -1) {
  console.log(app.substring(sIdx - 200, sIdx + 1500));
}
