import re

with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

collections = set(re.findall(r"collection\(['\"]([a-zA-Z0-9_\-]+)['\"]\)", text))
print("Collections found in app.js:", collections)

with open('index.html', 'r', encoding='utf-8') as f:
    text_html = f.read()

collections_html = set(re.findall(r"collection\(['\"]([a-zA-Z0-9_\-]+)['\"]\)", text_html))
print("Collections found in index.html:", collections_html)
