with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

p_start, p_end = -1, -1
m_start, m_end = -1, -1

for i, line in enumerate(lines):
    if "window.perbaruiRingkasanStatusP5 = function() {" in line:
        p_start = i
    if p_start != -1 and p_end == -1 and line.strip() == "};" and i > p_start:
        p_end = i
    if "window.muatPortofolioKelas5Aktif = function() {" in line:
        m_start = i
    if m_start != -1 and m_end == -1 and line.strip() == "};" and i > m_start:
        m_end = i

print(f"p_start: {p_start+1}, p_end: {p_end+1}")
print(f"m_start: {m_start+1}, m_end: {m_end+1}")

print("perbaruiRingkasanStatusP5 block:")
for i in range(p_start, p_end+1):
    print(lines[i], end='')

print("\nmuatPortofolioKelas5Aktif block:")
for i in range(m_start, m_end+1):
    print(lines[i], end='')
