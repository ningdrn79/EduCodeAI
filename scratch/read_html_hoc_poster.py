with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("HOC & Poster cards:")
for i in range(4035, 4065):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')

print("---")
for i in range(4150, 4175):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')
