with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(31000, min(31100, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
