const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

// Pixelation Factor: Higher = more pixelated
const PIXEL_SCALE = 4;

let width, height;
let stars = [];
const numStars = 800; // Total stars
const arms = 3; // Spiral arms
const armSpread = 0.5; // How spread out the arms are

function resize() {
    // Set internal resolution lower than screen size
    width = Math.ceil(window.innerWidth / PIXEL_SCALE);
    height = Math.ceil(window.innerHeight / PIXEL_SCALE);

    canvas.width = width;
    canvas.height = height;

    // Scale up via CSS is handled, but we draw on small canvas
    initStars();
}

window.addEventListener('resize', resize);

class Star {
    constructor() {
        this.reset();
    }

    reset() {
        // Random distance from center
        this.dist = Math.random() * (Math.min(width, height) / 1.5);

        // Random angle offset based on distance to create spiral
        // Angle = distance * spiral_factor + arm_offset + random_spread
        const armIndex = Math.floor(Math.random() * arms);
        const armAngle = (Math.PI * 2 * armIndex) / arms;
        const spiralAngle = this.dist * 0.05; // Tightness of spiral
        const randomOffset = (Math.random() - 0.5) * armSpread;

        this.angle = armAngle + spiralAngle + randomOffset;

        // Convert polar to cartesian
        this.x = width / 2 + Math.cos(this.angle) * this.dist;
        this.y = height / 2 + Math.sin(this.angle) * this.dist;

        // Properties
        this.size = Math.random() < 0.9 ? 1 : 2; // Mostly 1px (which becomes 4px on screen)
        this.speed = (this.dist / 200) * 0.02 + 0.005; // Outer stars move faster angularly? Or slower? Let's rotate whole galaxy.

        // Color: Monochrome + Red Accents
        const rand = Math.random();
        if (rand > 0.95) {
            this.color = '#ff0000'; // Red accent
        } else if (rand > 0.7) {
            this.color = '#888888'; // Grey
        } else {
            this.color = '#ffffff'; // White
        }
    }

    update() {
        // Rotate around center
        const dx = this.x - width / 2;
        const dy = this.y - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);

        // Rotation speed
        angle += 0.002;

        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;

        // Check bounds? Not really needed for rotation, they stay in circle
    }

    draw() {
        ctx.fillStyle = this.color;
        // Draw integer coordinates for crisp pixel look
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
    }
}

function initStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }
}

function animate() {
    // Trail effect? Or clear?
    // Let's clear with slight opacity for trails? No, crisp pixels wanted.
    // Clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animate);
}

// Init
window.addEventListener('load', () => {
    resize();
    animate();
});
window.addEventListener('resize', resize);
