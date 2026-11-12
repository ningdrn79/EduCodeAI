const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

console.log('=== KELAS 4, 5, 6 IN CODEBASE ===');
console.log('HTML mentions:');
console.log('Kelas 4:', (html.match(/kelas\s*4/gi) || []).length);
console.log('Kelas 5:', (html.match(/kelas\s*5/gi) || []).length);
console.log('Kelas 6:', (html.match(/kelas\s*6/gi) || []).length);

console.log('\napp.js mentions:');
console.log('Kelas 4:', (app.match(/kelas\s*4/gi) || []).length);
console.log('Kelas 5:', (app.match(/kelas\s*5/gi) || []).length);
console.log('Kelas 6:', (app.match(/kelas\s*6/gi) || []).length);

// Check classes in student database
const classMatches = app.match(/kelas:\s*['"]([^'"]+)['"]/g) || [];
const uniqueClasses = new Set(classMatches.map(m => m.replace(/kelas:\s*['"]/, '').replace(/['"]/, '')));
console.log('\nUnique classes in student database literals:', Array.from(uniqueClasses));

// Check switchTab or tab navigation
const tabMatches = html.match(/switchTab\(['"]([^'"]+)['"]\)/g) || [];
const uniqueTabs = new Set(tabMatches.map(m => m.replace(/switchTab\(['"]/, '').replace(/['"]\)/, '')));
console.log('\nUnique tabs accessed via switchTab:', Array.from(uniqueTabs));

// Check role / grade switching logic
console.log('\nChecking functions handling grade/kelas:');
const gradeFuncs = app.match(/function\s+[a-zA-Z0-9_]*(?:kelas|grade|tingkat|rombel)[a-zA-Z0-9_]*\s*\(/gi) || [];
console.log('Grade related functions in app.js:', gradeFuncs);

// Look for kelas 6 specific UI or tabs
const k6Sections = [];
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.toLowerCase().includes('kelas 6') || l.toLowerCase().includes('kelas6') || l.toLowerCase().includes('petualangan6')) {
    k6Sections.push(`Line ${idx+1}: ${l.trim().slice(0, 100)}`);
  }
});
console.log(`\nLines mentioning Kelas 6 in index.html (Total: ${k6Sections.length}):`);
k6Sections.slice(0, 20).forEach(s => console.log('  ', s));
