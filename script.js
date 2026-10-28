/* ================================================
   zkv106 — Lightweight Synthwave  (Raspberry Pi OK)
   
   Strategy:
   1. Pre-render static scene (sky, sun, mountains) 
      to offscreen canvas — drawn ONCE
   2. Only animate grid lines scrolling + star twinkle
   3. Throttle to 24 fps
   4. No cursor trail, no particles, no blur filters
   5. Grid loops seamlessly every LOOP_PX pixels
   ================================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('retro-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H;
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        buildStatic();          // rebuild cached bg on resize
        buildStars();
    }
    window.addEventListener('resize', resize);

    /* ============ OFFSCREEN STATIC CANVAS ============ */
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');

    function buildStatic() {
        offscreen.width  = W;
        offscreen.height = H;

        drawSky(offCtx);
        drawSun(offCtx);
        drawMountains(offCtx);
        drawTopGrid(offCtx);

        // Dark ground fill (under bottom grid)
        const horizonY = Math.round(H * 0.62);
        const grd = offCtx.createLinearGradient(0, horizonY, 0, H);
        grd.addColorStop(0, '#1a0835');
        grd.addColorStop(1, '#08040f');
        offCtx.fillStyle = grd;
        offCtx.fillRect(0, horizonY, W, H - horizonY);

        // Static vertical grid lines (they don't move)
        drawVerticalGrid(offCtx, horizonY);
    }

    /* ---- Sky ---- */
    function drawSky(c) {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0,    '#0a0618');
        g.addColorStop(0.20, '#1a0a3e');
        g.addColorStop(0.38, '#3d1560');
        g.addColorStop(0.48, '#6b1d6e');
        g.addColorStop(0.55, '#a02060');
        g.addColorStop(0.60, '#d04848');
        g.addColorStop(0.65, '#e87030');
        g.addColorStop(0.70, '#f0a020');
        g.addColorStop(0.75, '#f0c860');
        g.addColorStop(1,    '#0a0618');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
    }

    /* ---- Pixel Sun ---- */
    function drawSun(c) {
        const horizonY = Math.round(H * 0.62);
        const cx = W / 2;
        const cy = horizonY - 10;
        const R  = Math.min(W, H) * 0.16;
        const px = 4;

        for (let y = -R; y <= R; y += px) {
            const dy = y / R;
            if (Math.floor((y + R) / (px * 3)) % 3 === 0 && Math.abs(dy) > 0.2) continue;
            const hw = Math.sqrt(1 - dy * dy) * R;
            const t  = (y + R) / (2 * R);
            c.fillStyle = `rgb(255,${220 - t * 180 | 0},${60 + t * 40 | 0})`;
            const sx = Math.floor((cx - hw) / px) * px;
            const ex = Math.ceil((cx + hw) / px) * px;
            for (let x = sx; x < ex; x += px) c.fillRect(x, cy + y, px, px);
        }

        // glow
        const gl = c.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.5);
        gl.addColorStop(0,   'rgba(255,160,60,0.10)');
        gl.addColorStop(0.5, 'rgba(224,64,80,0.05)');
        gl.addColorStop(1,   'transparent');
        c.fillStyle = gl;
        c.fillRect(0, 0, W, H);
    }

    /* ---- Pixel Mountains ---- */
    function drawMountains(c) {
        const horizonY = Math.round(H * 0.62);
        const px = 4;
        const layers = [
            { peaks: [[0,.12],[.15,.18],[.30,.10],[.45,.20],[.60,.14],[.75,.18],[.90,.10],[1,.14]], col: 'rgb(40,20,70)' },
            { peaks: [[0,.06],[.12,.10],[.28,.14],[.45,.08],[.60,.12],[.78,.06],[.90,.10],[1,.07]], col: 'rgb(30,12,55)' },
        ];
        layers.forEach(l => {
            c.fillStyle = l.col;
            for (let x = 0; x < W; x += px) {
                const nx = x / W;
                let h = 0;
                for (let i = 0; i < l.peaks.length - 1; i++) {
                    if (nx >= l.peaks[i][0] && nx <= l.peaks[i + 1][0]) {
                        const t = (nx - l.peaks[i][0]) / (l.peaks[i + 1][0] - l.peaks[i][0]);
                        h = l.peaks[i][1] * (1 - t) + l.peaks[i + 1][1] * t;
                        break;
                    }
                }
                const my = Math.floor((horizonY - h * H) / px) * px;
                for (let y = my; y < horizonY; y += px) c.fillRect(x, y, px, px);
            }
        });
    }

    /* ---- Top Grid (static) ---- */
    function drawTopGrid(c) {
        const top = H * 0.15;
        const vanX = W / 2;
        c.strokeStyle = 'rgba(80,120,255,0.12)';
        c.lineWidth = 0.6;
        for (let i = 0; i < 8; i++) {
            const t = i / 8;
            const y = top - top * (t * t);
            c.globalAlpha = (1 - t) * 0.4;
            c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }
        c.globalAlpha = 0.15;
        for (let i = -12; i <= 12; i++) {
            c.beginPath();
            c.moveTo(vanX + i * 1.2, top);
            c.lineTo(vanX + i * (W / 12) * 1.1, 0);
            c.stroke();
        }
        c.globalAlpha = 1;
    }

    /* ---- Vertical Grid on Ground (static) ---- */
    function drawVerticalGrid(c, horizonY) {
        const vanX = W / 2;
        c.strokeStyle = 'rgba(160,40,120,0.25)';
        c.lineWidth = 0.7;
        for (let i = -18; i <= 18; i++) {
            c.beginPath();
            c.moveTo(vanX + i * 1.5, horizonY);
            c.lineTo(vanX + i * (W / 18) * 1.2, H);
            c.stroke();
        }
    }


    /* ============ STARS (pre-generated, twinkle via sin) ============ */
    let starData = [];

    function buildStars() {
        starData = [];
        const count = 50;
        const cols = ['255,255,255','200,180,255','255,200,220','180,220,255','255,230,140'];
        for (let i = 0; i < count; i++) {
            starData.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.58,
                sz: Math.random() < 0.15 ? 3 : (Math.random() < 0.35 ? 2 : 1),
                cross: Math.random() < 0.1,
                phase: Math.random() * Math.PI * 2,
                col: cols[Math.random() * cols.length | 0],
            });
        }
    }

    function drawStars(frame) {
        for (const s of starData) {
            const a = 0.25 + 0.75 * Math.abs(Math.sin(s.phase + frame * 0.015));
            ctx.fillStyle = `rgba(${s.col},${a})`;
            if (s.cross) {
                ctx.fillRect(s.x - s.sz, s.y, s.sz * 2 + 1, 1);
                ctx.fillRect(s.x, s.y - s.sz, 1, s.sz * 2 + 1);
            } else {
                ctx.fillRect(s.x, s.y, s.sz, s.sz);
            }
        }
    }


    /* ============ ANIMATED BOTTOM GRID (horizontal lines only) ============ */
    // Loop every LOOP_PX pixels so it tiles seamlessly
    const H_LINES   = 18;
    const LOOP_PX   = 40;   // grid loops every 40px of offset
    const SPEED     = 0.35;
    let gridOffset  = 0;

    function drawHorizontalGrid() {
        const horizonY = Math.round(H * 0.62);
        const span = H - horizonY;

        gridOffset = (gridOffset + SPEED) % LOOP_PX;  // seamless loop

        for (let i = 0; i < H_LINES; i++) {
            const t = (i / H_LINES) + (gridOffset / (H_LINES * LOOP_PX));
            if (t > 1) continue;
            const y = horizonY + span * (t * t);
            if (y > H || y < horizonY) continue;

            const bright = i % 4 === 0;
            ctx.strokeStyle = bright
                ? `rgba(224,64,160,${t * 0.55})`
                : `rgba(160,40,120,${t * 0.28})`;
            ctx.lineWidth = bright ? 1.3 : 0.7;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // horizon glow (single rect, cheap)
        ctx.fillStyle = 'rgba(224,100,160,0.18)';
        ctx.fillRect(0, horizonY - 2, W, 4);
    }


    /* ============ MAIN LOOP — throttled to ~24 fps ============ */
    const FRAME_MS = 1000 / 24;
    let lastTime = 0;
    let frame = 0;

    function loop(now) {
        requestAnimationFrame(loop);
        if (now - lastTime < FRAME_MS) return;
        lastTime = now;
        frame++;

        // 1. Stamp cached static bg
        ctx.drawImage(offscreen, 0, 0);

        // 2. Animated horizontal grid lines
        drawHorizontalGrid();

        // 3. Stars twinkle
        drawStars(frame);
    }

    // kick off
    resize();
    requestAnimationFrame(loop);


    /* ============ SCROLL REVEAL + LEVEL BARS ============ */
    const cards = document.querySelectorAll('.skill-card');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                const bar = e.target.querySelector('.level-bar');
                if (bar) setTimeout(() => { bar.style.width = bar.dataset.level + '%'; }, 300);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => obs.observe(c));


    /* ============ TYPED TEXT ============ */
    const typedEl = document.getElementById('typed-text');
    if (typedEl) {
        const phrases = [
            'developer / designer / linux enthusiast',
            'ctrl+c ctrl+v engineer',
            'mass ls -la enjoyer',
            'segfault survivor',
            'sudo make me a sandwich',
            'it works on my machine™',
            'git push --force i modlitwa',
            'stackoverflow copy paste expert',
            'naprawiam bugi bugami',
            'czemu to dziala? nie ruszaj.',
            'nie dotykaj jak dziala challenge',
            '10 tabów chrome = 32GB RAM gone',
            'dark mode everything',
            'kiedys napisze dokumentacje... kiedys.',
            'localhost:3000 > real life',
            'sleep(0); // optymalizacja',
            'wyłącz i włącz ponownie™',
            'if (works) dont.touch();',
            'ale na renderze wygladalo dobrze...',
            'coffee.drink() while(!asleep)',
            'rm -rf node_modules // naprawia wszystko',
            'USB wchodzi za 3 razem. zawsze.',
            '// todo: zrobic to lepiej (2019)',
            'console.log("tutaj dziala")',
            'a to jest znany bug, nie feature',
            'zaraz wracam... *3h pozniej*',
            'kompiluje sie? git commit.',
        ];
        let pIdx = 0, cIdx = 0, del = false, pause = 0;

        function tick() {
            const p = phrases[pIdx];
            if (!del) {
                typedEl.textContent = p.substring(0, ++cIdx);
                if (cIdx >= p.length) { pause = 70; del = true; }
            } else {
                if (pause > 0) { pause--; requestAnimationFrame(tick); return; }
                typedEl.textContent = p.substring(0, --cIdx);
                if (cIdx < 0) { del = false; cIdx = 0; pIdx = (pIdx + 1) % phrases.length; pause = 15; }
            }
            setTimeout(() => requestAnimationFrame(tick), del ? 22 : 30 + Math.random() * 45);
        }
        tick();
    }

})();
