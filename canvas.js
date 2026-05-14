const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let planets = [];
let mouse = { x: null, y: null };

const PARTICLE_COUNT = 120;
const PLANET_COUNT = 4;
const CONNECTION_DIST = 140;
const MOUSE_RADIUS = 150;

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
        this.twinkleSpeed = 0.01 + Math.random() * 0.05;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.twinklePhase += this.twinkleSpeed;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (mouse.x !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
                let force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                this.x -= dx * force * 0.03;
                this.y -= dy * force * 0.03;
            }
        }
    }

    draw() {
        const opacity = 0.3 + Math.abs(Math.sin(this.twinklePhase)) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Planet {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 40 + 20;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.1;
        this.color = `hsla(0, 0%, ${Math.random() * 20 + 5}%, 0.5)`; // Dark gray
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.radius * 2) this.x = width + this.radius;
        if (this.x > width + this.radius * 2) this.x = -this.radius;
        if (this.y < -this.radius * 2) this.y = height + this.radius;
        if (this.y > height + this.radius * 2) this.y = -this.radius;
    }

    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.x - this.radius/3, this.y - this.radius/3, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, 'rgba(60, 60, 60, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255,255,255,0.05)';
        ctx.fill();
        
        // Subtle ring
        if (Math.random() > 0.7) {
           ctx.strokeStyle = 'rgba(255,255,255,0.05)';
           ctx.lineWidth = 1;
           ctx.beginPath();
           ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius * 0.4, Math.PI/4, 0, Math.PI * 2);
           ctx.stroke();
        }
        ctx.restore();
    }
}

function init() {
    particles = [];
    planets = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    for (let i = 0; i < PLANET_COUNT; i++) planets.push(new Planet());
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    init();
}

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    planets.forEach(p => { p.update(); p.draw(); });

    for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dx = p1.x - p2.x;
            let dy = p1.y - p2.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONNECTION_DIST) {
                let opacity = (1 - (dist / CONNECTION_DIST)) * 0.15;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animate);
}

window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
window.addEventListener('resize', resize);
window.addEventListener('load', () => { resize(); animate(); });
