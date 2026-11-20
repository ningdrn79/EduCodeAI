with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if any(k.lower() in line.lower() for k in ['sinkron cloud antar pc', 'bukadrive7kebiasaan', 'drive 7 kebiasaan']):
            print(f"{idx+1}: {line.strip()[:100]}")
