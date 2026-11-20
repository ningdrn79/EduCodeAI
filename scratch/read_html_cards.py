with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Top cards:")
for i in range(3570, 3630):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')

print("\nPPT Section system grading card:")
for i in range(3815, 3850):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')
