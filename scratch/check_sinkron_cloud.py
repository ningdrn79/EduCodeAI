with open('index.html', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k.lower() in line.lower() for k in ['antar pc', 'sinkron cloud', 'sinkronisasi cloud', 'unggahdrive']):
            print(f"index.html:{idx+1}: {line.strip()[:100]}")

with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k.lower() in line.lower() for k in ['antar pc', 'sinkron cloud', 'sinkronisasi cloud', 'unggahdrive']):
            print(f"app.js:{idx+1}: {line.strip()[:100]}")
