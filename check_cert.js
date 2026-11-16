const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('modal-sertifikat') || l.includes('certificate-box') || l.includes('cetakSertifikat') || l.includes('bukaModalSertifikat')) {
    matches.push(`${i+1}: ${l.slice(0, 100)}`);
  }
});
console.log('Matches:', matches);
