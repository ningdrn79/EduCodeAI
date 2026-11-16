const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const matches = [];
const lines = app.split('\n');
lines.forEach((l, i) => {
  if (l.includes('bukaRaporSiswaModal') || l.includes('modal-rapor') || l.includes('cetakPiagam')) {
    matches.push(`${i+1}: ${l.slice(0, 100)}`);
  }
});
console.log('Matches in app.js:', matches);
