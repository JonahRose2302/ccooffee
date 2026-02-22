import os
import re

base_dir = r"c:\Users\Jona\OneDrive\Dokumente\ccooffee"

# index.html has the updated home section.
# shops.html has the remaining sections untouched (brew, drinks, dialin, shops)
# knowledge.html has the original knowledge section

def get_file(name):
    with open(os.path.join(base_dir, name), "r", encoding="utf-8") as f:
        return f.read()

index_html = get_file("index.html")
shops_html = get_file("shops.html")
knowl_html = get_file("knowledge.html")

pages = {
    'home': 'index.html',
    'brew': 'brew.html',
    'drinks': 'drinks.html',
    'dialin': 'dialin.html',
    'shops': 'shops.html',
    'knowledge': 'knowledge.html'
}

# The layout templates
head_and_top = index_html.split('<nav id="main-nav"')[0]
nav_to_main = index_html.split('<main id="app">')[0].split('</nav>')[1]

# Extract exact sections using simple string split
def extract_section(source_html, section_id):
    tag = f'<section id="{section_id}"'
    if tag not in source_html:
        return ""
    part = source_html.split(tag)[1]
    inner = part.split('</section>')[0]
    return tag + inner + '</section>'

sections = {
    'home': extract_section(index_html, 'home'),
    'brew': extract_section(shops_html, 'brew'),
    'drinks': extract_section(shops_html, 'drinks'),
    'dialin': extract_section(shops_html, 'dialin'),
    'shops': extract_section(shops_html, 'shops'),
    'knowledge': extract_section(knowl_html, 'knowledge')
}

# Modals
modals_part = shops_html.split('<!-- MODALS -->')[1].split('<script type="module" src="js/firebase-config.js">')[0]
scripts_part = '<script type="module" src="js/firebase-config.js">' + index_html.split('<script type="module" src="js/firebase-config.js">')[1]

global_modals = ""
m = re.search(r'(<!-- Auth Modal.*)', modals_part, re.DOTALL)
if m:
    global_modals = m.group(1)

def build_nav(active_page_key):
    nav_html = '<nav id="main-nav" class="glass-nav">\n'
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

for key, filename in pages.items():
    page_html = head_and_top
    page_html += build_nav(key)
    page_html += '\n' + nav_to_main.strip() + '\n\n'
    
    if key == 'knowledge':
        page_html += '    <main id="app">\n    </main>\n'
        page_html += sections[key] + '\n'
        page_html += '    <!-- MODALS -->\n'
        page_html += global_modals + '\n'
    else:
        page_html += '    <main id="app">\n'
        sec_html = sections[key]
        if 'class="page"' in sec_html and 'active' not in sec_html:
            sec_html = sec_html.replace('class="page"', 'class="page active"')
            
        page_html += "        " + sec_html.strip() + '\n    </main>\n'
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

print("HTML re-splitting complete.")
