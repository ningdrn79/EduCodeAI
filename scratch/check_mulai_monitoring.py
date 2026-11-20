with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if 'mulaiRealtimeMonitoring' in line:
            print(f"app.js:{idx+1}: {line.strip()[:100]}")

with open('index.html', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if 'mulaiRealtimeMonitoring' in line:
            print(f"index.html:{idx+1}: {line.strip()[:100]}")
