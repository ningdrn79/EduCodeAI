with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if 'hitungNilaiDrive7Kebiasaan' in line:
            print(f"app.js:{idx+1}: {line.strip()[:100]}")
