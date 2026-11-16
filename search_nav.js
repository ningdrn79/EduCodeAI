const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

console.log('--- Search nav-p6 in app.js ---');
lines.forEach((l, idx) => {
  if (l.includes('nav-p6-')) {
    console.log((idx+1) + ': ' + l.trim().slice(0, 120));
  }
});
