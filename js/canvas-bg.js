// Phonedle – Canvas Background
// Animated dot-grid with subtle floating particles

(function () {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  let W, H, dots, particles;
  const DOT_SPACING = 38;
  const PARTICLE_COUNT = 55;

  // ── Resize ────────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildDots();
  }

  // ── Dot grid ──────────────────────────────────────────────────────
  function buildDots() {
    dots = [];
    const cols = Math.ceil(W / DOT_SPACING) + 1;
    const rows = Math.ceil(H / DOT_SPACING) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x: c * DOT_SPACING,
          y: r * DOT_SPACING,
          base: 0.10 + Math.random() * 0.08,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.6,
        });
      }
    }
  }

  // ── Floating particles ────────────────────────────────────────────
  function buildParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle());
  }

  function makeParticle(atBottom = false) {
    return {
      x: Math.random() * (typeof W !== "undefined" ? W : window.innerWidth),
      y: atBottom
        ? (typeof H !== "undefined" ? H : window.innerHeight) + 10
        : Math.random() * (typeof H !== "undefined" ? H : window.innerHeight),
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(0.25 + Math.random() * 0.45),
      r:  1.0 + Math.random() * 1.6,
      alpha: 0.12 + Math.random() * 0.22,
      hue: Math.random() < 0.6 ? 248 : Math.random() < 0.5 ? 155 : 40,
    };
  }

  // ── Draw ──────────────────────────────────────────────────────────
  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    // Dots
    for (const d of dots) {
      const a = d.base * (0.7 + 0.3 * Math.sin(t * d.speed + d.phase));
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150,150,220,${a})`;
      ctx.fill();
    }

    // Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Fade near edges
      const edgeFade = Math.min(p.y / 80, (H - p.y) / 80, 1);
      const a = p.alpha * Math.max(edgeFade, 0);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},70%,70%,${a})`;
      ctx.fill();

      if (p.y < -10) particles[i] = makeParticle(true);
    }

    requestAnimationFrame(draw);
  }

  // ── Init ──────────────────────────────────────────────────────────
  resize();
  buildParticles();
  draw();

  window.addEventListener("resize", resize);
})();
