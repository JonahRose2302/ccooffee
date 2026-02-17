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

/* --- ROUTER --- */
const router = {
    navigate: (pageId) => {
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

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

            localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
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
            localStorage.setItem('coffee_brews', JSON.stringify(brewManager.brews));
            brewManager.renderList();
            utils.vibrate(50);
        }
    },

    closeModal: () => {
        const m = document.getElementById('brew-modal');
        m.classList.remove('visible');
        setTimeout(() => m.classList.add('hidden'), 300);
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
                    <span class="material-symbols-rounded" id="icon-${brew.id}">expand_more</span>
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

            localStorage.setItem('coffee_drinks', JSON.stringify(drinkManager.drinks));
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
            localStorage.setItem('coffee_drinks', JSON.stringify(drinkManager.drinks));
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

            localStorage.setItem('coffee_shops', JSON.stringify(shopManager.shops));
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
            localStorage.setItem('coffee_shops', JSON.stringify(shopManager.shops));
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
            document.querySelectorAll('a, button, .tile, .brew-header, input, .nav-btn, .action-btn, .toggle-btn').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursorFollower.el.classList.add('active');
                });
                el.addEventListener('mouseleave', () => {
                    cursorFollower.el.classList.remove('active');
                });

                // Add ripple on click
                el.addEventListener('click', (e) => {
                    if (el.classList.contains('tile') || el.classList.contains('nav-btn') || el.classList.contains('action-btn')) {
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

window.addEventListener('load', () => {
    // Scroll Animation Init
    const canvas = document.getElementById("video-canvas");
    const context = canvas.getContext("2d");
    canvas.width = 1280;
    canvas.height = 720;
    const frameCount = 240;
    const currentFrame = index => `./img/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;
    const images = [];
    const sequence = { frame: 0 };

    let loaded = 0;
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);
        img.onload = () => { loaded++; if (loaded === frameCount) startScrollAnim(); };
    }

    function startScrollAnim() {
        gsap.to(sequence, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".v-container",
                start: "top top",
                end: "+=3000", // User specified scroll distance
                scrub: 0.5,
                pin: true,
                pinSpacing: true, // User requested this logic
                anticipatePin: 1
            },
            onUpdate: renderFrame
        });
        renderFrame();
    }

    function renderFrame() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const img = images[sequence.frame];
        if (!img) return;
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        context.drawImage(img, 0, 0, img.width, img.height,
            centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    }
    window.addEventListener("resize", renderFrame);

    // Feature Inits
    brewManager.init();
    drinkManager.init();
    shopManager.init();
    cursorFollower.init();

    // Enable magnetic effects on tiles and navigation
    setTimeout(() => {
        animationEngine.enableMagnetic('.tile', 0.3);
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
