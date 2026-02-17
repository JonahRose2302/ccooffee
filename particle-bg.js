/**
 * WebGL Particle Background System
 * Coffee-themed floating particles with depth parallax
 */
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 150;
        this.mouse = { x: 0, y: 0 };
        this.scrollY = 0;
        
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
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.3 + 0.1,
                depth: Math.random() * 3, // 0-3 for parallax layers
                hue: Math.random() * 30 + 20, // Warm coffee tones
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
        });
    }

    updateParticle(p) {
        // Mouse interaction - magnetic attraction
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
            const force = (150 - dist) / 150;
            p.x += dx * force * 0.01;
            p.y += dy * force * 0.01;
        }

        // Parallax based on depth and scroll
        const parallaxFactor = 1 + p.depth * 0.3;
        p.y += p.speedY * parallaxFactor;
        p.x += p.speedX;

        // Scroll influence
        p.y -= this.scrollY * 0.001 * p.depth;

        // Wrap around screen
        if (p.y > this.canvas.height + 10) {
            p.y = -10;
            p.x = Math.random() * this.canvas.width;
        }
        if (p.x > this.canvas.width + 10) p.x = -10;
        if (p.x < -10) p.x = this.canvas.width + 10;
    }

    drawParticle(p) {
        this.ctx.beginPath();
        
        // Create gradient for coffee particle (golden-brown)
        const gradient = this.ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size
        );
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${p.opacity})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 70%, 40%, 0)`);
        
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
                    this.ctx.strokeStyle = `rgba(244, 196, 48, ${0.1 * (1 - dist / 100)})`;
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

        // Draw connections (optional, can be performance-intensive)
        if (this.particles.length < 100) {
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
