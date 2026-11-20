with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(6750, min(6950, len(lines))):
    if any(k in lines[i] for k in ['nilaiSistemPresentasiP5', 'nilaiSistemSertifikatP5', 'nilaiSistemPosterP5', 'simpanSertifikatHourOfCodeP5', 'simpanPosterCanvaP5']):
        print(f"{i+1}: {lines[i]}", end='')
