const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

const matches = [];
const lines = app.split('\n');
lines.forEach((l, i) => {
  if (l.includes('guru-tbody-siswa') || l.includes('tabel-siswa-guru') || l.includes('guru-tabel-siswa') || l.includes('tbody-siswa')) {
    matches.push(`${i+1}: ${l.slice(0, 100)}`);
  }
});
console.log('Matches:', matches);
