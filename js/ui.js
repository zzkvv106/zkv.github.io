// Phonedle – UI Logic (redesigned)

// ── SVG icons for categories (inline, rendered into header + hint) ────────────
const CAT_ICONS = {
  manufacturer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,
  chip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <rect x="9" y="9" width="6" height="6" rx="1"/>
    <path d="M15 9V6M9 9V6M15 15v3M9 15v3M9 9H6M9 15H6M15 9h3M15 15h3"/>
  </svg>`,
  screenSize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <line x1="9" y1="7" x2="15" y2="7"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>`,
  brightness: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`,
  mainCamera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`,
  maxCharging: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,
  releaseYear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`,
};

// ── State ─────────────────────────────────────────────────────────────────────
let game = null;
let selectedPhone = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initGame("daily");
  setupModeButtons();
  setupSearch();
  setupModals();
});

function initGame(mode) {
  game = new PhonedleGame(mode);
  selectedPhone = null;

  // Reset grid
  const grid = document.getElementById("guess-grid");
  grid.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.id = "empty-hint";
  empty.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Search for a phone above and hit <strong>Guess</strong> to start`;
  grid.appendChild(empty);

  updateSubmitButton();
  renderHint();
  renderColumnHeaders();

  // Restore daily saves
  game.getAllResults().forEach(({ phone, result }) => appendGuessRow(phone, result, false));

  updateStreakDisplay();
  if (game.gameOver) setTimeout(() => showResultModal(), 450);
}

// ── Mode ──────────────────────────────────────────────────────────────────────
function setupModeButtons() {
  document.getElementById("btn-daily").addEventListener("click", () => { setMode("daily"); initGame("daily"); });
  document.getElementById("btn-random").addEventListener("click", () => { setMode("random"); initGame("random"); });
}
function setMode(m) {
  document.getElementById("btn-daily").classList.toggle("active", m === "daily");
  document.getElementById("btn-random").classList.toggle("active", m === "random");
}

// ── Hint ──────────────────────────────────────────────────────────────────────
function renderHint() {
  if (!game) return;
  const hint = game.getHint();
  document.getElementById("hint-label").textContent = hint.label;
  document.getElementById("hint-value").textContent = hint.value;
  document.getElementById("hint-icon-wrap").innerHTML = CAT_ICONS[hint.key] || "";
}

// ── Column headers ────────────────────────────────────────────────────────────
function renderColumnHeaders() {
  const hdr = document.getElementById("grid-header");
  hdr.innerHTML = "";

  const nameTh = document.createElement("div");
  nameTh.className = "col-header col-name";
  nameTh.textContent = "Phone";
  hdr.appendChild(nameTh);

  CATEGORIES.forEach((cat) => {
    const th = document.createElement("div");
    th.className = "col-header";
    th.innerHTML = (CAT_ICONS[cat.key] || "") + `<span>${cat.label}</span>`;
    hdr.appendChild(th);
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("search-input");
  const dd    = document.getElementById("search-dropdown");

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) { hideDd(); selectedPhone = null; updateSubmitButton(); return; }
    renderDd(game.searchPhones(q));
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = dd.querySelector(".dropdown-item"); if (first && !first.classList.contains("already-guessed")) first.click(); }
    if (e.key === "Escape") hideDd();
  });

  document.addEventListener("click", (e) => { if (!e.target.closest("#search-wrapper")) hideDd(); });
  document.getElementById("submit-btn").addEventListener("click", submitGuess);
}

function renderDd(phones) {
  const dd = document.getElementById("search-dropdown");
  dd.innerHTML = "";
  if (!phones.length) {
    dd.innerHTML = '<div class="dropdown-empty">No phones found</div>';
    dd.classList.add("visible");
    return;
  }
  phones.forEach((p) => {
    const already = game.guesses.some((g) => g.name === p.name);
    const item = document.createElement("div");
    item.className = "dropdown-item" + (already ? " already-guessed" : "");
    item.innerHTML = `<span class="dd-brand">${p.manufacturer}</span><span class="dd-name">${p.name}</span>`;
    if (!already) item.addEventListener("click", () => pickPhone(p));
    dd.appendChild(item);
  });
  dd.classList.add("visible");
}

function pickPhone(p) {
  selectedPhone = p;
  document.getElementById("search-input").value = p.name;
  hideDd();
  updateSubmitButton();
  document.getElementById("search-input").focus();
}

function hideDd() { document.getElementById("search-dropdown").classList.remove("visible"); }
function updateSubmitButton() { document.getElementById("submit-btn").disabled = !selectedPhone || game.gameOver; }

// ── Submit ────────────────────────────────────────────────────────────────────
function submitGuess() {
  if (!selectedPhone || game.gameOver) return;
  if (!game.canGuess(selectedPhone)) {
    const inp = document.getElementById("search-input");
    inp.classList.add("shake");
    setTimeout(() => inp.classList.remove("shake"), 400);
    return;
  }

  const result = game.submitGuess(selectedPhone);
  if (!result) return;

  appendGuessRow(selectedPhone, result, true);
  document.getElementById("search-input").value = "";
  selectedPhone = null;
  updateSubmitButton();
  updateStreakDisplay();

  if (game.gameOver) setTimeout(() => showResultModal(), 850);
}

// ── Guess row ─────────────────────────────────────────────────────────────────
function appendGuessRow(phone, result, animate) {
  const grid = document.getElementById("guess-grid");
  const emptyEl = document.getElementById("empty-hint");
  if (emptyEl) emptyEl.remove();

  const row = document.createElement("div");
  row.className = "guess-row";
  row.setAttribute("role", "listitem");

  // Name cell
  const nameCell = document.createElement("div");
  nameCell.className = "name-cell";
  nameCell.innerHTML = `<div class="phone-brand">${phone.manufacturer}</div><div class="phone-model">${phone.name}</div>`;
  row.appendChild(nameCell);

  // Result tiles
  result.forEach((r, i) => {
    const tile = document.createElement("div");
    tile.className = `guess-tile tile-${r.result}`;
    if (animate) {
      tile.style.opacity = "0";
      setTimeout(() => {
        tile.style.opacity = "";
        tile.classList.add("tile-reveal");
      }, i * 70);
    }

    const arrowSvg = r.direction === "up"
      ? `<svg class="tile-dir" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;margin-top:3px"><polyline points="18 15 12 9 6 15"/></svg>`
      : r.direction === "down"
      ? `<svg class="tile-dir" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px;margin-top:3px"><polyline points="6 9 12 15 18 9"/></svg>`
      : "";

    tile.innerHTML = `<div class="tile-val">${r.displayValue}</div>${arrowSvg}`;
    row.appendChild(tile);
  });

  grid.appendChild(row);
  grid.scrollTop = grid.scrollHeight;
}

// ── Streak ────────────────────────────────────────────────────────────────────
function updateStreakDisplay() {
  document.getElementById("streak-value").textContent = game.stats.currentStreak;
}

// ── Modals ────────────────────────────────────────────────────────────────────
function setupModals() {
  document.getElementById("stats-btn").addEventListener("click", showStatsModal);
  document.getElementById("help-btn").addEventListener("click", () => document.getElementById("help-modal").classList.add("visible"));
  document.getElementById("give-up-btn").addEventListener("click", doGiveUp);
  document.getElementById("share-btn").addEventListener("click", doShare);
  document.getElementById("play-again-btn").addEventListener("click", () => {
    document.getElementById("result-modal").classList.remove("visible");
    setMode("random");
    initGame("random");
  });

  document.querySelectorAll(".modal-close").forEach((btn) =>
    btn.addEventListener("click", () => btn.closest(".modal-overlay").classList.remove("visible"))
  );
  document.querySelectorAll(".modal-overlay").forEach((ov) =>
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("visible"); })
  );
}

function showResultModal() {
  const stats = game.stats;
  document.getElementById("result-title").textContent = game.won ? "🎉 Correct!" : "😔 Better luck next time!";
  document.getElementById("result-phone").textContent = game.target.name;

  const scoreEl = document.getElementById("result-score");
  if (game.won) {
    scoreEl.textContent = game.getScore();
    scoreEl.classList.remove("score-won-zero");
  } else {
    scoreEl.textContent = "0";
    scoreEl.classList.add("score-won-zero");
  }

  document.getElementById("result-guesses").textContent = game.guesses.length;
  document.getElementById("result-streak").textContent = stats.currentStreak;
  document.getElementById("result-winpct-modal").textContent =
    stats.played ? Math.round((stats.won / stats.played) * 100) + "%" : "—";

  document.getElementById("play-again-btn").style.display = game.mode === "random" ? "inline-flex" : "none";

  renderDistInto(stats, document.getElementById("result-dist-bars"));
  document.getElementById("result-modal").classList.add("visible");
}

function showStatsModal() {
  const stats = game.stats;
  document.getElementById("stat-played").textContent = stats.played;
  document.getElementById("stat-winpct").textContent = stats.played ? Math.round((stats.won / stats.played) * 100) + "%" : "0%";
  document.getElementById("stat-streak").textContent = stats.currentStreak;
  document.getElementById("stat-max-streak").textContent = stats.maxStreak;
  renderDistInto(stats, document.getElementById("stats-dist-bars"));
  document.getElementById("stats-modal").classList.add("visible");
}

function renderDistInto(stats, container) {
  if (!container) return;
  container.innerHTML = "";
  const keys = ["1","2","3","4","5","6","7+"];
  const max = Math.max(...keys.map((k) => stats.guessDistribution[k] || 0), 1);
  keys.forEach((k) => {
    const val = stats.guessDistribution[k] || 0;
    const pct = Math.max(Math.round((val / max) * 100), 3);
    const row = document.createElement("div");
    row.className = "dist-row";
    row.innerHTML = `
      <div class="dist-lbl">${k}</div>
      <div class="dist-bar-wrap">
        <div class="dist-bar" style="width:${pct}%">${val}</div>
      </div>`;
    container.appendChild(row);
  });
}

function doGiveUp() {
  if (game.gameOver) return;
  if (!confirm(`Give up? You'll see the answer.`)) return;
  game.giveUp();
  updateStreakDisplay();
  showResultModal();
}

async function doShare() {
  const text = game.getShareText();
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("share-btn");
    const orig = btn.innerHTML;
    btn.innerHTML = "✅ Copied!";
    setTimeout(() => (btn.innerHTML = orig), 2000);
  } catch {
    alert(text);
  }
}
