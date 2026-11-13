const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

console.log('=== buka & tutup ModalMonitoringPortofolioKelas5 ===');
console.log(lines.slice(27524, 27555).join('\n'));
console.log('...');
console.log(lines.slice(27740, 27760).join('\n'));
