const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const matches = [];
const lines = app.split('\n');
lines.forEach((l, i) => {
  if (l.includes('renderDasborGuru') || l.includes('renderTabelGuru') || l.includes('filterKelasGuru') || l.includes('isKelas6') || l.includes('kelas6')) {
    if (l.includes('function ') || l.includes('const ') || l.includes('let ') || l.includes('if (')) {
      matches.push(`${i+1}: ${l.slice(0, 100)}`);
    }
  }
});
console.log('Matches:', matches.slice(0, 30));
