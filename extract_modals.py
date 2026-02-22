import subprocess

out = subprocess.check_output(['git', 'show', 'HEAD:index.html'], encoding='utf-8')
lines = out.split('\n')
brew_modal = []
in_brew = False
drink_modal = []
in_drink = False

for line in lines:
    if 'id="brew-modal"' in line:
        in_brew = True
    if in_brew:
        brew_modal.append(line)
        if '</div>' in line and len(brew_modal) > 10 and '    </div>' == line.rstrip():
            in_brew = False

    if 'id="drink-modal"' in line:
        in_drink = True
    if in_drink:
        drink_modal.append(line)
        if '</div>' in line and len(drink_modal) > 10 and '    </div>' == line.rstrip():
            in_drink = False

with open('brew_modal.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(brew_modal))

with open('drink_modal.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(drink_modal))

print(len(brew_modal), len(drink_modal))
