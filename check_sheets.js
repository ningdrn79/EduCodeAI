
const https = require('https');

const sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs';
const tabs = ['4A', '4B', '4C', '4D', '4E', '5A', '5B', '5C', '5D', '5E', '6A', '6B', '6C', '6D', '6E', 'Sheet1', 'DATA SISWA LMS'];

function fetchTab(tab) {
  return new Promise((resolve) => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.trim().split('\n').filter(l => l.trim().length > 0);
        resolve({ tab, count: lines.length, preview: lines.slice(0, 3) });
      });
    }).on('error', (err) => {
      resolve({ tab, error: err.message });
    });
  });
}

async function run() {
  for (const t of tabs) {
    const r = await fetchTab(t);
    console.log(JSON.stringify(r));
  }
}
run();
