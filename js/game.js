// Phonedle - Game Logic

const STORAGE_KEY = "phonedle_stats";
const DAILY_KEY = "phonedle_daily";

// ─── Stats / Persistence ──────────────────────────────────────────────────────

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    return { ...defaultStats(), ...JSON.parse(raw) };
  } catch {
    return defaultStats();
  }
}

function defaultStats() {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, "7+": 0 },
  };
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function loadDailyState() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    // Only valid for today
    const today = getTodayString();
    if (state.date !== today) return null;
    return state;
  } catch {
    return null;
  }
}

function saveDailyState(state) {
  localStorage.setItem(DAILY_KEY, JSON.stringify({ ...state, date: getTodayString() }));
}

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// ─── Game State ───────────────────────────────────────────────────────────────

class PhonedleGame {
  constructor(mode = "daily") {
    this.mode = mode; // 'daily' | 'random'
    this.guesses = [];
    this.gameOver = false;
    this.won = false;
    this.stats = loadStats();
    this.hintCategoryIndex = null;
    this.maxGuesses = Infinity; // unlimited guesses, scoring based on count

    if (mode === "daily") {
      this._initDaily();
    } else {
      this._initRandom();
    }
  }

  _initDaily() {
    this.target = getDailyPhone();
    const seed = getDailySeed();
    this.hintCategoryIndex = getRandomHintCategory(seed);

    // Restore saved daily state
    const saved = loadDailyState();
    if (saved) {
      this.guesses = saved.guesses.map((name) => PHONES.find((p) => p.name === name)).filter(Boolean);
      this.gameOver = saved.gameOver;
      this.won = saved.won;
    }
  }

  _initRandom() {
    this.target = getRandomPhone();
    const seed = Math.floor(Math.random() * 1e9);
    this.hintCategoryIndex = getRandomHintCategory(seed);
    this.guesses = [];
    this.gameOver = false;
    this.won = false;
  }

  getHint() {
    const cat = CATEGORIES[this.hintCategoryIndex];
    const val = this.target[cat.key];
    let displayVal;
    if (cat.type === "date") {
      displayVal = `${this.target.releaseYear} Q${this.target.releaseQuarter}`;
    } else if (cat.type === "numeric") {
      displayVal = cat.key === "screenSize"
        ? parseFloat(val).toFixed(1) + cat.unit
        : val + cat.unit;
    } else {
      displayVal = val;
    }
    return { label: cat.label, value: displayVal, key: cat.key };
  }

  canGuess(phone) {
    if (this.gameOver) return false;
    if (this.guesses.some((g) => g.name === phone.name)) return false;
    return true;
  }

  submitGuess(phone) {
    if (!this.canGuess(phone)) return null;

    this.guesses.push(phone);
    const result = evaluateGuess(phone, this.target);

    const isWin = result.every((r) => r.result === "correct");
    if (isWin) {
      this.gameOver = true;
      this.won = true;
      this._recordResult(true);
    }

    if (this.mode === "daily") {
      saveDailyState({
        guesses: this.guesses.map((g) => g.name),
        gameOver: this.gameOver,
        won: this.won,
      });
    }

    return result;
  }

  giveUp() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.won = false;
    this._recordResult(false);
    if (this.mode === "daily") {
      saveDailyState({
        guesses: this.guesses.map((g) => g.name),
        gameOver: true,
        won: false,
      });
    }
  }

  _recordResult(won) {
    this.stats.played++;
    if (won) {
      this.stats.won++;
      this.stats.currentStreak++;
      this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);

      const count = this.guesses.length;
      const key = count <= 6 ? String(count) : "7+";
      this.stats.guessDistribution[key]++;
    } else {
      this.stats.currentStreak = 0;
    }
    saveStats(this.stats);
  }

  getScore() {
    if (!this.won) return 0;
    const n = this.guesses.length;
    if (n === 1) return 1000;
    if (n === 2) return 800;
    if (n === 3) return 600;
    if (n === 4) return 400;
    if (n === 5) return 200;
    return 100;
  }

  getShareText() {
    const lines = this.guesses.map((g) => {
      const result = evaluateGuess(g, this.target);
      return result
        .map((r) => {
          if (r.result === "correct") return "🟢";
          if (r.result === "close") return "🟠";
          return "⬜";
        })
        .join("");
    });
    const date = getTodayString();
    const modeStr = this.mode === "daily" ? `Daily ${date}` : "Random";
    const scoreStr = this.won ? `${this.guesses.length} guesses • ${this.getScore()} pts` : "Give up";
    return `📱 Phonedle – ${modeStr}\n${scoreStr}\n\n${lines.join("\n")}\n\nphonedle.app`;
  }

  // Get all results so far (for restoring UI)
  getAllResults() {
    return this.guesses.map((g) => ({
      phone: g,
      result: evaluateGuess(g, this.target),
    }));
  }

  // Search phones by name (autocomplete)
  searchPhones(query) {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return PHONES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }
}
