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

/* --- ROUTER --- */
const router = {
    navigate: (pageId) => {
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

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

        shopManager.map = L.map('shop-map-container').setView([51.1657, 10.4515], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(shopManager.map);

        shopManager.renderMarkers();

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

            if (!isCoords && inputLoc.trim().length > 0) {
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
                    const m = L.marker([lat, lng]).addTo(shopManager.map)
                        .bindPopup(s.shopName);
                    shopManager.markers.push(m);
                }
            }
        });
    }
};

/* --- MOUSE FOLLOWER --- */
const cursorFollower = {
    el: document.getElementById('cursor-follower'),
    init: () => {
        if (matchMedia('(hover: hover)').matches) {
            cursorFollower.el.style.display = 'block';
            document.addEventListener('mousemove', (e) => {
                gsap.to(cursorFollower.el, {
                    x: e.clientX,
                    y: e.clientY,
                    duration: 0.1,
                    ease: "power2.out"
                });
            });
            document.querySelectorAll('a, button, .tile, .brew-header, input, .nav-btn, .action-btn').forEach(el => {
                el.addEventListener('mouseenter', () => cursorFollower.grow());
                el.addEventListener('mouseleave', () => cursorFollower.shrink());
            });
        }
    },
    grow: () => gsap.to(cursorFollower.el, { width: 150, height: 150, backgroundColor: 'rgba(255,255,255,0.08)', duration: 0.2 }),
    shrink: () => gsap.to(cursorFollower.el, { width: 120, height: 120, backgroundColor: 'rgba(255,255,255,0.03)', duration: 0.2 })
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
});
