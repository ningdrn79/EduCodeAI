const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

console.log('--- Checking line 24870-24875 ---');
for (let j = 24868; j <= 24875; j++) console.log(`${j+1}: ${lines[j]}`);

console.log('--- Checking line 26970-26985 ---');
for (let j = 26970; j <= 26985; j++) console.log(`${j+1}: ${lines[j]}`);

console.log('--- Checking line 27440-27450 ---');
for (let j = 27440; j <= 27450; j++) console.log(`${j+1}: ${lines[j]}`);

console.log('--- Checking line 35020-35045 ---');
for (let j = 35020; j <= 35045; j++) console.log(`${j+1}: ${lines[j]}`);
