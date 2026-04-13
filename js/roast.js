const roastApp = {
    state: {
        isRunning: false,
        startTime: null,
        intervalId: null,
        totalTimeSeconds: 0,
        fcStartTimeSeconds: null,
        events: [],
        setup: {},
        post: {},
        cupping: {},
        chartInstance: null
    },

    init() {
        this.setupTabs();
        this.updateLogView();
        
        // Listen for auth to load data
        window.addEventListener('auth-data-loaded', (e) => {
            const data = e.detail;
            if (data && data.roasts) {
                this.renderArchive(data.roasts);
            }
        });

        // initial logic if authManager already loaded
        if (typeof authManager !== 'undefined' && authManager.currentUser) {
            authManager.getRoasts().then(roasts => {
                this.renderArchive(roasts);
            });
        }
    },

    setupTabs() {
        const tabs = document.querySelectorAll('.roast-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // remove active from all
                document.querySelectorAll('.roast-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.roast-section').forEach(s => s.classList.remove('active'));
                
                // add active to clicked target if it's a button, otherwise parent button
                const btn = e.target.closest('.roast-tab');
                if(!btn) return;
                
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    },

    goToLive() {
        document.getElementById('tab-btn-live').click();
    },

    // --- Timer Logic ---
    toggleTimer() {
        if (!this.state.isRunning) {
            // Start Timer
            this.state.isRunning = true;
            this.state.startTime = Date.now() - (this.state.totalTimeSeconds * 1000);
            
            document.getElementById('btn-charge').innerText = "RÖSTUNG LÄUFT...";
            document.getElementById('btn-charge').classList.add('state-running');
            document.getElementById('main-timer').classList.add('timer-running');

            this.logEvent("START", "Charge");

            this.state.intervalId = setInterval(() => {
                this.updateTimerDisplay();
            }, 500);
        } else {
            // Unused currently, dropBeans() stops it
        }
    },

    updateTimerDisplay() {
        const now = Date.now();
        const diff = now - this.state.startTime;
        this.state.totalTimeSeconds = Math.floor(diff / 1000);
        
        document.getElementById('main-timer').innerText = this.formatTime(this.state.totalTimeSeconds);
    },

    formatTime(totalSeconds) {
        if(totalSeconds === null || isNaN(totalSeconds)) return "--:--";
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },

    // --- Logging Logic ---
    logEvent(type, value) {
        if(!value) return; // ignore empty logs
        
        const eventObj = {
            time: this.state.totalTimeSeconds,
            type: type,
            value: value
        };
        
        this.state.events.push(eventObj);
        
        // visual feedback on inputs
        if(type === 'Hitze') document.getElementById('input-heat').value = '';
        if(type === 'Agitation') document.getElementById('input-agitation').value = '';
        if(type === 'Temperatur') document.getElementById('input-temp').value = '';

        this.updateLogView();
    },

    logMilestone(name, btnElement) {
        this.logEvent("Meilenstein", name);
        
        if(btnElement) {
            btnElement.classList.add('logged');
        }

        if(name === 'First Crack Start') {
            this.state.fcStartTimeSeconds = this.state.totalTimeSeconds;
        }
    },

    updateLogView() {
        const container = document.getElementById('live-log-container');
        container.innerHTML = '';
        
        // sort events newest first
        const sorted = [...this.state.events].sort((a,b) => b.time - a.time);
        
        sorted.forEach(ev => {
            const el = document.createElement('div');
            el.className = 'log-entry';
            el.innerHTML = `
                <div class="log-time">${this.formatTime(ev.time)}</div>
                <div class="log-name">${ev.type}</div>
                <div class="log-val">${ev.value}</div>
            `;
            container.appendChild(el);
        });

        // update raw view in archive
        const rawView = document.getElementById('raw-export-view');
        if(rawView) {
            rawView.innerText = JSON.stringify(this.generateExportData(), null, 2);
        }
        
        if (this.state.isRunning || this.state.chartInstance) {
            this.updateGraph();
        }
    },

    dropBeans() {
        if (!this.state.isRunning) return;

        clearInterval(this.state.intervalId);
        this.state.isRunning = false;
        
        document.getElementById('btn-charge').innerText = "BEENDET (DROP)";
        document.getElementById('btn-charge').classList.remove('state-running');
        document.getElementById('main-timer').classList.remove('timer-running');

        this.logMilestone("DROP", null);
        document.getElementById('stat-total-time').innerText = this.formatTime(this.state.totalTimeSeconds);

        // Auto move to analysis
        document.querySelector('[data-target="tab-analysis"]').click();
        
        // Show the current roast section
        document.getElementById('current-roast-analysis').style.display = 'block';
        
        this.updateGraph();
    },

    // --- Processing & Analysis ---
    calculateMetrics() {
        // Collect Setup Data
        this.state.setup = {
            origin: document.getElementById('setup-origin').value,
            variety: document.getElementById('setup-variety').value,
            process: document.getElementById('setup-process').value,
            weightIn: parseFloat(document.getElementById('setup-weight-in').value) || 0
        };

        const weightOut = parseFloat(document.getElementById('post-weight-out').value) || 0;
        
        // 1. Weight Loss
        if(this.state.setup.weightIn > 0 && weightOut > 0) {
            const loss = ((this.state.setup.weightIn - weightOut) / this.state.setup.weightIn) * 100;
            document.getElementById('stat-weight-loss').innerText = loss.toFixed(2) + ' %';
            this.state.post.weightLoss = loss.toFixed(2);
        }

        // 2. DTR (Development Time Ratio)
        // Ratio of time from FC Start to Drop vs Total Time
        if(this.state.fcStartTimeSeconds && this.state.totalTimeSeconds > 0) {
            const devTime = this.state.totalTimeSeconds - this.state.fcStartTimeSeconds;
            const dtr = (devTime / this.state.totalTimeSeconds) * 100;
            document.getElementById('stat-dtr').innerText = dtr.toFixed(1) + ' %';
            this.state.post.dtr = dtr.toFixed(1);
        }
        
        // update raw view
        this.updateLogView();
    },

    async saveRoast() {
        this.calculateMetrics();
        const exportData = this.generateExportData();
        
        // Give it a name based on origin
        exportData.name = (this.state.setup.origin || 'Unbenannt') + ' - ' + (this.state.setup.variety || 'Mix');

        if(typeof authManager !== 'undefined' && authManager.currentUser) {
            const btn = event.currentTarget;
            btn.innerText = "Speichern...";
            
            const roasts = await authManager.getRoasts();
            // Assign unique ID just like in beans/brews
            exportData.id = Date.now().toString() + Math.floor(Math.random()*1000);
            roasts.push(exportData);
            
            await authManager.saveRoasts(roasts);
            
            this.renderArchive(roasts);
            
            btn.innerText = "Speichern";
            
            alert('Röstung erfolgreich in der Cloud gespeichert!');
        } else {
            // fallback local storage
            let roasts = JSON.parse(localStorage.getItem('coffee_roasts') || '[]');
            exportData.id = Date.now().toString() + Math.floor(Math.random()*1000);
            roasts.push(exportData);
            localStorage.setItem('coffee_roasts', JSON.stringify(roasts));
            this.renderArchive(roasts);
            alert('Lokal gespeichert. Logge dich ein für Cloud-Sync.');
        }
    },

    // --- GRAPH & ARCHIVE ---
    updateGraph() {
        const ctx = document.getElementById('roastChart');
        if (!ctx) return;
        
        // Prepare datasets
        let dpTemp = [];
        let dpHeat = [];
        let timeLabels = [];

        // filter events
        const temps = this.state.events.filter(e => e.type === 'Temperatur').sort((a,b)=>a.time - b.time);
        const heat = this.state.events.filter(e => e.type === 'Hitze').sort((a,b)=>a.time - b.time);
        
        // milestones as annotations (we will use vertical points)
        const milestones = this.state.events.filter(e => e.type === 'Meilenstein');
        
        // Create full timeline range (0 to final time or max logged time)
        let maxT = this.state.totalTimeSeconds;
        if(temps.length > 0) maxT = Math.max(maxT, temps[temps.length-1].time);
        
        for(let i = 0; i <= maxT; i += 30) {
            timeLabels.push(i);
        }
        
        temps.forEach(t => {
            dpTemp.push({x: t.time, y: parseFloat(t.value)});
        });
        
        heat.forEach(h => {
            dpHeat.push({x: h.time, y: parseFloat(h.value)});
        });

        if(this.state.chartInstance) {
            this.state.chartInstance.destroy();
        }

        // Initialize Chart.js
        this.state.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Temperatur (°C)',
                        data: dpTemp,
                        borderColor: '#f4c430',
                        backgroundColor: 'rgba(244, 196, 48, 0.2)',
                        yAxisID: 'yTemp',
                        tension: 0.4
                    },
                    {
                        label: 'Hitze',
                        data: dpHeat,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        yAxisID: 'yHeat',
                        stepped: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Zeit (s)', color: '#dedcd8' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#dedcd8' }
                    },
                    yTemp: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '°C', color: '#f4c430' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#f4c430' }
                    },
                    yHeat: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        title: { display: true, text: 'Hitze', color: '#e74c3c' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#e74c3c' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#dedcd8' }
                    }
                }
            }
        });
    },

    renderArchive(roasts) {
        const list = document.getElementById('archive-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (!roasts || roasts.length === 0) {
            list.innerHTML = '<p style="color:var(--color-cream-dark); text-align:center;">Noch keine Röstungen im Archiv.</p>';
            return;
        }

        // Sort descending by date
        const sorted = [...roasts].sort((a,b) => new Date(b.metadata.date) - new Date(a.metadata.date));

        sorted.forEach(r => {
            const dateObj = new Date(r.metadata.date);
            const daysSince = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
            
            const el = document.createElement('div');
            el.className = 'brew-pill glass-panel';
            
            el.innerHTML = `
                <div class="brew-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div style="flex:1">
                        <h3 style="margin:0; font-family:var(--font-heading); color:var(--color-gold-bright);">${r.name || 'Unbenannte Röstung'}</h3>
                        <small style="opacity:0.7">${dateObj.toLocaleDateString()} • Einwaage: ${r.setup?.weightIn || '?'}g</small>
                    </div>
                    <div class="brew-actions">
                        <button class="action-btn delete" onclick="roastApp.deleteRoast('${r.id}', event)"><span class="material-symbols-rounded">delete</span></button>
                        <span class="material-symbols-rounded">expand_more</span>
                    </div>
                </div>
                <div class="brew-details">
                    <div class="roast-graph-container" style="height: 150px; margin-bottom: 20px;">
                        <canvas id="archiveChart-${r.id}"></canvas>
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item" style="grid-column: 1 / -1;"><label>ALTER</label><span style="text-transform: capitalize; color: var(--color-gold-bright); font-weight: bold;">${daysSince} Tage alt</span></div>
                        <div class="detail-item"><label>HERKUNFT</label><span>${r.setup?.origin || '--'}</span></div>
                        <div class="detail-item"><label>VARIETÄT</label><span>${r.setup?.variety || '--'}</span></div>
                        <div class="detail-item"><label>AUFBEREITUNG</label><span>${r.setup?.process || '--'}</span></div>
                        <div class="detail-item"><label>EINWAAGE</label><span>${r.setup?.weightIn || '--'}g</span></div>
                        <div class="detail-item"><label>GEWICHTSVERLUST</label><span>${r.postData?.weightLoss || '--'}%</span></div>
                        <div class="detail-item"><label>DTR</label><span>${r.postData?.dtr || '--'}%</span></div>
                        <div class="detail-item"><label>BALANCE</label><span>${r.cupping?.balance || '?'}</span></div>
                    </div>
                </div>
            `;
            list.appendChild(el);
            setTimeout(() => roastApp.drawArchiveGraph(`archiveChart-${r.id}`, r), 0);
        });
    },
    
    async deleteRoast(id, event) {
        event.stopPropagation();
        if(!confirm('Röstung wirklich löschen?')) return;
        
        if (typeof authManager !== 'undefined' && authManager.currentUser) {
            let roasts = await authManager.getRoasts();
            roasts = roasts.filter(r => r.id !== id);
            await authManager.saveRoasts(roasts);
            this.renderArchive(roasts);
        } else {
            let roasts = JSON.parse(localStorage.getItem('coffee_roasts') || '[]');
            roasts = roasts.filter(r => r.id !== id);
            localStorage.setItem('coffee_roasts', JSON.stringify(roasts));
            this.renderArchive(roasts);
        }
    },

    drawArchiveGraph(canvasId, roast) {
        const ctx = document.getElementById(canvasId);
        if(!ctx) return;
        
        let dpTemp = [];
        let dpHeat = [];
        
        const events = roast.events || [];
        const temps = events.filter(e => e.type === 'Temperatur').sort((a,b)=>a.time - b.time);
        const heat = events.filter(e => e.type === 'Hitze').sort((a,b)=>a.time - b.time);
        
        temps.forEach(t => dpTemp.push({x: t.time, y: parseFloat(t.value)}));
        heat.forEach(h => dpHeat.push({x: h.time, y: parseFloat(h.value)}));

        new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    { label: 'Temp °C', data: dpTemp, borderColor: '#f4c430', backgroundColor: 'rgba(244, 196, 48, 0.2)', yAxisID: 'yTemp', tension: 0.4, pointRadius: 1 },
                    { label: 'Hitze', data: dpHeat, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.2)', yAxisID: 'yHeat', stepped: true, pointRadius: 0 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', title: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#dedcd8', display: false } },
                    yTemp: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f4c430', maxTicksLimit: 5 } },
                    yHeat: { type: 'linear', position: 'right', min: 0, grid: { drawOnChartArea: false }, ticks: { display: false } }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    },

    updateCupping() {
        this.state.cupping = {
            acidity: document.getElementById('cup-acid').value,
            body: document.getElementById('cup-body').value,
            sweetness: document.getElementById('cup-sweet').value,
            balance: document.getElementById('cup-bal').value,
            notes: document.getElementById('cup-notes').value
        };
        this.updateLogView();
        alert("Cupping Daten gespeichert.");
    },

    // --- Export ---
    generateExportData() {
        return {
            metadata: {
                date: new Date().toISOString(),
                version: "1.0"
            },
            setup: {
                origin: document.getElementById('setup-origin').value,
                variety: document.getElementById('setup-variety').value,
                process: document.getElementById('setup-process').value,
                harvest: document.getElementById('setup-harvest').value,
                moisture: document.getElementById('setup-moisture').value,
                weightIn: document.getElementById('setup-weight-in').value,
                density: document.getElementById('setup-density').value,
                roomTemp: document.getElementById('setup-room-temp').value,
                pan: document.getElementById('setup-pan').value,
            },
            postData: this.state.post,
            cupping: this.state.cupping,
            events: this.state.events
        };
    },

    exportJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.generateExportData(), null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `roast_${Date.now()}.json`);
        dlAnchorElem.click();
    },

    exportCSV() {
        const data = this.generateExportData();
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Simple CSV export of events
        csvContent += "Time(s),Type,Value\n";
        data.events.forEach(ev => {
            csvContent += `${ev.time},"${ev.type}","${ev.value}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `roast_events_${Date.now()}.csv`);
        document.body.appendChild(link); // Required for FF
        link.click();
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    roastApp.init();
});
