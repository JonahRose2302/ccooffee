/**
 * WebGL Particle Background System
 * Coffee-themed floating particles with depth parallax
 */
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 180; // slightly more particles for a better swarm effect
        this.mouse = { x: -1000, y: -1000 };
        this.scrollY = 0;

        // HIER KANNST DU DIE OPAZITÄT / DEUTLICHKEIT DER PARTIKEL STEUERN (Werte zwischen 0.0 und 1.0)
        // Setze den Wert höher, um sie präsenter zu machen! (z.B. 0.8 oder 0.9)
        this.globalOpacity = 0.85;

        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                size: Math.random() * 3 + 1.5, // slightly larger particles
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.4 + 0.4, // higher base opacity
                depth: Math.random() * 3, // 0-3 for parallax layers
                hue: Math.random() * 30 + 20, // Warm coffee tones
                // Properties for cursor swarm
                angle: Math.random() * Math.PI * 2,
                orbitSpeed: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1), // Slower, relaxed rotation
                orbitRadius: Math.random() * 80 + 30, // Distance to hover around the cursor
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Check if hovering an interactive element
            const target = e.target.closest('button, a, .tile, .knowledge-card, input, .nav-btn, .action-btn, .toggle-btn, .brew-header, .fab, .skill-btn');
            if (target) {
                const rect = target.getBoundingClientRect();
                this.hoveredElement = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height
                };
            } else {
                this.hoveredElement = null;
            }
        });

        // Particles disperse when the mouse leaves the browser
        document.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
            this.hoveredElement = null;
        });

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            this.hoveredElement = null; // Reset hover on scroll to avoid sticking to old positions
        });
    }

    updateParticle(p) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Always increment orbit angle so they keep swirling
        p.angle += p.orbitSpeed;
        let isAttracted = false;

        if (this.hoveredElement && dist < 300) {
            // Swarm around the hovered interactive element (forms an ellipse adapting to width/height)
            const dynRadiusX = (this.hoveredElement.width / 2) + 15 + p.orbitRadius * 0.4;
            const dynRadiusY = (this.hoveredElement.height / 2) + 15 + p.orbitRadius * 0.4;
            const targetX = this.hoveredElement.x + Math.cos(p.angle) * dynRadiusX;
            const targetY = this.hoveredElement.y + Math.sin(p.angle) * dynRadiusY;

            // Add momentum towards target
            p.vx += (targetX - p.x) * 0.008;
            p.vy += (targetY - p.y) * 0.008;
            isAttracted = true;
        } else if (dist < 400 && this.mouse.x !== -1000) {
            // Target position in the ring around cursor
            const targetX = this.mouse.x + Math.cos(p.angle) * p.orbitRadius;
            const targetY = this.mouse.y + Math.sin(p.angle) * p.orbitRadius;

            // Attraction force based on distance, smoothly affecting momentum
            const force = Math.max(0.01, 1 - (dist / 400)) * 0.005;
            p.vx += (targetX - p.x) * force;
            p.vy += (targetY - p.y) * force;
            isAttracted = true;
        }

        // Apply Velocity and smooth Friction physics
        if (isAttracted) {
            // Tighter friction when in orbit so they don't overshoot wildly
            p.vx *= 0.88;
            p.vy *= 0.88;
            p.wasAttracted = true; // Track state for release burst
        } else {
            // Slower friction release so they have inertia and slowly spread apart
            p.vx *= 0.96;
            p.vy *= 0.96;

            // When just released from an orbit, give them a subtle outward drift 
            // so they spread across the empty space faster
            if (p.wasAttracted) {
                p.vx += Math.cos(p.angle) * 1.5;
                p.vy += Math.sin(p.angle) * 1.5;
                p.wasAttracted = false;
            }

            // Slowly blend back into normal drifting physics
            const parallaxFactor = 1 + p.depth * 0.3;
            p.vx += (p.speedX - p.vx) * 0.03;
            p.vy += ((p.speedY * parallaxFactor) - p.vy) * 0.03;
        }

        // Apply finalized velocity
        p.x += p.vx;
        p.y += p.vy;

        // Scroll influence
        p.y -= this.scrollY * 0.001 * p.depth;

        // Wrap around screen
        if (p.y > this.canvas.height + 20) {
            p.y = -20;
            p.x = Math.random() * this.canvas.width;
        }
        if (p.x > this.canvas.width + 20) p.x = -20;
        if (p.x < -20) p.x = this.canvas.width + 20;
    }

    drawParticle(p) {
        this.ctx.beginPath();

        // Create gradient for coffee particle (golden-brown)
        const gradient = this.ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size
        );
        // Apply global opacity setting
        const finalOpacity = p.opacity * this.globalOpacity;
        gradient.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${finalOpacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 80%, 40%, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawConnections() {
        // Draw subtle lines between nearby particles
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 100) {
                    this.ctx.beginPath();
                    // Connect particles with adjusting opacity
                    this.ctx.strokeStyle = `rgba(244, 196, 48, ${(0.15 * this.globalOpacity) * (1 - dist / 100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw all particles
        this.particles.forEach(p => {
            this.updateParticle(p);
            this.drawParticle(p);
        });

        // Draw connections 
        if (this.particles.length < 200) {
            this.drawConnections();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
let particleBg = null;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        particleBg = new ParticleBackground('particle-canvas');
    });
} else {
    particleBg = new ParticleBackground('particle-canvas');
}
