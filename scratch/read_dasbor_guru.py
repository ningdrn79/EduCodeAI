with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(29880, 29910):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')
