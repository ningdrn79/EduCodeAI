with open('index.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if any(k in line for k in ['simpanTugasPresentasiP5', 'btn-nilai-sistem', 'perbaruiRingkasanStatusP5', 'muatPortofolioKelas5Aktif']):
            print(f"{i+1}: {line.strip()[:100]}")
