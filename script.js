const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let width, height, stars = [], comets = [];

function init() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5,
            opacity: Math.random(),
            speed: Math.random() * 0.01 + 0.005
        });
    }
}

function createComet() {
    comets.push({
        x: Math.random() * width * 1.5 - (width * 0.5),
        y: -50,
        vx: Math.random() * 10 + 5,
        vy: Math.random() * 5 + 5,
        len: Math.random() * 100 + 150,
        opacity: 1
    });
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    stars.forEach(s => {
        s.opacity += s.speed;
        if (s.opacity > 1 || s.opacity < 0.2) s.speed *= -1;
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });

    comets.forEach((c, i) => {
        const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 10, c.y - c.vy * 10);
        grad.addColorStop(0, `rgba(255, 255, 255, ${c.opacity})`);
        grad.addColorStop(0.2, `rgba(129, 140, 248, ${c.opacity * 0.6})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - c.vx * 6, c.y - c.vy * 6);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        c.x += c.vx;
        c.y += c.vy;
        c.opacity -= 0.006;

        if (c.opacity <= 0 || c.y > height || c.x > width) comets.splice(i, 1);
    });

    if (Math.random() < 0.015) createComet();
    requestAnimationFrame(draw);
}

window.addEventListener('resize', init);
init();
draw();