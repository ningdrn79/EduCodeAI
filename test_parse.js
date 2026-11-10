
const fs = require('fs');

// Simulate Google JSONP response for 6A
const sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs';

async function test() {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=6A`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonStr = text.replace(/^[^{]*\(/, '').replace(/\);?\s*$/, '');
  const parsed = JSON.parse(jsonStr);

  console.log("Cols:", parsed.table.cols.map(c => c.label));
  console.log("Total rows:", parsed.table.rows.length);

  // Run the logic from app.js
  let colMap = { nis: -1, nama: -1, kelas: -1, absen: -1, jk: -1, tempatLahir: -1, tanggalLahir: -1 };
  const checkHeaderField = (txt, idx) => {
    const t = (txt || '').toLowerCase().trim();
    if (!t) return;
    if (t.includes('kelamin') || t.includes('gender') || t === 'jk' || t === 'l/p' || t.includes('jenis')) {
      if (colMap.jk === -1) colMap.jk = idx;
    } else if (!t.includes('jenis') && (t === 'nis' || t.startsWith('nis') || t.endsWith('nis') || t.includes('no. induk') || t.includes('nomor induk') || t.includes('induk'))) {
      if (colMap.nis === -1) colMap.nis = idx;
    } else if (t.includes('nama')) {
      if (colMap.nama === -1) colMap.nama = idx;
    } else if (t.includes('urut') || t.includes('absen') || t === 'no' || t === 'no.' || t.startsWith('no.') || t.startsWith('no ')) {
      if (colMap.absen === -1) colMap.absen = idx;
    }
  };

  parsed.table.cols.forEach((col, idx) => {
    checkHeaderField(((col.label || '') + ' ' + (col.id || '')).trim(), idx);
  });
  console.log("ColMap after cols:", colMap);

  const rows = parsed.table.rows;
  let startIndex = 0;
  let foundHeader = false;
  const scanLimit = Math.min(rows.length, 12);
  for (let rIdx = 0; rIdx < scanLimit; rIdx++) {
    const rCells = rows[rIdx] ? (rows[rIdx].c || []) : [];
    let hasNis = false;
    let hasNama = false;
    rCells.forEach(cell => {
      if (!cell) return;
      const str = ((cell.f || cell.v || '') + '').toLowerCase().trim();
      if ((str.includes('nis') || str.includes('induk')) && !str.includes('jenis')) hasNis = true;
      if (str.includes('nama')) hasNama = true;
    });

    if (hasNis || hasNama) {
      foundHeader = true;
      startIndex = rIdx + 1;
      console.log(`Matched header in row ${rIdx}! Setting startIndex to ${startIndex}`);
      rCells.forEach(c => console.log("   cell:", c ? (c.f || c.v) : null));
      break;
    }
  }
  console.log("Final startIndex:", startIndex);
}
test();
