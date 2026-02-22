import re

file_path = r'c:\Users\Jona\OneDrive\Dokumente\ccooffee\shops.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

try:
    main_content = html.split('<main id="app">')[1].split('</main>')[0]
    match = re.search(r'(\s*<!--.*?-->\s*)*<section id="shops".*?</section>', main_content, re.DOTALL)
    if match:
         print("Length of match:", len(match.group(0)))
         print("Number of sections in match:", len(re.findall(r'<section ', match.group(0))))
    else:
         print("NO MATCH")
except Exception as e:
    print(e)
