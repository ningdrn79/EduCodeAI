with open('index.html', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k.lower() in line.lower() for k in ['total tabungan sisa', 'tabungan dan uang saku', 'uang saku', 'kirim nilai ke guru']):
            print(f"index.html:{idx+1}: {line.strip()[:100]}")

with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k.lower() in line.lower() for k in ['total tabungan sisa', 'tabungan dan uang saku', 'uang saku']):
            print(f"app.js:{idx+1}: {line.strip()[:100]}")
