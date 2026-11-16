const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const navStart = html.indexOf('id="navbar-tampilan-kelas6"');
const navEnd = html.indexOf('</div>', html.indexOf('</nav>', navStart));
console.log('navbar-tampilan-kelas6:', html.substring(navStart, navEnd + 6));
