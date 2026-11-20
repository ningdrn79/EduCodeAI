with open('index.html', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k in line for k in ['Sinkron Cloud Antar PC', 'sinkronCloudAntarPC', 'bukaDrive7Kebiasaan', 'unggahDrive7KebiasaanKeFirestore']):
            print(f"{idx+1}: {line.strip()[:100]}")
