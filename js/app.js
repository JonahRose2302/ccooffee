/* --- COFFEE APP JS v9 --- */
console.log('☕ App v9 Loading...');

/* --- GLOBAL UTILS --- */
const utils = {
    vibrate: (pattern = 10) => {
        if (navigator.vibrate) navigator.vibrate(pattern);
    },
    debounce: (func, wait) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    uuid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
};

/* === REVOLUTIONARY ANIMATION ENGINE === */
const animationEngine = {
    // Magnetic hover effect - elements are attracted to cursor
    enableMagnetic: (selector, strength = 0.25) => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = (e.clientX - centerX) * strength;
                const deltaY = (e.clientY - centerY) * strength;

                gsap.to(el, {
                    x: deltaX,
                    y: deltaY,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.3)"
                });
            });
        });
    },

    // Staggered reveal for lists/grids
    revealElements: (selector, delay = 0.08) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;

        // Disable CSS transitions before GSAP animation to prevent conflict
        elements.forEach(el => el.style.transition = 'none');

        gsap.from(elements, {
            opacity: 0,
            y: 50,
            scale: 0.9,
            stagger: delay,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "all",
            onComplete: () => {
                // Restore CSS transition after animation if clearProps missed anything
                elements.forEach(el => el.style.transition = '');
            }
        });
    },

    // Ripple effect on click
    createRipple: (element, event) => {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(244,196,48,0.4) 0%, transparent 70%);
            top: ${y}px;
            left: ${x}px;
            pointer-events: none;
            transform: scale(0);
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        gsap.to(ripple, {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => ripple.remove()
        });
    },

    // Enhanced page transition on load
    transitionPage: () => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            gsap.fromTo(activePage,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.98
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "power3.out",
                    clearProps: "all"
                }
            );
        }
    }
};

// Router removed entirely in favor of multi-page setup.

/* --- KNOWLEDGE MANAGER --- */
const KNOWLEDGE_DATA = [
    {
        id: 'extraction',
        icon: 'science',
        title: 'Extraktions-Physik',
        desc: 'Das Variablen-Dreieck, Brew Ratio und Extraktionsstufen.',
        content: `
            <h3>1. Das Variablen-Dreieck</h3>
            <p>Jeder Shot wird von drei Hauptvariablen bestimmt, die sich gegenseitig beeinflussen:</p>
            <ul>
                <li><strong>Dosis (In):</strong> Die Menge an gemahlenem Kaffee (Standard: 17g – 19g für ein Doppelsieb).</li>
                <li><strong>Ertrag (Out / Yield):</strong> Das Gewicht des fertigen Getränks in der Tasse.</li>
                <li><strong>Zeit:</strong> Die Dauer des Wasserflusses (Ziel: 25–32 Sek.).</li>
            </ul>

            <h3>2. Die Brew Ratio (Brühverhältnis)</h3>
            <p>Die Ratio definiert den Stil des Espressos:</p>
            <ul>
                <li><strong>Ristretto (1:1 bis 1:1,5):</strong> Extrem viskos, intensiv, oft säurebetont.</li>
                <li><strong>Standard Espresso (1:2 bis 1:2,5):</strong> Die goldene Mitte für Balance und Klarheit.</li>
                <li><strong>Lungo (1:3 oder höher):</strong> Mehr Klarheit, weniger Körper, oft eher bitter.</li>
            </ul>

            <h3>3. Extraktionsstufen</h3>
            <p>Wasser löst Inhaltsstoffe in einer festen Reihenfolge:</p>
            <ol>
                <li><strong>Fruchtsäuren & Lipide:</strong> Werden sofort gelöst.</li>
                <li><strong>Maillard-Aromen & Zucker:</strong> Sorgen für Süße und Körper.</li>
                <li><strong>Tannine & Bitterstoffe:</strong> Lösen sich erst spät bei hoher Hitze.</li>
            </ol>
        `
    },
    {
        id: 'puck',
        icon: 'layers',
        title: 'Puck-Vorbereitung',
        desc: 'Mahlgrad, WDT, Leveling und Tamping für channel-freie Shots.',
        content: `
            <h3>1. Die Mühle (Der Fokus)</h3>
            <ul>
                <li><strong>Mahlgrad-Konsistenz:</strong> Die Partikelverteilung entscheidet über den Fließwiderstand.</li>
                <li><strong>RDT (Ross Droplet Technique):</strong> Ein Sprühstoß Wasser auf die Bohnen eliminiert Statik.</li>
                <li><strong>RPM-Einfluss:</strong> Höhere Drehzahlen erzeugen mehr "Fines" (Feinstaub), was die Extraktion erhöht.</li>
            </ul>

            <h3>2. Distribution & Tamping</h3>
            <ul>
                <li><strong>WDT (Weiss Distribution Technique):</strong> Umrühren mit dünnen Nadeln (0.3mm) bricht Klumpen auf.</li>
                <li><strong>Leveling:</strong> Die Oberfläche muss vor dem Tampen absolut plan sein.</li>
                <li><strong>Tamping:</strong> 10–15kg Druck reichen. Wichtiger ist, absolut gerade zu tampen.</li>
                <li><strong>Puck Screen:</strong> Schützt die Dusche und verteilt Wasser sanfter.</li>
            </ul>
        `
    },
    {
        id: 'milk',
        icon: 'water_drop',
        title: 'Milchhandwerk',
        desc: 'Chemie der Milch, Ziehphase, Rollphase und Latte Art.',
        content: `
            <h3>1. Chemie der Milch</h3>
            <ul>
                <li><strong>Proteine:</strong> Verantwortlich für Schaumstabilität. Denaturieren über 70°C (Geschmack "nach Ei").</li>
                <li><strong>Laktose:</strong> Süße nimmt bei Erwärmung subjektiv zu.</li>
                <li><strong>Fett:</strong> Geschmacksträger für das seidige Mundgefühl.</li>
            </ul>

            <h3>2. Die Zwei-Phasen-Technik</h3>
            <ul>
                <li><strong>Ziehphase (Stretching):</strong> Lanze knapp unter Oberfläche, "Ripping-Geräusch". Volumen entsteht.</li>
                <li><strong>Rollphase (Rolling):</b> Lanze tiefer, Wirbel (Vortex) erzeugen. Zerkleinert Blasen zu Mikroschaum.</li>
                <li><strong>Temp-Limit:</strong> Stop bei ca. 60–65°C (wenn Kännchen heiß wird).</li>
            </ul>

            <h3>3. Definitionen</h3>
            <ul>
                <li><strong>Cappuccino:</strong> 1/3 Espresso, 1/3 Milch, 1/3 Schaum.</li>
                <li><strong>Flat White:</strong> Double Shot, dünne Schicht Mikroschaum. Fokus auf Kaffee.</li>
            </ul>
        `
    },
    {
        id: 'expert',
        icon: 'psychology',
        title: 'Expertenwissen',
        desc: 'Flow Profiling, Wasserchemie und TDS-Messung.',
        content: `
            <h3>1. Manuelle Extraktion</h3>
            <ul>
                <li><strong>Pre-Infusion:</strong> Puck bei 2 Bar für 10s tränken (verhindert Channeling).</li>
                <li><strong>Flow Profiling:</strong> Druck am Ende senken (z.B. 9 auf 6 Bar), um Bitterkeit zu reduzieren.</li>
            </ul>

            <h3>2. Wasserchemie</h3>
            <ul>
                <li><strong>Gesamthärte (GH):</strong> 3–6° dH (Magnesium/Calcium als Geschmacksträger).</li>
                <li><strong>Karbonathärte (KH):</strong> 2–3° dH (Puffert Säure). Zu hoch = flach/kalkig.</li>
            </ul>

            <h3>3. TDS & Refraktometrie</h3>
            <ul>
                <li><strong>TDS:</strong> Total Dissolved Solids (Typisch 8–12%).</li>
                <li><strong>Extraction Yield (EY):</strong> Ziel 18–22% der Bohne gelöst.</li>
            </ul>
        `
    },
    {
        id: 'roast',
        icon: 'local_fire_department',
        title: 'Röstphysik',
        desc: 'Von der Maillard-Reaktion bis zum First Crack.',
        content: `
            <h3>Phasen der Röstung</h3>
            <ul>
                <li><strong>Drying Phase (Gelb):</strong> Feuchtigkeitsverlust.</li>
                <li><strong>Maillard-Reaktion:</strong> Ab 160°C. Zucker & Aminosäuren reagieren (Aromen entstehen).</li>
                <li><strong>Caramelization:</strong> Zucker karamellisiert, Bitterkeit steigt, Körper bildet sich.</li>
                <li><strong>First Crack:</strong> "Popcorn"-Geräusch. Zellstruktur bricht auf.</li>
            </ul>

            <h3>Röstprofile</h3>
            <ul>
                <li><strong>Light Roast:</strong> Kurz nach 1st Crack beenden (Fruchtig/Floral).</li>
                <li><strong>Medium Roast:</strong> Maximale Süße (Mitte Development Time).</li>
            </ul>
            <p><strong>Degassing:</strong> Frisch gerösteter Kaffee braucht mind. 7 Tage Ruhe (CO2-Ausgasung).</p>
        `
    },
    {
        id: 'trouble',
        icon: 'build',
        title: 'Troubleshooting',
        desc: 'Probleme im Geschmack erkennen und beheben.',
        content: `
            <h3>Fehlerdiagnose</h3>
            <table>
                <thead>
                    <tr>
                        <th>Geschmack</th>
                        <th>Ursache</th>
                        <th>Lösung</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Sauer / Stechend</td>
                        <td>Unterextraktion</td>
                        <td>Feiner mahlen / Wärmer / Mehr Yield</td>
                    </tr>
                    <tr>
                        <td>Bitter / Trocken</td>
                        <td>Überextraktion</td>
                        <td>Gröber mahlen / Kälter / Weniger Yield</td>
                    </tr>
                    <tr>
                        <td>Salzig / Wässrig</td>
                        <td>Massive Unterextraktion</td>
                        <td>Viel feiner mahlen / Dosis erhöhen</td>
                    </tr>
                    <tr>
                        <td>Flach / Langweilig</td>
                        <td>Wasser zu hart (KH)</td>
                        <td>Wasser filtern / Weicheres Wasser</td>
                    </tr>
                    <tr>
                        <td>Sauer & Bitter</td>
                        <td>Channeling</td>
                        <td>Bessere Puck-Prep (WDT)</td>
                    </tr>
                </tbody>
            </table>
        `
    }
];

const knowledgeManager = {
    init: () => {
        const grid = document.getElementById('knowledge-grid');
        if (!grid) { console.error('❌ knowledge-grid not found'); return; }

        console.log('✅ knowledgeManager initializing...');
        knowledgeManager.renderGrid(grid);

        // Event Delegation
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.knowledge-card');
            if (card) {
                const id = card.getAttribute('data-topic-id');
                console.log('🖱️ Knowledge Card Clicked:', id);
                knowledgeManager.openTopic(id);
            }
        });

        // Modal Bindings
        const modal = document.getElementById('knowledge-modal');
        const closeModal = () => {
            modal.classList.remove('visible');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };
        document.getElementById('knowledge-modal-close')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    },

    renderGrid: (container) => {
        container.innerHTML = KNOWLEDGE_DATA.map(topic => `
            <div class="knowledge-card" data-topic-id="${topic.id}">
                <span class="material-symbols-rounded k-icon">${topic.icon}</span>
                <div class="k-title">${topic.title}</div>
                <div class="k-desc">${topic.desc}</div>
            </div>
        `).join('');
        console.log('📚 Knowledge Grid Rendered with', KNOWLEDGE_DATA.length, 'topics.');
    },

    openTopic: (id) => {
        console.log('📖 Opening Topic:', id);
        const topic = KNOWLEDGE_DATA.find(t => t.id === id);
        if (!topic) { console.error('❌ Topic not found:', id); return; }

        document.getElementById('k-detail-title').textContent = topic.title;
        document.getElementById('k-detail-icon').textContent = topic.icon;
        document.getElementById('k-detail-body').innerHTML = topic.content;

        const modal = document.getElementById('knowledge-modal');
        modal.classList.remove('hidden');
        void modal.offsetWidth; // Trigger reflow
        modal.classList.add('visible');

        // Reset scroll position
        document.querySelector('.knowledge-detail-body').scrollTop = 0;
    }
};

// Global Exposure
window.knowledgeManager = knowledgeManager;

/* --- BREW MANAGER --- */
const brewManager = {
    brews: JSON.parse(localStorage.getItem('coffee_brews') || '[]'),
    editingId: null,

    init: () => {
        brewManager.renderList();

        const calcYield = () => {
            const dose = parseFloat(document.getElementById('doseIn').value) || 0;
            const ratio = parseFloat(document.getElementById('ratio').value) || 0;
            if (dose && ratio) {
                document.getElementById('target-yield').innerText = (dose * ratio).toFixed(1);
            }
        };
        document.getElementById('doseIn').addEventListener('input', calcYield);
        document.getElementById('ratio').addEventListener('input', calcYield);

        document.getElementById('brew-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const brew = Object.fromEntries(formData.entries());

            // Toggles
            brew.preinfusion = document.getElementById('preinfusion-check').checked;
            brew.tapering = document.getElementById('tapering-check').checked;

            if (brewManager.editingId) {
                // Update existing
                const index = brewManager.brews.findIndex(b => b.id === brewManager.editingId);
                if (index !== -1) {
                    brew.id = brewManager.editingId;
                    brew.dateAdded = brewManager.brews[index].dateAdded;
                    brewManager.brews[index] = brew;
                }
            } else {
                // Create new
                brew.id = utils.uuid();
                brew.dateAdded = new Date().toISOString();
                brewManager.brews.unshift(brew);
                if (window.authManager) window.authManager.grantPoints(5); // +5 Points for Brew
            }

            if (window.authManager && window.authManager.currentUser) {
                // Cloud Save
                window.authManager.saveBrews(brewManager.brews);
            } else {
                // Local Save
                localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
            }

            brewManager.renderList();
            brewManager.closeModal();
            utils.vibrate([50, 50, 50]);
        });
    },

    openAddModal: () => {
        brewManager.editingId = null;
        document.getElementById('brew-form').reset();
        document.querySelector('#brew-modal h2').innerText = 'New Espresso';
        document.getElementById('target-yield').innerText = '--';
        toggleSection('preinfusion-details', false);
        toggleSection('tapering-details', false);
        document.getElementById('preinfusion-check').checked = false;
        document.getElementById('tapering-check').checked = false;

        const m = document.getElementById('brew-modal');
        m.classList.remove('hidden');
        void m.offsetWidth;
        m.classList.add('visible');
    },

    edit: (id, e) => {
        e.stopPropagation();
        const brew = brewManager.brews.find(b => b.id === id);
        if (!brew) return;

        brewManager.editingId = id;
        document.querySelector('#brew-modal h2').innerText = 'Edit Espresso';

        const form = document.getElementById('brew-form');
        for (const [key, value] of Object.entries(brew)) {
            if (form.elements[key]) form.elements[key].value = value;
        }

        document.getElementById('preinfusion-check').checked = !!brew.preinfusion;
        toggleSection('preinfusion-details', !!brew.preinfusion);

        document.getElementById('tapering-check').checked = !!brew.tapering;
        toggleSection('tapering-details', !!brew.tapering);

        const dose = parseFloat(brew.doseIn) || 0;
        const ratio = parseFloat(brew.ratio) || 0;
        if (dose && ratio) document.getElementById('target-yield').innerText = (dose * ratio).toFixed(1);

        const m = document.getElementById('brew-modal');
        m.classList.remove('hidden');
        void m.offsetWidth;
        m.classList.add('visible');
    },

    delete: (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this brew?')) {
            brewManager.brews = brewManager.brews.filter(b => b.id !== id);

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveBrews(brewManager.brews);
            } else {
                localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
            }

            brewManager.renderList();
            utils.vibrate(50);
        }
    },

    closeModal: () => {
        const m = document.getElementById('brew-modal');
        m.classList.remove('visible');
        setTimeout(() => m.classList.add('hidden'), 300);
    },

    toggleFavorite: (id, e) => {
        e.stopPropagation();
        const brew = brewManager.brews.find(b => b.id === id);
        if (!brew) return;
        brew.favorite = !brew.favorite;

        // Direct DOM update — no re-render needed, CSS specificity proof
        const btn = e.currentTarget;
        const icon = btn.querySelector('.material-symbols-rounded');
        if (brew.favorite) {
            btn.classList.add('active');
            icon.textContent = 'favorite';
            icon.style.color = '#e74c3c';
            icon.style.filter = 'drop-shadow(0 0 7px rgba(231,76,60,0.8))';
        } else {
            btn.classList.remove('active');
            icon.textContent = 'favorite_border';
            icon.style.color = 'rgba(212,175,55,0.35)';
            icon.style.filter = '';
        }

        // Save in background
        if (window.authManager && window.authManager.currentUser) {
            window.authManager.saveBrews(brewManager.brews);
        } else {
            localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
        }
        utils.vibrate(15);
    },
    renderList: () => {
        const container = document.getElementById('brew-list');
        container.innerHTML = '';
        brewManager.brews.forEach(brew => {
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';

            let detailsHtml = `
                    <div class="actions-row">
                        <button class="action-btn edit" onclick="brewManager.edit('${brew.id}', event)"><span class="material-symbols-rounded">edit</span> Edit</button>
                        <button class="action-btn delete" onclick="brewManager.delete('${brew.id}', event)"><span class="material-symbols-rounded">delete</span> Delete</button>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item"><label>GRINDER</label><span>${brew.grinder || '-'}</span></div>
                        <div class="detail-item"><label>GRIND SIZE</label><span>${brew.grindSize || '-'}</span></div>
                        <div class="detail-item"><label>DOSE</label><span>${brew.doseIn}g</span></div>
                        <div class="detail-item"><label>YIELD</label><span>${(brew.doseIn * brew.ratio).toFixed(1)}g (1:${brew.ratio})</span></div>
                        <div class="detail-item"><label>TEMP</label><span>${brew.temp || '-'}°C</span></div>
                        <div class="detail-item"><label>RPM</label><span>${brew.rpm || '-'}</span></div>
                    </div>
            `;

            if (brew.preinfusion) {
                detailsHtml += `
                    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                        <label style="color:var(--md-sys-color-primary);">PREINFUSION</label>
                        <div class="detail-grid">
                            <div class="detail-item"><label>BAR</label><span>${brew.piBar || '-'}</span></div>
                            <div class="detail-item"><label>WEIGHT</label><span>${brew.piWeight || '-'}g</span></div>
                        </div>
                    </div>`;
            }

            detailsHtml += `
                    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                        <label style="color:var(--md-sys-color-primary);">EXTRACTION</label>
                        <div class="detail-grid">
                            <div class="detail-item"><label>PEAK BAR</label><span>${brew.peakBar || '-'}</span></div>
                            <div class="detail-item"><label>PEAK WEIGHT</label><span>${brew.peakWeight || '-'}g</span></div>
                        </div>
                    </div>`;

            if (brew.tapering) {
                detailsHtml += `
                    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                        <label style="color:var(--md-sys-color-primary);">TAPERING</label>
                        <div class="detail-grid">
                            <div class="detail-item"><label>END BAR</label><span>${brew.tapBar || '-'}</span></div>
                            <div class="detail-item"><label>END WEIGHT</label><span>${brew.tapWeight || '-'}g</span></div>
                        </div>
                    </div>`;
            }

            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${brew.id}')">
                    <div style="flex:1">
                        <h3>${brew.beanName}</h3>
                        <small style="opacity:0.7">${brew.roastDate || 'No Date'}</small>
                    </div>
                    <div class="brew-actions">
                        <span class="fav-icon-btn${brew.favorite ? ' active' : ''}" onclick="brewManager.toggleFavorite('${brew.id}', event)">
                            <span class="material-symbols-rounded">${brew.favorite ? 'favorite' : 'favorite_border'}</span>
                        </span>
                        <span class="material-symbols-rounded" id="icon-${brew.id}">expand_more</span>
                    </div>
                </div>
                <div class="brew-details" id="details-${brew.id}">
                    ${detailsHtml}
                </div>
            `;
            container.appendChild(el);
        });
    },

    toggle: (id) => {
        const details = document.getElementById(`details-${id}`);
        const parent = details.parentElement;
        const icon = document.getElementById(`icon-${id}`);

        if (parent.classList.contains('expanded')) {
            parent.classList.remove('expanded');
            icon.innerText = 'expand_more';
        } else {
            document.querySelectorAll('.brew-pill.expanded').forEach(p => {
                p.classList.remove('expanded');
                try { p.querySelector('.material-symbols-rounded').innerText = 'expand_more'; } catch (e) { }
            });
            parent.classList.add('expanded');
            icon.innerText = 'expand_less';
        }
        utils.vibrate(10);
    },

    renderFavorites: () => {
        const container = document.getElementById('favorites-brew-list');
        if (!container) return;
        container.innerHTML = '';
        const favs = brewManager.brews.filter(b => b.favorite);
        if (favs.length === 0) {
            container.innerHTML = `<p class="fav-empty">Noch keine Favoriten.<br>Tippe das ♥ bei einem Brew.</p>`;
            return;
        }
        favs.forEach(brew => {
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';
            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('fav-${brew.id}')">
                    <div style="flex:1">
                        <h3>${brew.beanName}</h3>
                        <small style="opacity:0.7">${brew.roastDate || 'No Date'}</small>
                    </div>
                    <span class="material-symbols-rounded fav-active-icon">favorite</span>
                    <span class="material-symbols-rounded" id="icon-fav-${brew.id}">expand_more</span>
                </div>
                <div class="brew-details" id="details-fav-${brew.id}">
                    <div class="detail-grid">
                        <div class="detail-item"><label>GRINDER</label><span>${brew.grinder || '-'}</span></div>
                        <div class="detail-item"><label>GRIND SIZE</label><span>${brew.grindSize || '-'}</span></div>
                        <div class="detail-item"><label>DOSE</label><span>${brew.doseIn}g</span></div>
                        <div class="detail-item"><label>YIELD</label><span>${(brew.doseIn * brew.ratio).toFixed(1)}g (1:${brew.ratio})</span></div>
                        <div class="detail-item"><label>TEMP</label><span>${brew.temp || '-'}°C</span></div>
                        <div class="detail-item"><label>RPM</label><span>${brew.rpm || '-'}</span></div>
                    </div>
                </div>
            `;
            container.appendChild(el);
        });
    }
};

/* --- DRINK MANAGER --- */
const drinkManager = {
    drinks: JSON.parse(localStorage.getItem('coffee_drinks') || '[]'),
    editingId: null,

    init: () => {
        drinkManager.renderList();
        document.getElementById('drink-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const drink = Object.fromEntries(formData.entries());

            if (drinkManager.editingId) {
                const index = drinkManager.drinks.findIndex(d => d.id === drinkManager.editingId);
                if (index !== -1) {
                    drink.id = drinkManager.editingId;
                    drinkManager.drinks[index] = drink;
                }
            } else {
                drink.id = utils.uuid();
                drinkManager.drinks.push(drink);
                if (window.authManager) window.authManager.grantPoints(10); // +10 Points for Recipe
            }

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveDrinks(drinkManager.drinks);
            } else {
                localStorage.setItem('coffee_drinks', JSON.stringify(drinkManager.drinks));
            }
            drinkManager.renderList();
            drinkManager.closeModal();
        });
    },
    openAddModal: () => {
        drinkManager.editingId = null;
        document.getElementById('drink-form').reset();
        document.querySelector('#drink-modal h2').innerText = 'New Recipe';
        const m = document.getElementById('drink-modal');
        m.classList.remove('hidden'); void m.offsetWidth; m.classList.add('visible');
    },
    edit: (id, e) => {
        e.stopPropagation();
        const drink = drinkManager.drinks.find(d => d.id === id);
        if (!drink) return;
        drinkManager.editingId = id;
        document.querySelector('#drink-modal h2').innerText = 'Edit Recipe';
        const form = document.getElementById('drink-form');
        form.elements['drinkName'].value = drink.drinkName;
        form.elements['recipe'].value = drink.recipe;

        const m = document.getElementById('drink-modal');
        m.classList.remove('hidden'); void m.offsetWidth; m.classList.add('visible');
    },
    delete: (id, e) => {
        e.stopPropagation();
        if (confirm('Delete recipe?')) {
            drinkManager.drinks = drinkManager.drinks.filter(d => d.id !== id);

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveDrinks(drinkManager.drinks);
            } else {
                localStorage.setItem('coffee_drinks', JSON.stringify(drinkManager.drinks));
            }

            drinkManager.renderList();
        }
    },
    closeModal: () => {
        const m = document.getElementById('drink-modal');
        m.classList.remove('visible');
        setTimeout(() => m.classList.add('hidden'), 300);
    },
    renderList: () => {
        const container = document.getElementById('drink-list');
        container.innerHTML = '';
        drinkManager.drinks.forEach(d => {
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';
            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${d.id}')">
                    <h3>${d.drinkName}</h3>
                    <span class="material-symbols-rounded" id="icon-${d.id}">expand_more</span>
                </div>
                <div class="brew-details" id="details-${d.id}">
                     <div class="actions-row">
                        <button class="action-btn edit" onclick="drinkManager.edit('${d.id}', event)"><span class="material-symbols-rounded">edit</span> Edit</button>
                        <button class="action-btn delete" onclick="drinkManager.delete('${d.id}', event)"><span class="material-symbols-rounded">delete</span> Delete</button>
                    </div>
                     <p style="white-space: pre-wrap; line-height: 1.6; margin-top:10px;">${d.recipe}</p>
                </div>
            `;
            container.appendChild(el);
        });
    }
};

/* --- DIAL IN --- */
const dialIn = {
    calculate: () => {
        const targetT = parseFloat(document.getElementById('target-time').value);
        const g1 = parseFloat(document.getElementById('g1').value);
        const t1 = parseFloat(document.getElementById('t1').value);
        const g2 = parseFloat(document.getElementById('g2').value);
        const t2 = parseFloat(document.getElementById('t2').value);

        if (!targetT || !g1 || !t1 || !g2 || !t2) {
            alert('Please fill all fields!');
            return;
        }

        const m = (t2 - t1) / (g2 - g1);
        const c = t1 - (m * g1);
        const targetGrind = (targetT - c) / m;

        document.getElementById('result-grind').innerText = targetGrind.toFixed(2);
        document.getElementById('dial-result').classList.remove('hidden');
        utils.vibrate([100, 50, 100]);
    },

    init: () => {
        // Randomly trigger the "Epic Feature" popup to hype the user
        // Chance is 30% on load, or guaranteed if it's the first time
        const hasSeen = sessionStorage.getItem('epic_promo_seen');
        if (!hasSeen || Math.random() > 0.7) {
            setTimeout(() => dialIn.triggerPromo(), 2000);
        }
    },

    triggerPromo: () => {
        // Don't show if already on Dial-In page
        if (document.getElementById('dialin').classList.contains('active')) return;

        const messages = [
            { title: "Dial-In Calculator", text: "Stop wasting beans. Calculate your optimal grind size now." },
            { title: "Perfect Extraction", text: "Use our linear interpolation tool to find the sweet spot." },
            { title: "Smart Adjustment", text: "Input two test shots and get your target setting instantly." }
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];

        const popup = document.createElement('div');
        popup.className = 'feature-popup glass-panel';
        popup.style.cursor = 'pointer'; // Make it obvious
        popup.onclick = () => {
            // Check if router exists, otherwise fallback to hash or manual
            if (typeof router !== 'undefined' && router.navigate) {
                router.navigate('dialin');
            } else {
                // Fallback for simple tab switching if router isn't global
                const dialInLink = document.querySelector('[data-page="dialin"]');
                if (dialInLink) dialInLink.click();
            }
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        };

        popup.innerHTML = `
            <div class="shine"></div>
            <span class="material-symbols-rounded" style="color:#FFD700; font-size:2rem; margin-bottom:4px;">calculate</span>
            <strong>${msg.title}</strong>
            <p>${msg.text}</p>
            <small style="color:var(--color-gold-dark); font-size:0.7rem; margin-top:4px;">Tap to open</small>
        `;
        document.body.appendChild(popup);

        // Animate In
        requestAnimationFrame(() => popup.classList.add('active'));

        // Remove
        setTimeout(() => {
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 600);
            sessionStorage.setItem('epic_promo_seen', 'true');
        }, 6000); // Increased duration slightly so they can read it
    }
};

/* --- SHOPS --- */
const shopManager = {
    shops: JSON.parse(localStorage.getItem('coffee_shops') || '[]'),
    map: null,
    markers: [],
    editingId: null,

    init: () => {
        shopManager.renderList();
        // Map is initialized lazily when switching to map view

        document.getElementById('shop-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('.save-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Searching...';
            submitBtn.disabled = true;

            const formData = new FormData(e.target);
            const shop = Object.fromEntries(formData.entries());
            const inputLoc = shop.location; // User input (Coordinate or Address)

            // Geocoding Logic
            // Check if input looks like "lat,lng" (basic validation)
            const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(inputLoc);

            if (!isCoords && inputLoc.trim() !== '') {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputLoc)}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        shop.location = `${data[0].lat},${data[0].lon}`;
                        shop.address = inputLoc; // Save original text
                    } else {
                        alert('Address not found. Saving without map pin.');
                        // Keep original text in location so it shows up at least
                        shop.address = inputLoc;
                        shop.location = '';
                    }
                } catch (err) {
                    console.error('Geocoding error:', err);
                    alert('Geocoding failed. Check internet.');
                    shop.address = inputLoc;
                }
            } else {
                shop.address = inputLoc; // Even if it is coords, save it as address for display
            }

            if (shopManager.editingId) {
                const index = shopManager.shops.findIndex(s => s.id === shopManager.editingId);
                if (index !== -1) {
                    shop.id = shopManager.editingId;
                    shopManager.shops[index] = shop;
                }
            } else {
                shop.id = utils.uuid();
                shopManager.shops.push(shop);
                if (window.authManager) window.authManager.grantPoints(20); // +20 Points for Shop
            }

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveShops(shopManager.shops);
            } else {
                localStorage.setItem('coffee_shops', JSON.stringify(shopManager.shops));
            }
            shopManager.renderList();
            shopManager.renderMarkers();
            shopManager.closeModal();

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
    },

    openAddModal: () => {
        shopManager.editingId = null;
        document.getElementById('shop-form').reset();
        document.querySelector('#shop-modal h2').innerText = 'New Spot';
        document.getElementById('rating-val').innerText = '5';
        const m = document.getElementById('shop-modal');
        m.classList.remove('hidden'); void m.offsetWidth; m.classList.add('visible');
    },

    edit: (id, e) => {
        e.stopPropagation();
        const shop = shopManager.shops.find(s => s.id === id);
        if (!shop) return;
        shopManager.editingId = id;
        document.querySelector('#shop-modal h2').innerText = 'Edit Spot';
        const form = document.getElementById('shop-form');
        form.elements['shopName'].value = shop.shopName;
        // Prefill with address string if available, else technical location
        form.elements['location'].value = shop.address || shop.location;
        form.elements['notes'].value = shop.notes;
        form.elements['rating'].value = shop.rating;
        document.getElementById('rating-val').innerText = shop.rating;
        const m = document.getElementById('shop-modal');
        m.classList.remove('hidden'); void m.offsetWidth; m.classList.add('visible');
    },

    delete: (id, e) => {
        e.stopPropagation();
        if (confirm('Delete spot?')) {
            shopManager.shops = shopManager.shops.filter(s => s.id !== id);

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveShops(shopManager.shops);
            } else {
                localStorage.setItem('coffee_shops', JSON.stringify(shopManager.shops));
            }
            shopManager.renderList();
            shopManager.renderMarkers();
        }
    },

    closeModal: () => {
        const m = document.getElementById('shop-modal');
        m.classList.remove('visible'); setTimeout(() => m.classList.add('hidden'), 300);
    },

    switchView: (view) => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.toggle-btn[onclick="shopManager.switchView('${view}')"]`).classList.add('active');

        if (view === 'map') {
            document.getElementById('shop-list').classList.add('hidden');
            document.getElementById('shop-map-container').classList.remove('hidden');

            // Lazy Init Map
            if (!shopManager.map) {
                shopManager.map = L.map('shop-map-container').setView([51.1657, 10.4515], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(shopManager.map);
                shopManager.renderMarkers();
            }

            setTimeout(() => shopManager.map.invalidateSize(), 100);
        } else {
            document.getElementById('shop-list').classList.remove('hidden');
            document.getElementById('shop-map-container').classList.add('hidden');
        }
    },

    getCurrentLocation: () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const loc = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                document.getElementById('shop-location').value = loc;
            });
        } else {
            alert('Geolocation not supported');
        }
    },

    renderList: () => {
        const container = document.getElementById('shop-list');
        container.innerHTML = '';
        shopManager.shops.forEach(s => {
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';
            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${s.id}')">
                   <h3>${s.shopName}</h3>
                   <span>${'★'.repeat(s.rating)}</span>
                </div>
                <div class="brew-details" id="details-${s.id}">
                     <div class="actions-row">
                        <button class="action-btn edit" onclick="shopManager.edit('${s.id}', event)"><span class="material-symbols-rounded">edit</span> Edit</button>
                        <button class="action-btn delete" onclick="shopManager.delete('${s.id}', event)"><span class="material-symbols-rounded">delete</span> Delete</button>
                    </div>
                    <p style="opacity: 0.8; margin-top:10px;"><strong>Loc:</strong> ${s.address || s.location}</p>
                    <p style="opacity: 0.8"><strong>Notes:</strong> ${s.notes || ''}</p>
                </div>
            `;
            container.appendChild(el);
        });
    },

    renderMarkers: () => {
        shopManager.markers.forEach(m => shopManager.map.removeLayer(m));
        shopManager.markers = [];
        shopManager.shops.forEach(s => {
            if (s.location && s.location.includes(',')) {
                const [lat, lng] = s.location.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                    if (shopManager.map) {
                        const m = L.marker([lat, lng]).addTo(shopManager.map)
                            .bindPopup(s.shopName);
                        shopManager.markers.push(m);
                    }
                }
            }
        });
    }
};

/* === ENHANCED MAGNETIC CURSOR === */
const cursorFollower = {
    el: document.getElementById('cursor-follower'),
    init: () => {
        if (matchMedia('(hover: hover)').matches) {
            cursorFollower.el.style.display = 'block';

            // Smooth cursor movement
            document.addEventListener('mousemove', (e) => {
                gsap.to(cursorFollower.el, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.2,
                    ease: "power2.out"
                });
            });

            // Click ripple effect
            document.addEventListener('mousedown', () => {
                cursorFollower.el.classList.add('clicking');
                setTimeout(() => cursorFollower.el.classList.remove('clicking'), 600);
            });

            // Interactive elements: grow cursor
            document.querySelectorAll('a, button, .tile, .knowledge-card, .brew-header, input, .nav-btn, .action-btn, .toggle-btn').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorFollower.el.classList.add('active');
                });
                el.addEventListener('mouseleave', () => {
                    cursorFollower.el.classList.remove('active');
                });

                // Add ripple on click
                el.addEventListener('click', (e) => {
                    if (el.classList.contains('tile') || el.classList.contains('knowledge-card') || el.classList.contains('nav-btn') || el.classList.contains('action-btn')) {
                        animationEngine.createRipple(el, e);
                    }
                });
            });
        }
    }
};

/* --- INIT --- */
function toggleSection(id, show) {
    const el = document.getElementById(id);
    if (show === undefined) {
        if (el.classList.contains('hidden')) el.classList.remove('hidden');
        else el.classList.add('hidden');
    } else {
        if (show) el.classList.remove('hidden');
        else el.classList.add('hidden');
    }
}

// Auth Data Sync Listeners
window.addEventListener('auth-data-loaded', (e) => {
    console.log('🔄 Syncing data from cloud...', e.detail);
    const { brews, drinks, shops } = e.detail;

    // Update Local State but DO NOT overwrite LocalStorage (keep it for guest fallback)
    if (brews) brewManager.brews = brews;
    if (drinks) drinkManager.drinks = drinks;
    if (shops) shopManager.shops = shops;

    // Re-render UI
    brewManager.renderList();
    drinkManager.renderList();
    shopManager.renderList();
    shopManager.renderMarkers();
});

window.addEventListener('auth-logout', () => {
    console.log('🔄 Clearing user data, reverting to guest mode.');

    // Revert to LocalStorage data
    brewManager.brews = JSON.parse(localStorage.getItem('coffee_brews') || '[]');
    drinkManager.drinks = JSON.parse(localStorage.getItem('coffee_drinks') || '[]');
    shopManager.shops = JSON.parse(localStorage.getItem('coffee_shops') || '[]');

    brewManager.renderList();
    drinkManager.renderList();
    shopManager.renderList();
    shopManager.renderMarkers();
});

window.addEventListener('load', () => {
    // Feature Inits
    if (document.getElementById('brew-list')) brewManager.init();
    if (document.getElementById('drink-list')) drinkManager.init();
    if (document.getElementById('shop-list')) shopManager.init();
    if (document.getElementById('knowledge-grid')) knowledgeManager.init();
    if (document.getElementById('dialin')) dialIn.init();
    cursorFollower.init();

    // Trigger page transition
    animationEngine.transitionPage();

    // Enable magnetic effects on tiles and navigation
    setTimeout(() => {
        animationEngine.enableMagnetic('.tile', 0.3);
        animationEngine.enableMagnetic('.knowledge-card', 0.3); // Added Knowledge Base Cards
        animationEngine.enableMagnetic('.nav-btn', 0.25);
        // Removed glass-nav magnetic effect to prevent shifting
        animationEngine.enableMagnetic('.toggle-btn', 0.2);
        animationEngine.revealElements('.tile', 0.1);
    }, 100);

    // Interactive Brand Logo
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        // Split text into individual letters for magnetic effect
        const text = brandLogo.textContent;
        brandLogo.innerHTML = text.split('').map(char =>
            `<span style="display:inline-block; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">${char}</span>`
        ).join('');

        const letters = brandLogo.querySelectorAll('span');

        // Magnetic effect on each letter
        brandLogo.addEventListener('mousemove', (e) => {
            const rect = brandLogo.getBoundingClientRect();
            const x = e.clientX - rect.left;

            letters.forEach((letter, index) => {
                const letterRect = letter.getBoundingClientRect();
                const letterX = letterRect.left - rect.left + letterRect.width / 2;
                const distance = Math.abs(x - letterX);
                const maxDistance = 100;

                if (distance < maxDistance) {
                    const force = 1 - (distance / maxDistance);
                    const moveY = -force * 15;
                    const scale = 1 + force * 0.3;
                    letter.style.transform = `translateY(${moveY}px) scale(${scale})`;
                    letter.style.color = `rgba(244, 196, 48, ${0.8 + force * 0.2})`;
                } else {
                    letter.style.transform = 'translateY(0) scale(1)';
                    letter.style.color = '';
                }
            });
        });

        brandLogo.addEventListener('mouseleave', () => {
            letters.forEach(letter => {
                letter.style.transform = 'translateY(0) scale(1)';
                letter.style.color = '';
            });
        });

        // Click explosion effect
        brandLogo.addEventListener('click', () => {
            letters.forEach((letter, index) => {
                const angle = (index / letters.length) * Math.PI * 2;
                const distance = 80;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;

                gsap.to(letter, {
                    x: x,
                    y: y,
                    rotation: Math.random() * 360,
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(letter, {
                            x: 0,
                            y: 0,
                            rotation: 0,
                            opacity: 1,
                            duration: 0.5,
                            ease: "elastic.out(1, 0.5)"
                        });
                    }
                });
            });
            utils.vibrate([50, 30, 50]);
        });
    }
});
// Responsive Login Button
function updateLoginBtnState() {
    const loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;

    const isHome = location.pathname === '/' || location.pathname.endsWith('index.html');
    const isAtTop = window.scrollY < 50;

    if (isHome && isAtTop) {
        loginBtn.classList.remove('minimized');
    } else {
        loginBtn.classList.add('minimized');
    }
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(updateLoginBtnState);
});

// Initial check
document.addEventListener('DOMContentLoaded', updateLoginBtnState);
