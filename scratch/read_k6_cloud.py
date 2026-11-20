with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(38825, 38875):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')
