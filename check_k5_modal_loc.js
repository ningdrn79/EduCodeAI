const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const sIdx = html.indexOf('id="modal-monitoring-portofolio-kelas5"');
console.log('modal-monitoring-portofolio-kelas5 idx:', sIdx);
if (sIdx !== -1) {
  console.log(html.substring(sIdx, sIdx + 500));
}
