import os
import re

file_path = r"c:\Users\Jona\OneDrive\Dokumente\ccooffee\index.html"
with open(file_path, "r", encoding="utf-8") as f:
    html = f.read()

pages = {
    'home': 'index.html',
    'brew': 'brew.html',
    'drinks': 'drinks.html',
    'dialin': 'dialin.html',
    'shops': 'shops.html',
    'knowledge': 'knowledge.html'
}

head_and_top = html.split('<nav id="main-nav" class="glass-nav">')[0]
nav_to_main = html.split('<main id="app">')[0].split('</nav>')[1]

main_content = html.split('<main id="app">')[1].split('</main>')[0]

sections = {}
for p in pages.keys():
    match = re.search(rf'(\s*<!--.*?-->\s*)*<section id="{p}".*?</section>', main_content, re.DOTALL)
    if match:
        sections[p] = match.group(0)

# Knowledge section is inside <main id="app"> in index.html or outside?
# Let's check html again for knowledge:
if 'knowledge' not in sections or not sections['knowledge']:
    match = re.search(r'(\s*<!-- KNOWLEDGE BASE -->\s*<section id="knowledge".*?</section>)', html, re.DOTALL)
    if match:
        sections['knowledge'] = match.group(1)

modals_part = html.split('<!-- MODALS -->')[1].split('<!-- KNOWLEDGE BASE -->')[0]
if '<!-- KNOWLEDGE BASE -->' not in html:
    try:
        modals_part = html.split('<!-- MODALS -->')[1].split('<script type="module" src="js/firebase-config.js">')[0]
    except Exception:
        pass

scripts_part = '<script type="module" src="js/firebase-config.js">' + html.split('<script type="module" src="js/firebase-config.js">')[1]


def build_nav(active_page_key):
    nav_html = '    <nav id="main-nav" class="glass-nav">\n'
    nav_items = [
        ('home', 'home', 'home'),
        ('brew', 'coffee_maker', 'brew'),
        ('drinks', 'menu_book', 'drinks'),
        ('shops', 'storefront', 'shops'),
        ('dialin', 'tune', 'dialin'),
        ('knowledge', 'school', 'knowledge')
    ]
    for key, icon, url_key in nav_items:
        href = pages[url_key]
        active_class = " active-nav" if key == active_page_key else ""
        nav_html += f'        <button class="nav-btn{active_class}" onclick="window.location.href=\'{href}\'"><span class="material-symbols-rounded">{icon}</span></button>\n'
    nav_html += '    </nav>'
    return nav_html

base_dir = r"c:\Users\Jona\OneDrive\Dokumente\ccooffee"

# Extract global modals
global_modals = ""
match = re.search(r'(<!-- Auth Modal.*)', modals_part, re.DOTALL)
if match:
    global_modals = match.group(1)

for key, filename in pages.items():
    page_html = head_and_top
    page_html += build_nav(key)
    page_html += '\n' + nav_to_main
    
    if key == 'knowledge':
        page_html += '<main id="app">\n</main>\n'
        page_html += sections[key] + '\n'
        page_html += '    <!-- MODALS -->\n'
        page_html += global_modals + '\n'
    else:
        page_html += '<main id="app">\n'
        sec_html = sections[key]
        # ensure it is active
        if 'class="page"' in sec_html and 'active' not in sec_html:
            sec_html = sec_html.replace('class="page"', 'class="page active"')
            
        page_html += sec_html + '\n</main>\n'
        page_html += '\n    <!-- MODALS -->\n'
        
        # specific modals
        if key == 'brew':
            brew_m = re.search(r'(<!-- Brew Modal -->.*?</div>\s*</div>)', modals_part, re.DOTALL)
            if brew_m: page_html += brew_m.group(1) + '\n\n'
        elif key == 'drinks':
            drink_m = re.search(r'(<!-- Drink Modal -->.*?</div>\s*</div>)', modals_part, re.DOTALL)
            if drink_m: page_html += drink_m.group(1) + '\n\n'
        elif key == 'shops':
            shop_m = re.search(r'(<!-- Shop Modal -->.*?</div>\s*</div>)', modals_part, re.DOTALL)
            if shop_m: page_html += shop_m.group(1) + '\n\n'
            
        page_html += global_modals + '\n'
    
    page_html += scripts_part
    
    output_path = os.path.join(base_dir, filename)
    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write(page_html)

print("HTML splitting complete.")
