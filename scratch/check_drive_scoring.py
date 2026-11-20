with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k in line for k in ['nilaiDrive', 'nilaiPrak1', 'hitungNilaiDrive', 'colDrive', 'koleksi 7 kebiasaan', 'Drive 7 Kebiasaan']):
            if any(term in line for term in ['nilai', 'score', 'rubrik', '100', 'buku', 'rapor', 'database']):
                print(f"app.js:{idx+1}: {line.strip()[:100]}")
