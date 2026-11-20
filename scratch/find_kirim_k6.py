with open('app.js', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if 'function kirimTugasScratchK6' in line:
            for j in range(idx, min(idx+60, len(f.readlines()))):
                pass
            print(f"kirimTugasScratchK6 is at line {idx+1}")
