const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('zona-algoritma') || l.includes('tab-algoritma') || l.includes('algo-teori-single-view')) {
    matches.push(`${i+1}: ${l.slice(0, 100)}`);
  }
});
console.log('Matches:', matches);
