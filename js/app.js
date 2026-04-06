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
    enableMagnetic: (selector, strength = 0.25, lockYOnly = false) => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset.magneticInit) return;
            el.dataset.magneticInit = 'true';

            el.addEventListener('mousemove', (e) => {
                // Ignore interactions if the intro animation is still running 
                // (prevents GSAP transform conflicts locking the scale at 0.9)
                if (gsap.getProperty(el, "opacity") < 1) return;

                // Disable drag on mobile devices or when the element is expanded
                if (window.innerWidth <= 768 || el.classList.contains('expanded')) {
                    gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
                    return;
                }

                const rect = el.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = lockYOnly ? 0 : (e.clientX - centerX) * strength;
                const deltaY = (e.clientY - centerY) * strength;

                gsap.to(el, {
                    x: deltaX,
                    y: deltaY,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            el.addEventListener('mouseleave', () => {
                // If it's still animating the intro, do nothing.
                if (gsap.getProperty(el, "opacity") < 1) return;

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
        gsap.from(elements, {
            opacity: 0,
            y: 50,
            scale: 0.9,
            stagger: delay,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "all"
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

    // Enhanced page transition
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

/* --- PAGE TITLE MAPPING --- */
const PAGE_TITLES = {
    home: 'home',
    brew: 'beans',
    drinks: 'drink recipes',
    dialin: 'dial-in',
    shops: 'coffee shop',
    knowledge: 'knowledge'
};

/* --- ROUTER --- */
const router = {
    navigate: (pageId) => {
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

        // Update brand logo with page title
        const brandLogo = document.querySelector('.brand-logo');
        if (brandLogo) brandLogo.textContent = PAGE_TITLES[pageId] || pageId;

        // Trigger page transition animation
        animationEngine.transitionPage();

        // Handle Nav Visibility
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-nav'));
        const navBtn = document.querySelector(`.nav-btn[onclick="router.navigate('${pageId}')"]`);
        if (navBtn) navBtn.classList.add('active-nav');

        document.getElementById('main-nav').classList.remove('hidden');

        // Trigger map resize if shops
        if (pageId === 'shops' && shopManager.map) {
            setTimeout(() => shopManager.map.invalidateSize(), 100);
        }

        // Handle Home Scroll Fix
        if (pageId === 'home') {
            // Force scroll top immediately
            window.scrollTo(0, 0);
            // Refresh GSAP after a slight delay to ensure layout is ready
            setTimeout(() => {
                window.scrollTo(0, 0);
                ScrollTrigger.refresh();
            }, 50);
        } else {
            window.scrollTo(0, 0);
        }

        updateLoginBtnState();
        utils.vibrate(20);
    }
};

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
            <div class="trouble-desktop-table">
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
            </div>

            <div class="trouble-mobile-pills">
                <div class="trouble-pill" onclick="knowledgeManager.openTroubleDetail('Sauer / Stechend', 'Unterextraktion', 'Feiner mahlen / Wärmer / Mehr Yield')">
                    <span>Sauer / Stechend</span>
                    <span class="material-symbols-rounded">chevron_right</span>
                </div>
                <div class="trouble-pill" onclick="knowledgeManager.openTroubleDetail('Bitter / Trocken', 'Überextraktion', 'Gröber mahlen / Kälter / Weniger Yield')">
                    <span>Bitter / Trocken</span>
                    <span class="material-symbols-rounded">chevron_right</span>
                </div>
                <div class="trouble-pill" onclick="knowledgeManager.openTroubleDetail('Salzig / Wässrig', 'Massive Unterextraktion', 'Viel feiner mahlen / Dosis erhöhen')">
                    <span>Salzig / Wässrig</span>
                    <span class="material-symbols-rounded">chevron_right</span>
                </div>
                <div class="trouble-pill" onclick="knowledgeManager.openTroubleDetail('Flach / Langweilig', 'Wasser zu hart (KH)', 'Wasser filtern / Weicheres Wasser')">
                    <span>Flach / Langweilig</span>
                    <span class="material-symbols-rounded">chevron_right</span>
                </div>
                <div class="trouble-pill" onclick="knowledgeManager.openTroubleDetail('Sauer & Bitter', 'Channeling', 'Bessere Puck-Prep (WDT)')">
                    <span>Sauer & Bitter</span>
                    <span class="material-symbols-rounded">chevron_right</span>
                </div>
            </div>
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
    },

    openTroubleDetail: (title, cause, solution) => {
        document.getElementById('td-title').textContent = title;
        document.getElementById('td-cause').textContent = cause;
        document.getElementById('td-solution').textContent = solution;

        const modal = document.getElementById('trouble-detail-modal');
        modal.classList.remove('hidden');
        void modal.offsetWidth; // Trigger reflow
        modal.classList.add('visible');
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

        const calcRatio = () => {
            const doseIn = parseFloat(document.getElementById('doseIn').value) || 0;
            const doseOut = parseFloat(document.getElementById('doseOut').value) || 0;
            if (doseIn && doseOut && doseIn > 0) {
                const ratioVal = (doseOut / doseIn).toFixed(1);
                document.getElementById('target-ratio').innerText = `1:${ratioVal}`;
            } else {
                document.getElementById('target-ratio').innerText = `1:--`;
            }
        };
        document.getElementById('doseIn').addEventListener('input', calcRatio);
        document.getElementById('doseOut').addEventListener('input', calcRatio);

        document.getElementById('brew-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const brew = Object.fromEntries(formData.entries());

            // The preinfusion and tapering toggles have been removed. 
            // The data is now fully driven by the populated profile inputs.
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

    openSkillModal: () => {
        const m = document.getElementById('brew-skill-modal');
        m.classList.remove('hidden');
        void m.offsetWidth;
        m.classList.add('visible');
    },

    selectSkillLevel: (level) => {
        const sm = document.getElementById('brew-skill-modal');
        sm.classList.remove('visible');
        setTimeout(() => sm.classList.add('hidden'), 300);

        document.getElementById('skillLevel').value = level;
        const form = document.getElementById('brew-form');
        form.classList.remove('form-easy', 'form-medium', 'form-expert');
        form.classList.add(`form-${level}`);

        brewManager.openAddModal();
    },

    openAddModal: () => {
        brewManager.editingId = null;
        document.getElementById('brew-form').reset();

        // Ensure skillLevel stays what we just set
        const currentLevel = document.getElementById('brew-form').classList.contains('form-expert') ? 'expert' :
            document.getElementById('brew-form').classList.contains('form-medium') ? 'medium' : 'easy';
        document.getElementById('skillLevel').value = currentLevel;

        document.querySelector('#brew-modal h2').innerText = 'New Espresso';
        document.getElementById('target-ratio').innerText = '1:--';

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

        const level = brew.skillLevel || 'expert'; // Default to expert for old brews
        form.classList.remove('form-easy', 'form-medium', 'form-expert');
        form.classList.add(`form-${level}`);
        document.getElementById('skillLevel').value = level;

        for (const [key, value] of Object.entries(brew)) {
            if (form.elements[key]) form.elements[key].value = value;
        }

        const doseIn = parseFloat(brew.doseIn) || 0;
        const doseOut = parseFloat(brew.doseOut) || 0;
        if (doseIn && doseOut && doseIn > 0) {
            document.getElementById('target-ratio').innerText = `1:${(doseOut / doseIn).toFixed(1)}`;
        } else {
            document.getElementById('target-ratio').innerText = '1:--';
        }

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

    jumpToLinkedInfo: (infoId, e) => {
        e.stopPropagation();
        if(window.beanManager) {
            if(window.beanManager.currentView !== 'infos') {
                window.beanManager.switchView('infos');
            }
            setTimeout(() => {
                const icon = document.getElementById(`info-icon-${infoId}`);
                if(icon) {
                    const parent = icon.closest('.brew-pill');
                    if(parent && !parent.classList.contains('expanded')) {
                        window.beanManager.toggleInfo(infoId);
                    }
                    if(parent) {
                        parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const originalBg = parent.style.boxShadow;
                        parent.style.boxShadow = '0 0 15px var(--md-sys-color-primary)';
                        setTimeout(() => parent.style.boxShadow = originalBg, 1500);
                    }
                }
            }, 100);
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

            const doseIn = parseFloat(brew.doseIn) || 0;
            const doseOut = brew.doseOut ? parseFloat(brew.doseOut) : doseIn * parseFloat(brew.ratio || 0);
            const ratio = doseIn && doseOut ? (doseOut / doseIn).toFixed(1) : brew.ratio || '--';

            let detailsHtml = `
                    <div class="actions-row">
                        <button class="action-btn edit" onclick="brewManager.edit('${brew.id}', event)"><span class="material-symbols-rounded">edit</span></button>
                        <button class="action-btn delete" onclick="brewManager.delete('${brew.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item" style="grid-column: 1 / -1;"><label>SKILL LEVEL</label><span style="text-transform: capitalize; color: var(--color-gold-bright); font-weight: bold;">${brew.skillLevel || 'expert'}</span></div>
                        <div class="detail-item"><label>GRINDER</label><span>${brew.grinder || '-'}</span></div>
                        <div class="detail-item"><label>GRIND SIZE</label><span>${brew.grindSize || '-'}</span></div>
                        <div class="detail-item"><label>DOSE</label><span>${doseIn}g</span></div>
                        <div class="detail-item"><label>YIELD</label><span>${doseOut.toFixed(1)}g (1:${ratio})</span></div>
                        <div class="detail-item"><label>TIME</label><span>${brew.targetTime || '-'}s</span></div>
                        <div class="detail-item"><label>TEMP</label><span>${brew.temp || '-'}°C</span></div>
                        <div class="detail-item"><label>RPM</label><span>${brew.rpm || '-'}</span></div>
                    </div>
            `;

            if (brew.skillLevel === 'expert' && (brew.piTime || brew.peakTime || brew.tapTime)) {
                detailsHtml += `
                    <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                        <label style="color:var(--md-sys-color-primary); display:block; margin-bottom: 8px;">EXTRACTION PROFILE</label>
                        <div class="detail-grid" style="margin-bottom: 12px; font-size: 0.9em; opacity: 0.8;">
                            ${brew.piTime ? `<div class="detail-item"><label>PREINFUSION</label><span>${brew.piBar || '0'} bar @ ${brew.piTime} s</span></div>` : ''}
                            ${brew.peakTime ? `<div class="detail-item"><label>PEAK</label><span>${brew.peakBar || '0'} bar @ ${brew.peakTime} s</span></div>` : ''}
                            ${brew.tapTime ? `<div class="detail-item"><label>TAPERING</label><span>${brew.tapBar || '0'} bar @ ${brew.tapTime} s</span></div>` : ''}
                        </div>
                        <div class="chart-container" style="position: relative; height:200px; width:100%">
                            <canvas id="chart-${brew.id}"></canvas>
                        </div>
                    </div>`;
            }

            const isLinked = !!brew.linkedBeanId;
            let iconHtml = isLinked ? `<span class="material-symbols-rounded" style="color:var(--color-gold-bright); font-size: 1.1rem; margin-right: 8px; cursor:pointer;" onclick="brewManager.jumpToLinkedInfo('${brew.linkedBeanId}', event)">link</span>` : '';

            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${brew.id}')">
                    <div style="flex:1">
                        <h3>${brew.beanName}</h3>
                        <small style="opacity:0.7">${brew.roastDate || 'No Date'}</small>
                    </div>
                    <div class="brew-actions">
                        ${iconHtml}
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

        // Enable sticky logic for the new brew pills
        // Magnetic animation removed
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

            // Ensure we are viewing 'recipes' 
            if(window.beanManager && beanManager.currentView !== 'recipes') {
                beanManager.switchView('recipes');
            }

            // Scroll the expanded pill into view so it's not half hidden
            setTimeout(() => {
                parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 50);

            // Render chart if it's an expert brew and has a canvas
            const canvas = document.getElementById(`chart-${id.replace('fav-', '')}`); // handle both normal and fav lists
            if (canvas) {
                // Ensure the container is visible before calculating dimensions
                setTimeout(() => {
                    const brewId = id.replace('fav-', '');
                    const brew = brewManager.brews.find(b => b.id === brewId);
                    if (brew) brewManager.renderChart(canvas, brew);
                }, 50);
            }
        }
        utils.vibrate(10);
    },

    activeCharts: {}, // Store chart instances to destroy them before re-rendering

    renderChart: (canvas, brew) => {
        if (!window.Chart) return;

        // Destroy existing chart on this canvas if any
        if (brewManager.activeCharts[canvas.id]) {
            brewManager.activeCharts[canvas.id].destroy();
        }

        const dataPoints = [{ x: 0, y: 0 }]; // Always start at 0,0

        // Parse inputs to build instant ramps and sustained pressure blocks
        let currentTime = 0;
        const addPhase = (bar, time) => {
            time = parseFloat(time);
            bar = parseFloat(bar) || 0;
            if (!isNaN(time) && time > currentTime) {
                // Ramp up in 0.5s (or less if phase is shorter) for almost instant build-up
                const rampTime = Math.min(currentTime + 0.5, time);
                dataPoints.push({ x: rampTime, y: bar });

                // Maintain pressure until the end of the phase
                if (time > rampTime) {
                    dataPoints.push({ x: time, y: bar });
                }
                currentTime = time;
            }
        };

        addPhase(brew.piBar, brew.piTime);
        addPhase(brew.peakBar, brew.peakTime);
        addPhase(brew.tapBar, brew.tapTime);

        brewManager.activeCharts[canvas.id] = new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Pressure (Bar)',
                    data: dataPoints,
                    borderColor: '#D4AF37', // Gold Bright
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#121212',
                    pointBorderColor: '#D4AF37',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4, // Smooth curves...
                    cubicInterpolationMode: 'monotone' // ...but prevent overshooting the sharp ramps

                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(18, 18, 18, 0.9)',
                        titleColor: '#D4AF37',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return context.parsed.y + ' Bar';
                            },
                            title: function (context) {
                                return context[0].parsed.x + 's';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Time (s)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: "'Datatype', sans-serif", size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: "'Datatype', sans-serif", size: 10 }
                        },
                        // Ensure x-axis always starts at 0
                        min: 0
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Pressure (Bar)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: "'Datatype', sans-serif", size: 10 }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: "'Datatype', sans-serif", size: 10 },
                            stepSize: 3
                        },
                        // Cap Y nicely 
                        min: 0,
                        suggestedMax: 12
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
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
            // Click to navigate to brew list and expand the specific brew
            el.innerHTML = `
                <div class="brew-header" onclick="router.navigate('brew'); setTimeout(() => brewManager.toggle('${brew.id}'), 350); if (window.authManager) window.authManager.closeFavoritesModal();">
                    <div style="flex:1">
                        <h3>${brew.beanName}</h3>
                        <small style="opacity:0.7">${brew.roastDate || 'No Date'}</small>
                    </div>
                    <span class="material-symbols-rounded fav-active-icon" style="color: #e74c3c; -webkit-text-fill-color: #e74c3c; filter: drop-shadow(0 0 7px rgba(231,76,60,0.8));">favorite</span>
                </div>
            `;
            container.appendChild(el);
        });

        // Magnetic animation removed
    }
};

/* --- DRINK MANAGER --- */
const drinkManager = {
    drinks: JSON.parse(localStorage.getItem('coffee_drinks') || '[]'),
    editingId: null,

    init: () => {
        drinkManager.renderList();

        // Setup Mentions
        const mentionDropdown = document.getElementById('mention-dropdown');
        const recipeTextarea = document.getElementById('recipe-textarea');
        if (recipeTextarea && mentionDropdown) {
            recipeTextarea.addEventListener('input', (e) => {
                const val = recipeTextarea.value;
                const cursorPos = recipeTextarea.selectionStart;
                const textBeforeCursor = val.slice(0, cursorPos);

                const match = textBeforeCursor.match(/@([a-zA-Z0-9\s]*)$/);
                if (match) {
                    const query = match[1].toLowerCase();
                    const brews = brewManager.brews.filter(b => (b.beanName || '').toLowerCase().includes(query));

                    if (brews.length > 0) {
                        mentionDropdown.innerHTML = '';
                        brews.forEach(brew => {
                            const item = document.createElement('div');
                            item.className = 'mention-item';
                            item.innerText = brew.beanName || 'Unknown Brew';
                            item.onmousedown = (ev) => {
                                // Prevent blur from firing before click is registered
                                ev.preventDefault();
                            };
                            item.onclick = () => {
                                const before = textBeforeCursor.slice(0, -match[0].length);
                                const after = val.slice(cursorPos);
                                // Insert just the plain text for the user
                                const mentionString = `@${brew.beanName} `;
                                recipeTextarea.value = before + mentionString + after;
                                mentionDropdown.classList.add('hidden');
                                recipeTextarea.focus();
                            };
                            mentionDropdown.appendChild(item);
                        });
                        mentionDropdown.classList.remove('hidden');
                    } else {
                        mentionDropdown.classList.add('hidden');
                    }
                } else {
                    mentionDropdown.classList.add('hidden');
                }
            });

            recipeTextarea.addEventListener('blur', () => {
                mentionDropdown.classList.add('hidden');
            });
        }

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

            // Format recipe text: Replace < > to prevent HTML injection, then parse plain @mentions
            let formattedRecipe = (d.recipe || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");

            // Sort brews by name length (descending) to match longer names first
            const sortedBrews = [...brewManager.brews].sort((a, b) => (b.beanName || '').length - (a.beanName || '').length);
            sortedBrews.forEach(brew => {
                if (!brew.beanName) return;
                const escapedName = brew.beanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`@${escapedName}`, 'gi');
                formattedRecipe = formattedRecipe.replace(regex,
                    `<span class="brew-link" onclick="router.navigate('brew'); setTimeout(() => brewManager.toggle('${brew.id}'), 350); event.stopPropagation();"><span class="material-symbols-rounded" style="font-size:14px; vertical-align:middle; margin-right:4px;">coffee</span>${brew.beanName}</span>`
                );
            });

            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${d.id}')">
                    <h3>${d.drinkName}</h3>
                    <span class="material-symbols-rounded" id="icon-${d.id}">expand_more</span>
                </div>
                <div class="brew-details" id="details-${d.id}">
                     <div class="actions-row">
                        <button class="action-btn edit" onclick="drinkManager.edit('${d.id}', event)"><span class="material-symbols-rounded">edit</span></button>
                        <button class="action-btn delete" onclick="drinkManager.delete('${d.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                    </div>
                     <p style="white-space: pre-wrap; line-height: 1.6; margin-top:10px;">${formattedRecipe}</p>
                </div>
            `;
            container.appendChild(el);
        });

        // Magnetic animation removed
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
    }
};

/* --- SHOPS --- */
const shopManager = {
    shops: JSON.parse(localStorage.getItem('coffee_shops') || '[]'),
    map: null,
    markers: [],
    editingId: null,

    setRating: (val) => {
        const stars = document.querySelectorAll('#shop-star-rating span');
        const hiddenInput = document.getElementById('shop-rating-value');
        if (hiddenInput) hiddenInput.value = val;
        
        stars.forEach((s, idx) => {
            if (idx < val) {
                s.innerText = 'star';
                s.classList.add('filled');
            } else {
                s.innerText = 'star_outline';
                s.classList.remove('filled');
            }
        });
    },

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
        shopManager.setRating(0);
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
        shopManager.setRating(shop.rating || 5);
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
                shopManager.map = L.map('shop-map-container', {
                    zoomControl: false,
                    scrollWheelZoom: true
                }).setView([51.1657, 10.4515], 6);

                // Add Premium Dark Matter Tiles
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(shopManager.map);

                // Add zoom control at bottom right
                L.control.zoom({ position: 'bottomright' }).addTo(shopManager.map);

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

            // Google Maps Link Logic
            let mapsUrl = '#';
            if (s.location && s.location.includes(',')) {
                mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.location}`;
            } else if (s.address) {
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`;
            } else {
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.shopName)}`;
            }

            el.innerHTML = `
                <div class="brew-header" onclick="brewManager.toggle('${s.id}')">
                   <h3>${s.shopName}</h3>
                   <span>${'★'.repeat(s.rating)}</span>
                </div>
                <div class="brew-details" id="details-${s.id}">
                     <div class="actions-row">
                        <a href="${mapsUrl}" target="_blank" class="action-btn route" style="text-decoration: none; color: inherit; display: inline-flex; align-items: center;">
                            <span class="material-symbols-rounded">near_me</span>
                        </a>
                        <button class="action-btn edit" onclick="shopManager.edit('${s.id}', event)"><span class="material-symbols-rounded">edit</span></button>
                        <button class="action-btn delete" onclick="shopManager.delete('${s.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                    </div>
                    <p style="opacity: 0.8; margin-top:10px;"><strong>Loc:</strong> ${s.address || s.location}</p>
                    <p style="opacity: 0.8"><strong>Notes:</strong> ${s.notes || ''}</p>
                </div>
            `;
            container.appendChild(el);
        });

        // Magnetic animation removed
    },

    renderMarkers: () => {
        shopManager.markers.forEach(m => shopManager.map.removeLayer(m));
        shopManager.markers = [];
        
        // Define Custom Marker Icon
        const coffeeIcon = L.divIcon({
            className: 'custom-map-marker',
            html: '<div class="marker-dot"></div><div class="marker-pulse"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        shopManager.shops.forEach(s => {
            if (s.location && s.location.includes(',')) {
                const parts = s.location.split(',').map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    const lat = parts[0];
                    const lng = parts[1];
                    if (shopManager.map) {
                        const m = L.marker([lat, lng], { icon: coffeeIcon }).addTo(shopManager.map)
                            .bindPopup(`
                                <div class="map-popup">
                                    <strong>${s.shopName}</strong><br>
                                    <span style="font-size:0.8rem; opacity:0.7;">${s.address || 'Keine Adresse'}</span>
                                </div>
                            `);
                        shopManager.markers.push(m);
                    }
                }
            }
        });
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
    const { brews, drinks, shops, beans } = e.detail;

    // Update Local State but DO NOT overwrite LocalStorage (keep it for guest fallback)
    if (brews) brewManager.brews = brews;
    if (drinks) drinkManager.drinks = drinks;
    if (shops) shopManager.shops = shops;
    if (beans && window.beanManager) beanManager.beans = beans;

    // Re-render UI
    brewManager.renderList();
    drinkManager.renderList();
    shopManager.renderList();
    shopManager.renderMarkers();
    if (window.beanManager) beanManager.renderInfos();
});

window.addEventListener('auth-logout', () => {
    console.log('🔄 Clearing user data, reverting to guest mode.');

    // Revert to LocalStorage data
    brewManager.brews = JSON.parse(localStorage.getItem('coffee_brews') || '[]');
    drinkManager.drinks = JSON.parse(localStorage.getItem('coffee_drinks') || '[]');
    shopManager.shops = JSON.parse(localStorage.getItem('coffee_shops') || '[]');
    if (window.beanManager) beanManager.beans = JSON.parse(localStorage.getItem('coffee_bean_infos') || '[]');

    brewManager.renderList();
    drinkManager.renderList();
    shopManager.renderList();
    shopManager.renderMarkers();
    if (window.beanManager) beanManager.renderInfos();
});

window.addEventListener('load', () => {
    // Feature Inits
    brewManager.init();
    drinkManager.init();
    shopManager.init();
    knowledgeManager.init();

    // Enable magnetic effects on tiles and navigation
    setTimeout(() => {
        animationEngine.enableMagnetic('.tile', 0.05);
        animationEngine.enableMagnetic('.knowledge-card', 0.05); // Added Knowledge Base Cards
        // Removed nav-btn magnetic effect to just rely on CSS highlighing
        animationEngine.enableMagnetic('.toggle-btn', 0.05);
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

    const activePage = document.querySelector('.page.active');
    const isHome = activePage && activePage.id === 'home';
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

/* === DIAL-IN WIZARD === */
const dialInWizard = {
    currentStep: 1,
    totalSteps: 7,
    data: {},

    init: () => {
        dialInWizard.reset();
    },

    next: () => {
        if (!dialInWizard.validateStep(dialInWizard.currentStep)) return;
        dialInWizard.saveStepData(dialInWizard.currentStep);
        
        if (dialInWizard.currentStep === 3) dialInWizard.calculateHypothesis();
        if (dialInWizard.currentStep === 5) dialInWizard.calculateFinal();
        if (dialInWizard.currentStep === 6) dialInWizard.buildSummary();
        
        if (dialInWizard.currentStep < dialInWizard.totalSteps) {
            dialInWizard.goToStep(dialInWizard.currentStep + 1);
        }
    },

    prev: () => {
        if (dialInWizard.currentStep > 1) {
            dialInWizard.goToStep(dialInWizard.currentStep - 1);
        }
    },

    goToStep: (step) => {
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
            setTimeout(() => { if(!el.classList.contains('active')) el.style.display = 'none'; }, 600);
        });
        
        const nextEl = document.getElementById(`dialin-step-${step}`);
        nextEl.style.display = 'block';
        setTimeout(() => {
            nextEl.classList.remove('hidden');
            nextEl.classList.add('active');
        }, 50);

        dialInWizard.currentStep = step;
        
        // Update Progress
        document.getElementById('dialin-progress').style.width = `${(step / dialInWizard.totalSteps) * 100}%`;

        // Update Nav visibility
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        
        prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
        
        if (step === dialInWizard.totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            nextBtn.innerText = (step === 3 || step === 5) ? 'BERECHNEN' : 'Weiter';
        }
        
        utils.vibrate(15);
    },

    validateStep: (step) => {
        let valid = true;
        const check = (id) => {
            const el = document.getElementById(id);
            if (!el || !el.value) {
                if (el) { el.style.border = '1px solid #e74c3c'; setTimeout(()=> el.style.border='', 2000); }
                valid = false;
            }
        };

        if (step === 1) { check('di-min-grind'); check('di-max-grind'); }
        if (step === 2) { check('di-target-time'); }
        if (step === 3) { check('di-s1-grind'); check('di-s1-time'); }
        if (step === 5) { check('di-s2-grind'); check('di-s2-time'); }
        
        if (!valid) utils.vibrate([100, 50, 100]);
        return valid;
    },

    saveStepData: (step) => {
        const val = (id) => parseFloat(document.getElementById(id).value) || 0;
        if (step === 1) {
            dialInWizard.data.minGrind = val('di-min-grind');
            dialInWizard.data.maxGrind = val('di-max-grind');
        }
        if (step === 2) {
            dialInWizard.data.targetTime = val('di-target-time');
        }
        if (step === 3) {
            dialInWizard.data.s1 = { grind: val('di-s1-grind'), time: val('di-s1-time'), in: val('di-s1-in'), out: val('di-s1-out'), rpm: val('di-s1-rpm') };
        }
        if (step === 5) {
            dialInWizard.data.s2 = { grind: val('di-s2-grind'), time: val('di-s2-time'), in: val('di-s2-in'), out: val('di-s2-out'), rpm: val('di-s2-rpm') };
        }
    },

    calculateHypothesis: () => {
        const { targetTime, s1 } = dialInWizard.data;
        const timeDiff = targetTime - s1.time; 
        
        // As a generic rule of thumb: 1 second ~ 0.2 grind size changes.
        // If we want +10s (need to slow down extraction), we go finer (smaller number usually).
        let grindChange = timeDiff * -0.2; 
        
        let rawTarget = s1.grind + grindChange;
        
        document.getElementById('di-target-range').innerText = `${(rawTarget - 0.5).toFixed(1)} - ${(rawTarget + 0.5).toFixed(1)}`;
        document.getElementById('di-s2-suggested-grind').innerText = rawTarget.toFixed(1);
    },

    calculateFinal: () => {
        const { targetTime, s1, s2 } = dialInWizard.data;
        
        let targetGrind = s2.grind; 
        if (s2.time !== s1.time) {
            targetGrind = s1.grind + (targetTime - s1.time) * ((s2.grind - s1.grind) / (s2.time - s1.time));
        }
        
        dialInWizard.data.finalGrind = targetGrind;
        document.getElementById('di-final-grind').innerText = targetGrind.toFixed(1);
    },

    buildSummary: () => {
        const grid = document.getElementById('di-summary-grid');
        const d = dialInWizard.data;
        grid.innerHTML = `
            <div class="detail-item"><label>ZIELZEIT</label><span>${d.targetTime}s</span></div>
            <div class="detail-item"><label>MÜHLE RANGE</label><span>${d.minGrind} - ${d.maxGrind}</span></div>
            <div class="detail-item"><label>SHOT 1</label><span>Grind ${d.s1.grind} | ${d.s1.time}s</span></div>
            <div class="detail-item"><label>SHOT 2</label><span>Grind ${d.s2.grind} | ${d.s2.time}s</span></div>
            <div class="detail-item final-start"><label>PERFEKTER STARTPUNKT</label><span>${d.finalGrind.toFixed(1)}</span></div>
        `;
    },

    reset: () => {
        dialInWizard.data = {};
        document.querySelectorAll('.wizard-step input').forEach(el => el.value = '');
        dialInWizard.goToStep(1);
    }
};

window.dialInWizard = dialInWizard;
document.addEventListener('DOMContentLoaded', () => dialInWizard.init());

/* --- BEAN MANAGER (NEW) --- */
const beanManager = {
    beans: [], // Will store bean infos from Firebase
    currentView: 'recipes', // 'recipes' or 'infos'
    entryContext: 'new', // 'new', 'add', 'cam'
    infoMode: 'single', // 'single', 'blend'
    blendComponents: 1,

    init: () => {
        // Any init logic
    },

    switchView: (view) => {
        beanManager.currentView = view;
        const btnRecipes = document.getElementById('view-recipes');
        const btnInfos = document.getElementById('view-infos');
        const listRecipes = document.getElementById('brew-list');
        const listInfos = document.getElementById('bean-infos-list');

        if (view === 'recipes') {
            btnRecipes.classList.add('active');
            btnInfos.classList.remove('active');
            listRecipes.classList.remove('hidden');
            listInfos.classList.add('hidden');
        } else {
            btnInfos.classList.add('active');
            btnRecipes.classList.remove('active');
            listInfos.classList.remove('hidden');
            listRecipes.classList.add('hidden');
        }
        utils.vibrate(10);
    },

    openContextAddModal: () => {
        const modal = document.getElementById('bean-entry-modal');
        const pillNav = modal.querySelector('.entry-pill-nav');
        const content = document.getElementById('entry-dynamic-content');
        
        let pillsHtml = '';
        if (beanManager.currentView === 'recipes') {
            pillsHtml = `
                <button class="toggle-btn active" onclick="beanManager.setEntryContext('new', event)">new</button>
                <button class="toggle-btn" onclick="beanManager.setEntryContext('add', event)">add</button>
            `;
        } else {
            pillsHtml = `
                <button class="toggle-btn active" onclick="beanManager.setEntryContext('new', event)">new</button>
                <button class="toggle-btn" onclick="beanManager.setEntryContext('add', event)">add</button>
                <button class="toggle-btn" onclick="beanManager.setEntryContext('cam', event)">cam</button>
            `;
        }
        pillNav.innerHTML = pillsHtml;
        modal.classList.remove('hidden');
        
        // Timeout to allow display block to apply before transition
        setTimeout(() => modal.classList.add('visible'), 10);
        
        // Initial render for 'new'
        beanManager.setEntryContext('new', null, true);
    },

    setEntryContext: (context, event, force = false) => {
        if (!force && event) {
            const nav = event.target.parentElement;
            nav.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            utils.vibrate(10);
        }
        
        beanManager.entryContext = context;
        const content = document.getElementById('entry-dynamic-content');
        
        if (context === 'new') {
            if (beanManager.currentView === 'recipes') {
                content.innerHTML = `
                    <h2 style="margin-bottom: 24px;">Select Skill Level</h2>
                    <div class="skill-level-container">
                        <button class="skill-btn" onclick="beanManager.closeEntryModal(); brewManager.selectSkillLevel('easy')">
                            <span class="material-symbols-rounded">sentiment_satisfied</span>
                            <span class="skill-text">Easy</span>
                        </button>
                        <button class="skill-btn" onclick="beanManager.closeEntryModal(); brewManager.selectSkillLevel('medium')">
                            <span class="material-symbols-rounded">psychology</span>
                            <span class="skill-text">Medium</span>
                        </button>
                        <button class="skill-btn" onclick="beanManager.closeEntryModal(); brewManager.selectSkillLevel('expert')">
                            <span class="material-symbols-rounded">science</span>
                            <span class="skill-text">Expert</span>
                        </button>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <h2 style="margin-bottom: 24px;">New Info</h2>
                    <p style="margin-bottom: 20px; color:var(--color-gold-dark); font-size:0.9rem;">Erfasse Details einer neuen Bohne.</p>
                    <button class="m3-button m3-button-primary" onclick="beanManager.closeEntryModal(); beanManager.openInfoForm()">LOS</button>
                `;
            }
        } 
        else if (context === 'add') {
            // "Zuweisen" flow
            if (beanManager.currentView === 'recipes') {
                // Showing existing BEAN INFOS to link to a NEW RECIPE
                content.innerHTML = `
                    <h2 style="margin-bottom: 24px;">Add to Info</h2>
                    <div class="link-list-container" id="link-list-infos">Loading...</div>
                    <button class="m3-button m3-button-primary" onclick="beanManager.proceedLinked('recipe')">Weiter zum Rezept</button>
                `;
                beanManager.renderLinkList('infos');
            } else {
                // Showing existing RECIPES to link to a NEW BEAN INFO
                content.innerHTML = `
                    <h2 style="margin-bottom: 24px;">Add to Recipe</h2>
                    <div class="link-list-container" id="link-list-recipes">Loading...</div>
                    <button class="m3-button m3-button-primary" onclick="beanManager.proceedLinked('info')">Weiter zu Infos</button>
                `;
                beanManager.renderLinkList('recipes');
            }
        }
        else if (context === 'cam') {
            content.innerHTML = `
                <div style="padding: 40px 0;">
                    <span class="material-symbols-rounded" style="font-size:4rem; color:var(--color-gold-dark);">camera_alt</span>
                    <h2 style="margin-top:20px;">Coming Soon</h2>
                </div>
            `;
        }
    },

    closeEntryModal: () => {
        const modal = document.getElementById('bean-entry-modal');
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    // ---------- INFOS FORM ---------- //
    openInfoForm: () => {
        const modal = document.getElementById('bean-info-modal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('visible'), 10);
        beanManager.switchInfoType('single');
    },

    closeInfoModal: () => {
        const modal = document.getElementById('bean-info-modal');
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    switchInfoType: (type) => {
        beanManager.infoMode = type;
        document.getElementById('info-type-so').classList.toggle('active', type === 'single');
        document.getElementById('info-type-bl').classList.toggle('active', type === 'blend');
        
        document.getElementById('single-origin-form').classList.toggle('hidden', type !== 'single');
        document.getElementById('blend-form').classList.toggle('hidden', type !== 'blend');

        // Reset blend view to page 1
        if (type === 'blend') {
            document.getElementById('blend-page-1').classList.remove('hidden');
            document.getElementById('blend-page-2').classList.add('hidden');
            if (beanManager.blendComponents === 0) beanManager.addBlendComponent();
        }
        utils.vibrate(10);
    },

    setBlendTiming: (timing) => {
        document.getElementById('bl-timing-value').value = timing;
        document.getElementById('blend-timing-pre').classList.toggle('active', timing === 'pre');
        document.getElementById('blend-timing-post').classList.toggle('active', timing === 'post');
        utils.vibrate(10);
    },

    setRoastLevel: (prefix, level) => {
        document.getElementById(`${prefix}-roast-value`).value = level;
        const circles = document.getElementById(`${prefix}-roast-circles`).children;
        for (let i = 0; i < circles.length; i++) {
            if (i < level) {
                circles[i].classList.add('active');
            } else {
                circles[i].classList.remove('active');
            }
        }
        utils.vibrate(15);
    },

    // --- Blend Pagination ---
    nextBlendPage: () => {
        document.getElementById('blend-page-1').classList.add('hidden');
        document.getElementById('blend-page-2').classList.remove('hidden');
    },

    prevBlendPage: () => {
        document.getElementById('blend-page-2').classList.add('hidden');
        document.getElementById('blend-page-1').classList.remove('hidden');
    },

    addBlendComponent: () => {
        beanManager.blendComponents++;
        const index = beanManager.blendComponents;
        const container = document.getElementById('blend-components-container');
        
        const html = `
            <div class="glass-panel" style="margin-bottom: 20px; padding: 15px; border: 1px solid rgba(255,255,255,0.1);">
                <h4 style="color:var(--color-gold-bright); margin-bottom:10px;">Bohne ${index}</h4>
                <input type="text" name="compName_${index}" placeholder="Name">
                <input type="text" name="compVariety_${index}" placeholder="Varietät">
                <input type="text" name="compOrigin_${index}" placeholder="Herkunft">
                <div class="row">
                    <input type="text" name="compAltitude_${index}" placeholder="Altitude">
                    <input type="text" name="compProcess_${index}" placeholder="Process">
                </div>
                <!-- Custom Roast for component -->
                <div class="custom-roast-level" style="margin: 15px 0;">
                    <label style="display:block; text-align:left; color:var(--color-gold-light); font-size: 0.8rem; margin-bottom: 8px;">Röstgrad</label>
                    <div class="roast-circles" id="comp${index}-roast-circles">
                        <div class="roast-circle" onclick="beanManager.setRoastLevel('comp${index}', 1)"></div>
                        <div class="roast-circle" onclick="beanManager.setRoastLevel('comp${index}', 2)"></div>
                        <div class="roast-circle" onclick="beanManager.setRoastLevel('comp${index}', 3)"></div>
                    </div>
                    <input type="hidden" name="compRoastLevel_${index}" id="comp${index}-roast-value" value="0">
                </div>
                <input type="number" name="compSca_${index}" placeholder="SCA - Score" step="0.1">
                <input type="text" name="compHarvest_${index}" placeholder="Harvest">
                <input type="text" name="compFarmer_${index}" placeholder="Farmer Name">
                <input type="text" name="compRoastDate_${index}" placeholder="Roast date" onfocus="(this.type='date')" onblur="if(!this.value)this.type='text'">
                <textarea name="compTasteProfile_${index}" placeholder="Taste profile"></textarea>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    // ---------- LINKING ---------- //
    selectedLinkTarget: null,
    
    renderLinkList: (type) => {
        beanManager.selectedLinkTarget = null;
        if (type === 'infos') {
            const container = document.getElementById('link-list-infos');
            if(beanManager.beans.length === 0) {
                container.innerHTML = '<p>Keine gespeicherten Bean Infos gefunden.</p>';
            } else {
                container.innerHTML = beanManager.beans.map(b => `
                    <div class="simple-pill" onclick="beanManager.selectLinkItem(this, '${b.id}')">
                        <strong>${b.name}</strong>
                        <small>${b.roastery}</small>
                    </div>
                `).join('');
            }
        } else {
            const container = document.getElementById('link-list-recipes');
            if(brewManager.brews.length === 0) {
                container.innerHTML = '<p>Keine gespeicherten Rezepte gefunden.</p>';
            } else {
                container.innerHTML = brewManager.brews.map(b => `
                    <div class="simple-pill" onclick="beanManager.selectLinkItem(this, '${b.id}')">
                        <strong>${b.beanName}</strong>
                        <small>${b.skillLevel} Level • ${b.doseIn}g in / ${b.doseOut || '?'}g out</small>
                    </div>
                `).join('');
            }
        }
    },

    selectLinkItem: (element, id) => {
        const parent = element.parentElement;
        parent.querySelectorAll('.simple-pill').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        beanManager.selectedLinkTarget = id;
        utils.vibrate(10);
    },

    proceedLinked: (destination) => {
        if (!beanManager.selectedLinkTarget) {
            alert('Bitte wähle zuerst einen Eintrag aus.');
            return;
        }
        
        beanManager.closeEntryModal();
        
        if (destination === 'recipe') {
            // User linked an Info to a NEW Recipe
            document.getElementById('linkedBeanId').value = beanManager.selectedLinkTarget;
            // Pre-fill recipe name if possible
            const info = beanManager.beans.find(b => b.id === beanManager.selectedLinkTarget);
            if(info) document.getElementById('brew-beanName').value = info.name;
            brewManager.selectSkillLevel('medium'); // Default to medium, they can't choose unless we add an extra step
        } else {
            // User linked a Recipe to a NEW Info
            document.getElementById('so-linkedRecipeId').value = beanManager.selectedLinkTarget;
            document.getElementById('bl-linkedRecipeId').value = beanManager.selectedLinkTarget;
            beanManager.openInfoForm();
        }
    },

    jumpToLinkedRecipe: (recipeId, e) => {
        e.stopPropagation();
        if(window.beanManager) {
            if(window.beanManager.currentView !== 'recipes') {
                window.beanManager.switchView('recipes');
            }
            setTimeout(() => {
                const icon = document.getElementById(`icon-${recipeId}`);
                if(icon) {
                    const parent = icon.closest('.brew-pill');
                    if(parent && !parent.classList.contains('expanded')) {
                        window.brewManager.toggle(recipeId);
                    }
                    if(parent) {
                        parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const originalBg = parent.style.boxShadow;
                        parent.style.boxShadow = '0 0 15px var(--md-sys-color-primary)';
                        setTimeout(() => parent.style.boxShadow = originalBg, 1500);
                    }
                }
            }, 100);
        }
    },

    editInfo: (id, e) => {
        e.stopPropagation();
        const info = beanManager.beans.find(b => b.id === id);
        if(!info) return;

        beanManager.openInfoForm();
        beanManager.switchInfoType(info.type);

        // Remove old details not needed (it will just replace if found later, maybe id stays?) 
        // We will filter out this item and add it back fresh when saved. 
        beanManager.beans = beanManager.beans.filter(b => b.id !== id);

        setTimeout(() => {
            const formId = info.type === 'blend' ? 'blend-form' : 'single-origin-form';
            const form = document.getElementById(formId);
            if(!form) return;

            // Fill basic
            if(form.elements['name']) form.elements['name'].value = info.name || '';
            if(form.elements['roastery']) form.elements['roastery'].value = info.roastery || '';
            if(form.elements['roastLevel']) form.elements['roastLevel'].value = info.roastLevel || '0';
            
            // Set roast circles
            const prefix = info.type === 'blend' ? 'bl' : 'so';
            beanManager.setRoastLevel(prefix, info.roastLevel || 0);

            if(info.type === 'single') {
                if(form.elements['variety']) form.elements['variety'].value = info.variety || '';
                if(form.elements['process']) form.elements['process'].value = info.process || '';
                if(form.elements['origin']) form.elements['origin'].value = info.origin || '';
                if(form.elements['altitude']) form.elements['altitude'].value = info.altitude || '';
                if(form.elements['scaScore']) form.elements['scaScore'].value = info.scaScore || '';
                if(form.elements['harvest']) form.elements['harvest'].value = info.harvest || '';
                if(form.elements['farmer']) form.elements['farmer'].value = info.farmer || '';
                if(form.elements['roastDate']) form.elements['roastDate'].value = info.roastDate || '';
                if(form.elements['tasteProfile']) form.elements['tasteProfile'].value = info.tasteProfile || '';
            } else {
                if(form.elements['targetProfile']) form.elements['targetProfile'].value = info.targetProfile || '';
                if(form.elements['composition']) form.elements['composition'].value = info.composition || '';
                if(form.elements['blendDate']) form.elements['blendDate'].value = info.blendDate || '';
                if(info.blendTiming) beanManager.setBlendTiming(info.blendTiming);

                // Map components
                if(info.components) {
                    beanManager.blendComponents = 0;
                    document.getElementById('blend-components-container').innerHTML = '';
                    info.components.forEach((comp, idx) => {
                        beanManager.addBlendComponent();
                        const i = idx + 1;
                        if(form.elements[`compName_${i}`]) form.elements[`compName_${i}`].value = comp.name || '';
                        if(form.elements[`compVariety_${i}`]) form.elements[`compVariety_${i}`].value = comp.variety || '';
                        if(form.elements[`compOrigin_${i}`]) form.elements[`compOrigin_${i}`].value = comp.origin || '';
                        if(form.elements[`compAltitude_${i}`]) form.elements[`compAltitude_${i}`].value = comp.altitude || '';
                        if(form.elements[`compProcess_${i}`]) form.elements[`compProcess_${i}`].value = comp.process || '';
                        if(form.elements[`compSca_${i}`]) form.elements[`compSca_${i}`].value = comp.scaScore || '';
                        if(form.elements[`compHarvest_${i}`]) form.elements[`compHarvest_${i}`].value = comp.harvest || '';
                        if(form.elements[`compFarmer_${i}`]) form.elements[`compFarmer_${i}`].value = comp.farmer || '';
                        if(form.elements[`compRoastDate_${i}`]) form.elements[`compRoastDate_${i}`].value = comp.roastDate || '';
                        if(form.elements[`compTasteProfile_${i}`]) form.elements[`compTasteProfile_${i}`].value = comp.tasteProfile || '';
                        if(form.elements[`compRoastLevel_${i}`]) {
                            beanManager.setRoastLevel(`comp${i}`, comp.roastLevel || 0);
                        }
                    });
                }
            }
        }, 100);
    },

    init: () => {
        // Load local beans if available (Firebase sync logic will overlay this if logged in)
        beanManager.beans = JSON.parse(localStorage.getItem('coffee_bean_infos') || '[]');
        beanManager.renderInfos();

        const soForm = document.getElementById('single-origin-form');
        if(soForm) {
            soForm.addEventListener('submit', (e) => {
                e.preventDefault();
                beanManager.saveInfo('single');
            });
        }
        
        const blForm = document.getElementById('blend-form');
        if(blForm) {
            blForm.addEventListener('submit', (e) => {
                e.preventDefault();
                beanManager.saveInfo('blend');
            });
        }
    },

    saveInfo: (type) => {
        const isBlend = type === 'blend';
        const formId = isBlend ? 'blend-form' : 'single-origin-form';
        const form = document.getElementById(formId);
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const newInfo = {
            id: utils.uuid(),
            type: type,
            dateAdded: new Date().toISOString(),
            name: data.name,
            roastery: data.roastery,
            roastLevel: parseInt(data.roastLevel || '0', 10)
        };

        if (isBlend) {
            newInfo.blendTiming = data.blendTiming;
            newInfo.composition = data.composition;
            newInfo.targetProfile = data.targetProfile;
            newInfo.blendDate = data.blendDate;
            
            // Extract components
            const components = [];
            for (let i = 1; i <= beanManager.blendComponents; i++) {
                if (data[`compName_${i}`]) {
                    components.push({
                        name: data[`compName_${i}`],
                        variety: data[`compVariety_${i}`],
                        origin: data[`compOrigin_${i}`],
                        altitude: data[`compAltitude_${i}`],
                        process: data[`compProcess_${i}`],
                        roastLevel: parseInt(data[`compRoastLevel_${i}`] || '0', 10),
                        scaScore: data[`compSca_${i}`],
                        harvest: data[`compHarvest_${i}`],
                        farmer: data[`compFarmer_${i}`],
                        roastDate: data[`compRoastDate_${i}`],
                        tasteProfile: data[`compTasteProfile_${i}`],
                    });
                }
            }
            newInfo.components = components;
        } else {
            newInfo.variety = data.variety;
            newInfo.process = data.process;
            newInfo.origin = data.origin;
            newInfo.altitude = data.altitude;
            newInfo.scaScore = data.scaScore;
            newInfo.harvest = data.harvest;
            newInfo.farmer = data.farmer;
            newInfo.roastDate = data.roastDate;
            newInfo.tasteProfile = data.tasteProfile;
        }

        beanManager.beans.unshift(newInfo);
        
        // Save logic
        if (window.authManager && window.authManager.currentUser) {
            window.authManager.saveBeans(beanManager.beans);
        } else {
            localStorage.setItem('coffee_bean_infos', JSON.stringify(beanManager.beans));
        }

        // Handle Linking if a recipe was chosen
        const linkedRecipeId = data.linkedRecipeId;
        if (linkedRecipeId && brewManager) {
            const recipe = brewManager.brews.find(b => b.id === linkedRecipeId);
            if (recipe) {
                recipe.linkedBeanId = newInfo.id;
                // Save recipes again to keep the link
                if (window.authManager && window.authManager.currentUser) {
                    window.authManager.saveBrews(brewManager.brews);
                } else {
                    localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
                }
            }
        }

        form.reset();
        beanManager.closeInfoModal();
        beanManager.renderInfos();
        utils.vibrate([50, 50, 50]);
    },

    renderInfos: () => {
        const container = document.getElementById('bean-infos-list');
        if (!container) return;
        
        container.innerHTML = '';
        if (beanManager.beans.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:rgba(255,255,255,0.5); margin-top:20px;">Keine Bohneninfos gespeichert.</p>`;
            return;
        }

        beanManager.beans.forEach(info => {
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';
            
            const typeLabel = info.type === 'blend' ? 'Blend' : 'Single Origin';
            const linkedRecipe = window.brewManager ? window.brewManager.brews.find(b => b.linkedBeanId === info.id) : null;
            let iconHtml = linkedRecipe ? `<span class="material-symbols-rounded" style="color:var(--color-gold-bright); font-size: 1.1rem; margin-right: 8px; cursor:pointer;" onclick="beanManager.jumpToLinkedRecipe('${linkedRecipe.id}', event)">link</span>` : '';

            let detailsHtml = `
                <div class="actions-row">
                    <button class="action-btn" onclick="beanManager.editInfo('${info.id}', event)"><span class="material-symbols-rounded">edit</span></button>
                    <button class="action-btn delete" onclick="beanManager.deleteInfo('${info.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                </div>
                <div class="detail-grid">
                    <div class="detail-item"><label>TYPE</label><span>${typeLabel}</span></div>
            `;
            
            if (info.type === 'single') {
                detailsHtml += `
                    <div class="detail-item"><label>ROAST LEVEL</label><span>${info.roastLevel || '-'} / 3</span></div>
                    <div class="detail-item"><label>ROAST DATE</label><span>${info.roastDate || '-'}</span></div>
                    <div class="detail-item"><label>ORIGIN</label><span>${info.origin || '-'}</span></div>
                    <div class="detail-item"><label>ALTITUDE</label><span>${info.altitude || '-'}</span></div>
                    <div class="detail-item"><label>FARMER</label><span>${info.farmer || '-'}</span></div>
                    <div class="detail-item"><label>PROCESS</label><span>${info.process || '-'}</span></div>
                    <div class="detail-item"><label>VARIETY</label><span>${info.variety || '-'}</span></div>
                    <div class="detail-item"><label>SCA SCORE</label><span>${info.scaScore || '-'}</span></div>
                    <div class="detail-item"><label>HARVEST</label><span>${info.harvest || '-'}</span></div>
                `;
            } else {
                detailsHtml += `
                    <div class="detail-item"><label>TIMING</label><span>${info.blendTiming || '-'}</span></div>
                    <div class="detail-item"><label>BLEND DATE</label><span>${info.blendDate || '-'}</span></div>
                    <div class="detail-item" style="grid-column: 1 / -1;"><label>TARGET</label><span>${info.targetProfile || '-'}</span></div>
                    <div class="detail-item"><label>COMPONENTS</label><span>${info.components ? info.components.length : 0}</span></div>
                    <div class="detail-item" style="grid-column: 1 / -1;"><label>COMPOSITION</label><span>${info.composition || '-'}</span></div>
                `;
            }
            
            detailsHtml += `</div>`;
            
            if (info.type === 'blend' && info.components && info.components.length > 0) {
                detailsHtml += `
                    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                        <label style="color:var(--color-gold-light); font-size: 0.8rem; display:block; margin-bottom: 10px;">COMPONENTS</label>
                        ${info.components.map((comp, idx) => `
                            <div style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                <strong style="display:block; color:var(--color-cream); margin-bottom: 5px;">${idx + 1}. ${comp.name || 'Unknown'} ${comp.roastLevel ? `(${comp.roastLevel}/3)` : ''}</strong>
                                <div class="detail-grid" style="font-size: 0.85em; opacity: 0.9;">
                                    ${comp.origin ? `<div class="detail-item"><label>ORIGIN</label><span>${comp.origin}</span></div>` : ''}
                                    ${comp.variety ? `<div class="detail-item"><label>VARIETY</label><span>${comp.variety}</span></div>` : ''}
                                    ${comp.process ? `<div class="detail-item"><label>PROCESS</label><span>${comp.process}</span></div>` : ''}
                                    ${comp.altitude ? `<div class="detail-item"><label>ALT</label><span>${comp.altitude}</span></div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (info.tasteProfile) {
                detailsHtml += `
                    <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                        <label style="color:var(--color-gold-light); font-size: 0.8rem; display:block; margin-bottom: 5px;">TASTE PROFILE</label>
                        <p style="font-size: 0.9rem; opacity: 0.8; margin: 0;">${info.tasteProfile}</p>
                    </div>
                `;
            }

            el.innerHTML = `
                <div class="brew-header" onclick="beanManager.toggleInfo('${info.id}')">
                    <div style="flex:1">
                        <h3>${info.name}</h3>
                        <small style="opacity:0.7">${info.roastery || 'Unknown Roastery'}</small>
                    </div>
                    <div class="brew-actions">
                        ${iconHtml}
                        <span class="material-symbols-rounded" id="info-icon-${info.id}">expand_more</span>
                    </div>
                </div>
                <div class="brew-details" id="info-details-${info.id}">
                    ${detailsHtml}
                </div>
            `;
            container.appendChild(el);
        });
    },

    toggleInfo: (id) => {
        const details = document.getElementById(`info-details-${id}`);
        const parent = details.parentElement;
        const icon = document.getElementById(`info-icon-${id}`);

        if (parent.classList.contains('expanded')) {
            parent.classList.remove('expanded');
            icon.innerText = 'expand_more';
        } else {
            document.querySelectorAll('#bean-infos-list .brew-pill.expanded').forEach(p => {
                p.classList.remove('expanded');
                try { p.querySelector('.material-symbols-rounded').innerText = 'expand_more'; } catch (e) { }
            });
            parent.classList.add('expanded');
            icon.innerText = 'expand_less';
        }
        utils.vibrate(10);
    },

    deleteInfo: (id, e) => {
        e.stopPropagation();
        if (confirm('Delete this bean info?')) {
            beanManager.beans = beanManager.beans.filter(b => b.id !== id);

            if (window.authManager && window.authManager.currentUser) {
                window.authManager.saveBeans(beanManager.beans);
            } else {
                localStorage.setItem('coffee_bean_infos', JSON.stringify(beanManager.beans));
            }
            beanManager.renderInfos();
            utils.vibrate([50, 50]);
        }
    }
};

window.beanManager = beanManager;
// Initialize automatically
document.addEventListener('DOMContentLoaded', () => {
    if(window.beanManager) beanManager.init();
});
